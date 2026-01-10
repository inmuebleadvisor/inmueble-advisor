import React, { useState, useEffect } from 'react';
import { useService } from '../../hooks/useService';
import AppointmentScheduler from '../common/AppointmentScheduler';
import { useUser } from '../../context/UserContext';
import confetti from 'canvas-confetti';
import { getFunctions, httpsCallable } from 'firebase/functions'; // ✅ CAPI Import
import '../../styles/LeadCaptureForm.css';

const LeadCaptureForm = ({ desarrollo, modelo, onSuccess, onCancel }) => {
    const { user, userProfile, loginWithGoogle } = useUser();
    const { leadAssignment, meta: metaService } = useService();

    // --- STATE ---
    const [step, setStep] = useState(1); // 1: Date, 2: Info
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Duplicate Maintenance
    const [existingAppointment, setExistingAppointment] = useState(null);
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        citainicial: null
    });

    // Determine context for display
    const contextName = modelo?.nombre_modelo || desarrollo?.nombre || "Propiedad Exclusiva";

    // --- EFFECT: Load User Data & Check Appointments ---
    useEffect(() => {
        if (user) {
            // Prefill User Data
            setFormData(prev => ({
                ...prev,
                nombre: userProfile?.nombre || user.displayName || '',
                email: userProfile?.email || user.email || '',
                telefono: userProfile?.telefono || ''
            }));

            // Check for existing active appointment
            // console.log("🔍 [UI] Checking appointment for dev:", desarrollo?.id);
            if (desarrollo?.id) {
                const checkAppointment = async () => {
                    setLoading(true);
                    // console.log("🔍 [UI] Invoking service...");
                    const { hasAppointment, appointment } = await leadAssignment.checkActiveAppointment(user.uid, desarrollo.id);
                    // console.log("🔍 [UI] Result:", { hasAppointment, appointment });
                    if (hasAppointment) {
                        setExistingAppointment(appointment);
                    }
                    setLoading(false);
                };
                checkAppointment();
            } else {
                console.warn("⚠️ [UI] No desarrollo ID found in props:", desarrollo);
            }
        }
    }, [user, userProfile, desarrollo?.id, leadAssignment]);

    // --- HANDLERS ---
    const handleNext = () => setStep(2);
    const handleBack = () => setStep(1);

    const handleSubmit = async () => {
        if (!formData.nombre || !formData.telefono || !formData.citainicial) {
            setError("Por favor completa todos los campos requeridos.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Prepare data for service
            const datosCliente = {
                nombre: formData.nombre,
                telefono: formData.telefono,
                email: formData.email
            };

            // Generate Lead OR Reschedule
            let result;

            // ✅ META TRACKING: STRICT FLOW
            const metaEventId = metaService.generateEventId();
            const fbp = metaService.getFbp();
            const fbc = metaService.getFbc();
            const clientUserAgent = navigator.userAgent;

            // Normalize Phone for Meta Match Quality
            const rawPhone = formData.telefono || '';
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

            // Prepare PII for Advanced Matching (Browser)
            const pii = {
                em: formData.email,
                ph: normalizedPhone, // ✅ Normalized
                fn: formData.nombre?.split(' ')[0] || '',
                ln: formData.nombre?.split(' ').slice(1).join(' ') || ''
            };
            // 1. Set User Data for Browser Pixel (Advanced Matching)
            metaService.setUserData(pii);

            if (isRescheduling && existingAppointment) {
                // RESCHEDULE FLOW
                // Tracking Metada for CAPI updates
                const trackingData = {
                    metaEventId,
                    fbp,
                    fbc,
                    clientUserAgent: navigator.userAgent,
                    urlOrigen: window.location.href, // ✅ Fix URL Freshness
                    conversionStatus: 'rescheduled' // ✅ Pass Status
                };

                result = await leadAssignment.rescheduleAppointment(
                    existingAppointment.id,
                    formData.citainicial,
                    trackingData // ✅ Pass Tracking Context
                );
                // Track Schedule Update
                metaService.track('Schedule', {
                    content_name: desarrollo?.nombre,
                    content_category: 'Vivienda Nueva',
                    currency: 'MXN',
                    value: modelo?.precios?.base || modelo?.precio || 0,
                    status: 'rescheduled'
                }, metaEventId); // ✅ REMOVED SUFFIX for Deduplication

            } else {
                // NEW LEAD FLOW

                // 2. Track Browser Event (Hybrid Deduplication)

                const browserPayload = {
                    eventName: 'Schedule',
                    eventId: metaEventId,
                    params: {
                        content_name: desarrollo?.nombre,
                        content_category: 'Vivienda Nueva',
                        currency: 'MXN',
                        value: modelo?.precios?.base || modelo?.precio || 0,
                        status: 'scheduled'
                    }
                };

                // ✅ STANDARDIZED SYNC LOG
                console.log(`[Meta Sync] Browser Payload:`, browserPayload);

                metaService.track('Schedule', browserPayload.params, metaEventId);

                result = await leadAssignment.generarLeadAutomatico(
                    datosCliente,
                    desarrollo?.id,
                    desarrollo?.nombre,
                    modelo?.nombreModelo || modelo?.nombre_modelo,
                    user?.uid,
                    desarrollo?.idDesarrollador,
                    modelo?.precios?.base || modelo?.precio || 0,
                    {
                        origen: 'web_cita_vip',
                        urlOrigen: window.location.href,
                        citainicial: formData.citainicial,
                        idModelo: modelo?.id || null,
                        // ✅ PASS TRACKING DATA
                        metaEventId,
                        fbp,
                        fbc,
                        clientUserAgent,
                        clientIp: null, // IP is automatic in Callable

                        snapshot: {
                            idModelo: modelo?.id || null,
                            modeloNombre: modelo?.nombreModelo || modelo?.nombre_modelo || "N/A",
                            desarrolloNombre: desarrollo?.nombre || "N/A",
                            precioAtCapture: modelo?.precios?.base || modelo?.precio || 0,
                            conversionStatus: 'scheduled' // ✅ Pass Status
                        }
                    }
                );

                // 3. ☁️ META CAPI: Invoke Cloud Function Explicitly
                if (result.success && result.leadId) {
                    try {
                        const functionsInstance = getFunctions();
                        const onLeadCreatedMETA = httpsCallable(functionsInstance, 'onLeadCreatedMETA');

                        console.log("☁️ [Meta CAPI] Invoking Cloud Function...", { leadId: result.leadId });

                        // Fire and Forget (don't await strictly to not block UI)
                        onLeadCreatedMETA({
                            leadId: result.leadId,
                            leadData: {
                                ...datosCliente,
                                metaEventId,
                                fbp,
                                fbc,
                                clientUserAgent,
                                urlOrigen: window.location.href,
                                nombreDesarrollo: desarrollo?.nombre,
                                snapshot: { precioAtCapture: modelo?.precios?.base || modelo?.precio || 0 }
                            }
                        }).then((resp) => {
                            console.log("☁️ [Meta CAPI] Success:", resp.data);
                        }).catch((metaErr) => {
                            console.error("☁️ [Meta CAPI] Failed:", metaErr);
                        });

                    } catch (e) {
                        console.error("☁️ [Meta CAPI] Invocation Error:", e);
                    }
                }
            }

            if (!result.success) {
                throw new Error(result.error || "Error desconocido al generar el lead.");
            }

            // Trigger Confetti
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.7 },
                zIndex: 10000,
                colors: ['#f59e0b', '#ffffff']
            });

            // Show Success View instead of closing
            setIsSuccess(true);

        } catch (err) {
            console.error(err);
            setError("Hubo un error al agendar. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseFinal = () => {
        if (onSuccess) onSuccess(); // Notify parent to close/refresh
        else onCancel();
    };

    // --- RENDER HELPERS ---

    // Gated Content Check
    if (!user) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)' }}>
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center max-w-sm w-full shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">Acceso VIP</h3>
                    <p className="text-gray-400 text-sm mb-6">Inicia sesión para agendar tu visita exclusiva.</p>
                    <button
                        onClick={() => loginWithGoogle()}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                        Continuar con Google
                    </button>
                    <button onClick={onCancel} className="mt-4 text-xs text-gray-500 hover:text-white transition-colors">Cancelar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="lead-capture-form__overlay">
            <div className="lead-capture-form__card">

                {/* CLOSE BUTTON */}
                {!isSuccess && (
                    <button onClick={onCancel} className="lead-capture-form__close-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                )}

                {/* HEADER */}
                {!isSuccess && (
                    <div className="lead-capture-form__header">
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Agenda tu Visita VIP</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', fontWeight: 700 }}>
                            Proyecto {contextName}
                        </p>
                    </div>
                )}

                {/* USER STRIP */}
                {!isSuccess && (
                    <div className="lead-capture-form__user-strip">
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontWeight: 500 }}>
                            Solicitando como: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{formData.nombre || 'Invitado'}</span>
                        </p>
                    </div>
                )}

                {/* PROGRESS */}
                {!isSuccess && (
                    <div style={{ padding: '0 32px', marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            <span>
                                {isRescheduling ? 'Reprogramar Cita' : (step === 1 ? 'Paso 1: Selecciona Fecha' : 'Paso 2: Confirma Datos')}
                            </span>
                            <span>{step}/2</span>
                        </div>
                        <div className="lead-capture-form__progress-bar">
                            <div className="lead-capture-form__progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
                        </div>
                    </div>
                )}

                {/* CONTENT AREA */}
                <div className="lead-capture-form__content">

                    {/* DUPLICATE WARNING VIEW */}
                    {!isSuccess && !isRescheduling && existingAppointment && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
                                📅
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Ya tienes una cita agendada</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '90%', margin: '0 auto 24px', lineHeight: '1.5' }}>
                                Vemos que ya tienes una visita programada para <strong>{desarrollo?.nombre || 'este desarrollo'}</strong>.
                                <br />No es necesario crear una nueva solicitud.
                            </p>

                            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155', marginBottom: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Fecha Actual</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700, color: 'white' }}>
                                        {existingAppointment.citainicial?.dia?.toDate
                                            ? existingAppointment.citainicial.dia.toDate().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                                            : new Date(existingAppointment.citainicial?.dia).toLocaleDateString('es-MX')}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Hora</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
                                        {existingAppointment.citainicial?.hora}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={onCancel}
                                    className="lead-capture-form__btn-secondary"
                                    style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px 24px', color: 'white' }}
                                >
                                    Entendido, mantener cita
                                </button>
                                <button
                                    onClick={() => {
                                        setIsRescheduling(true);
                                        setStep(1); // Go to Scheduler
                                    }}
                                    className="lead-capture-form__btn-primary"
                                    style={{ boxShadow: 'none' }}
                                >
                                    Cambiar Día/Hora
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS VIEW (STEP 3) */}
                    {isSuccess && (
                        <div style={{ animation: 'scaleIn 0.5s ease-out', textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                {isRescheduling ? '¡Cita Actualizada!' : '¡Cita Confirmada!'}
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '80%', margin: '0 auto 32px', lineHeight: '1.6' }}>
                                Tu visita a <strong>{desarrollo?.nombre || 'este desarrollo'}</strong> ha sido {isRescheduling ? 'reprogramada' : 'agendada'} con éxito.
                            </p>

                            {/* Reservation Ticket */}
                            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px', maxWidth: '400px', margin: '0 auto', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: '#f59e0b' }}></div>
                                <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '1px' }}>Detalles de tu Reserva</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '24px' }}>📅</span>
                                    <span style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
                                        {formData.citainicial?.dia ? formData.citainicial.dia.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '24px' }}>⏰</span>
                                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                                        {formData.citainicial?.hora}
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '32px' }}>
                                Un asesor se pondrá en contacto contigo vía WhatsApp para confirmar detalles.
                            </p>
                        </div>
                    )}

                    {!isSuccess && (!existingAppointment || isRescheduling) && step === 1 && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <AppointmentScheduler
                                onSelect={(cita) => {
                                    setFormData(prev => ({ ...prev, citainicial: cita }));
                                    setError(null);
                                }}
                                initialDate={new Date()}
                            />
                        </div>
                    )}

                    {!isSuccess && (!existingAppointment || isRescheduling) && step === 2 && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* SUMMARY CARD */}
                            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', backgroundColor: '#334155', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📅</div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>Tu Reserva</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>
                                            {formData.citainicial?.dia ? formData.citainicial.dia.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) : '---'}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>{formData.citainicial?.hora || '--:--'} - Visita VIP</p>
                                    </div>
                                </div>
                                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Cambiar</button>
                            </div>

                            {/* INPUTS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* NAME */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Nombre Completo</label>
                                    <div className="lead-capture-form__input-group">
                                        <span style={{ color: '#64748b' }}>💼</span>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="lead-capture-form__input"
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                </div>

                                {/* PHONE */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>WhatsApp</label>
                                    <div className="lead-capture-form__input-group">
                                        <span style={{ color: '#64748b' }}>💬</span>
                                        <input
                                            type="tel"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="lead-capture-form__input"
                                            placeholder="Tu número de celular"
                                        />
                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Email (Verificado)</label>
                                    <div className="lead-capture-form__input-group" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                                        <span style={{ color: '#64748b' }}>✉️</span>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            className="lead-capture-form__input"
                                            style={{ color: '#94a3b8', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ERROR MSG */}
                            {error && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>⚠️ {error}</p>}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="lead-capture-form__footer">
                    {isSuccess ? (
                        <button
                            onClick={handleCloseFinal}
                            className="lead-capture-form__btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Entendido, Cerrar Ventana
                        </button>
                    ) : (
                        step === 1 ? (
                            <>
                                <button onClick={onCancel} className="lead-capture-form__btn-secondary">Cancelar</button>
                                <button
                                    onClick={handleNext}
                                    disabled={!formData.citainicial}
                                    className="lead-capture-form__btn-primary"
                                    style={{
                                        opacity: formData.citainicial ? 1 : 0.5,
                                        cursor: formData.citainicial ? 'pointer' : 'not-allowed',
                                        backgroundColor: formData.citainicial ? '#f59e0b' : '#334155',
                                        color: formData.citainicial ? '#0f172a' : '#94a3b8',
                                        boxShadow: formData.citainicial ? undefined : 'none'
                                    }}
                                >
                                    Continuar →
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleBack} className="lead-capture-form__btn-secondary">Atrás</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="lead-capture-form__btn-primary"
                                    style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
                                >
                                    {loading ? 'Procesando...' : (isRescheduling ? 'Confirmar Cambio' : 'Confirmar Visita')} ✓
                                </button>
                            </>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default LeadCaptureForm;
