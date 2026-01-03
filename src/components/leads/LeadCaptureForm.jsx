import React, { useState, useEffect } from 'react';
import { useService } from '../../hooks/useService';
import AppointmentScheduler from '../common/AppointmentScheduler';
import { useUser } from '../../context/UserContext'; // ✅ Contexto de Usuario
import '../../styles/LeadCaptureForm.css';

const LeadCaptureForm = ({ desarrollo, modelo, onSuccess, onCancel }) => {
    const { user, userProfile, loginWithGoogle } = useUser(); // ✅ Obtener usuario y login
    const { leadAssignment } = useService(); // ✅ Inject Service

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        mensaje: `Hola, me interesa el modelo ${modelo?.nombre_modelo || ''} en ${desarrollo?.nombre || ''}.`
    });

    // 🔄 EFECTO: Pre-llenar datos si el usuario está logueado
    useEffect(() => {
        if (user && userProfile) {
            setFormData(prev => ({
                ...prev,
                nombre: userProfile.nombre || user.displayName || '',
                email: userProfile.email || user.email || '',
                telefono: userProfile.telefono || '' // Si ya lo tenemos guardado
            }));
        }
    }, [user, userProfile]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.nombre || !formData.telefono) {
            setError("Nombre y teléfono son obligatorios");
            setLoading(false);
            return;
        }

        // Validate Appointment Data Integrity
        if (formData.citainicial && (!formData.citainicial.dia || !formData.citainicial.hora)) {
            setError("Por favor selecciona una HORA para tu cita.");
            setLoading(false);
            return;
        }

        try {
            // Determine Price: Model Price OR Min Development Price
            let precioRef = 0;
            if (modelo && modelo.precioNumerico) {
                precioRef = modelo.precioNumerico;
            } else if (desarrollo && desarrollo.modelos && desarrollo.modelos.length > 0) {
                // Sort/Find min price
                const prices = desarrollo.modelos.map(m => Number(m.precioNumerico)).filter(p => p > 0);
                if (prices.length > 0) {
                    precioRef = Math.min(...prices);
                }
            }

            // Ensure idDesarrollador exists - Service handles lookup now if missing
            if (!desarrollo?.idDesarrollador && !desarrollo?.constructora) {
                console.warn("Falta ID del Desarrollador en frontend. El servicio intentará recuperarlo.");
            }

            const result = await leadAssignment.generarLeadAutomatico(
                {
                    nombre: formData.nombre,
                    telefono: formData.telefono,
                    email: formData.email
                },
                desarrollo?.id,
                desarrollo?.nombre,
                modelo?.nombre_modelo || "Interés General",
                user?.uid,
                desarrollo?.idDesarrollador || desarrollo?.constructora,
                precioRef,
                // ✅ NEW: Context & Snapshot
                {
                    origen: 'WEB_DESKTOP',
                    urlOrigen: window.location.href, // Full URL for debugging
                    snapshot: {
                        idModelo: modelo?.id || null, // Explicit null if generic
                        precioAtCapture: precioRef,
                        moneda: modelo?.precios?.moneda || desarrollo?.precios?.moneda || 'MXN',
                        desarrolloNombre: desarrollo?.nombre,
                        modeloNombre: modelo?.nombre_modelo || "Interés General"
                    },
                    citainicial: formData.citainicial || null // ✅ Pass Appointment Data
                }
            );

            if (result.success) {
                if (onSuccess) onSuccess();
            } else {
                setError("Error al enviar: " + result.error);
            }
        } catch (err) {
            console.error(err);
            setError("Error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    // 🔒 GATED CONTENT: REQUIRE LOGIN
    if (!user) {
        return (
            <div className="lead-form lead-form--gated">
                <h3 className="lead-form__title">Inicia Sesión</h3>
                <p className="lead-form__subtitle">
                    Para agendar una cita o cotizar, necesitamos verificar tu identidad.
                </p>
                <button
                    type="button"
                    className="lead-form__btn lead-form__btn--google"
                    onClick={async () => {
                        try { await loginWithGoogle(); } catch (e) { console.error(e); }
                    }}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        style={{ width: '20px', marginRight: '10px' }}
                    />
                    Continuar con Google
                </button>
                <div className="lead-form__actions">
                    <button type="button" className="lead-form__btn lead-form__btn--secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form className="lead-form !p-0 !bg-transparent !shadow-none" onSubmit={handleSubmit} style={{ minHeight: '600px' }}>
            <div className="rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>

                <h3 className="text-2xl font-black text-center mb-1" style={{ color: 'var(--text-main)' }}>
                    Agenda tu Visita VIP
                </h3>
                <p className="text-center text-xs uppercase tracking-widest mb-6 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                    {modelo?.nombre_modelo || desarrollo?.nombre}
                </p>

                <div style={{
                    background: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '6px',
                    fontSize: '0.9rem', textAlign: 'center', border: '1px solid #bbf7d0', marginBottom: '1rem'
                }}>
                    👤 Solicitando como: <strong>{user.displayName}</strong>
                </div>

                {/* PROGRESS STEPPER (VISUAL) */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <div className={`flex flex-col items-center gap-1 transition-all ${!formData.citainicial ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-color)] text-black font-bold flex items-center justify-center text-xs shadow-glow">1</div>
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-main)' }}>Cita</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--primary-color)] to-[var(--border-subtle)] mx-2 alpha-30"></div>
                    <div className={`flex flex-col items-center gap-1 transition-all ${formData.citainicial ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                        <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs border ${formData.citainicial ? 'bg-[var(--primary-color)] text-black border-transparent shadow-glow' : 'border-[var(--text-secondary)] text-[var(--text-secondary)]'}`}>2</div>
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: formData.citainicial ? 'var(--text-main)' : 'var(--text-secondary)' }}>Datos</span>
                    </div>
                </div>

                {/* SECTION 1: CITA (Moved completely to top priority) */}
                <div className={`transition-all duration-500 ${formData.citainicial ? 'mb-8' : 'mb-6'}`}>
                    {/* APPOINTMENT SCHEDULER */}
                    <AppointmentScheduler
                        onSelect={(cita) => setFormData(prev => ({ ...prev, citainicial: cita }))}
                        className="mb-4"
                    />

                    {!formData.citainicial ? (
                        <p className="text-xs text-center animate-pulse" style={{ color: 'var(--primary-color)' }}>
                            ✨ Selecciona un día para continuar
                        </p>
                    ) : (
                        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-4 animate-fadeIn">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-lg shadow-lg">
                                📅
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-70" style={{ color: 'var(--text-main)' }}>Tu Reserva:</p>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                                    {formData.citainicial.dia.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                                    <span className="mx-2">•</span>
                                    {formData.citainicial.hora} hrs
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, citainicial: null }))}
                                    className="text-[10px] underline mt-1 hover:text-[var(--primary-color)]"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Cambiar fecha
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 2: DATOS PERSONALES (Revealed or Dimmed based on flow) */}
                <div className={`space-y-5 transition-all duration-500 ${!formData.citainicial ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100'}`}>

                    <h4 className="text-sm uppercase tracking-widest font-bold mb-4 border-b pb-2 flex items-center gap-2"
                        style={{ color: 'var(--text-main)', borderColor: 'var(--border-subtle)' }}>
                        <span className="text-[var(--primary-color)]">02/</span> Confirmar Datos
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="lead-form__group">
                            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }} htmlFor="nombre">
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none transition-all"
                                style={{ color: 'var(--text-main)' }}
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>

                        <div className="lead-form__group">
                            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }} htmlFor="telefono">
                                WhatsApp
                            </label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none transition-all"
                                style={{ color: 'var(--text-main)' }}
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="Ej. 667 123 4567"
                            />
                        </div>
                    </div>

                    <div className="lead-form__group">
                        <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }} htmlFor="email">
                            Email (Verificado)
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-sm opacity-50 cursor-not-allowed"
                            style={{ color: 'var(--text-main)' }}
                            value={formData.email}
                            readOnly
                            disabled
                        />
                    </div>
                </div>



                <div className="lead-form__actions">
                    <button
                        type="button"
                        className="lead-form__btn lead-form__btn--secondary"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="lead-form__btn lead-form__btn--primary"
                        disabled={loading}
                        style={{
                            opacity: (formData.citainicial && !formData.citainicial.hora) ? 0.5 : 1,
                            cursor: (formData.citainicial && !formData.citainicial.hora) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Enviando...' : 'Solicitar Info'}
                    </button>
                </div>

                <p className="text-[10px] text-center mt-6 opacity-40 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                    Al enviar, aceptas ser contactado por un asesor certificado. Tu información está segura.
                </p>
            </div>{/* End Card Wrapper */}
        </form>
    );
};

export default LeadCaptureForm;
