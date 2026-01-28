// src/screens/OnboardingCliente.jsx
// ÚLTIMA MODIFICACION: 17/12/2025 - Refactor Buyer First (Numeric Inputs + Micro-interactions)

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useService } from '../../hooks/useService';
import { FINANZAS } from '../../config/constants';
// Firestore imports eliminados por refactoring (DI Principle)
import '../../styles/Onboarding.css'; // Importamos estilos dedicados
import { CatalogService } from '../../services/catalog.service';

const STORAGE_KEY = 'inmueble_advisor_onboarding_cliente_temp';

export default function OnboardingCliente() {
    const navigate = useNavigate();
    const { catalog: catalogService, client: clientService, meta: metaService } = useService(); // ✅ SERVICE INJECTION
    const { loginWithGoogle, trackBehavior, user, loadingUser } = useUser();

    // --- 1. ESTADOS (Persistencia) ---
    const getSavedState = (key, def) => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed[key] !== undefined ? parsed[key] : def;
            }
        } catch (e) { console.error(e); }
        return def;
    };

    const [step, setStep] = useState(() => getSavedState('step', 1));
    const totalSteps = 2;
    const [isSaving, setIsSaving] = useState(false);

    // Datos del formulario
    const [capitalInicial, setCapitalInicial] = useState(() => getSavedState('capitalInicial', 250000));
    const [mensualidad, setMensualidad] = useState(() => getSavedState('mensualidad', 15000));
    const [recamaras, setRecamaras] = useState(() => getSavedState('recamaras', null));
    const [entregaInmediata, setEntregaInmediata] = useState(() => getSavedState('entregaInmediata', null));

    // Estados derivados
    const [dataMaestra, setDataMaestra] = useState([]);
    const [desarrollos, setDesarrollos] = useState([]);
    const [presupuestoMaximo, setPresupuestoMaximo] = useState(0);
    const [notaDinamica, setNotaDinamica] = useState('');
    const [esAlerta, setEsAlerta] = useState(false);

    // Micro-interacciones
    const [microFeedback, setMicroFeedback] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false); // Modal Pre-Login

    // --- 2. EFECTOS ---
    useEffect(() => {
        const estadoAGuardar = { step, capitalInicial, mensualidad, recamaras, entregaInmediata };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoAGuardar));
    }, [step, capitalInicial, mensualidad, recamaras, entregaInmediata]);

    const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    // Carga de Datos
    useEffect(() => {
        catalogService.obtenerDatosUnificados().then(setDataMaestra);
        catalogService.obtenerInventarioDesarrollos().then(setDesarrollos);
    }, []);

    // Cálculo Financiero
    useEffect(() => {
        const { PORCENTAJE_GASTOS_NOTARIALES, PORCENTAJE_ENGANCHE_MINIMO, FACTOR_MENSUALIDAD_POR_MILLON } = FINANZAS;
        const maxCreditoBanco = (mensualidad / FACTOR_MENSUALIDAD_POR_MILLON) * 1000000;
        const limitePorEfectivo = capitalInicial / (PORCENTAJE_GASTOS_NOTARIALES + PORCENTAJE_ENGANCHE_MINIMO);
        const limitePorCapacidadTotal = (capitalInicial + maxCreditoBanco) / (1 + PORCENTAJE_GASTOS_NOTARIALES);
        const capacidadReal = Math.min(limitePorEfectivo, limitePorCapacidadTotal);

        setPresupuestoMaximo(capacidadReal);

        // Lógica de alerta (simplificada para legibilidad)
        if (capacidadReal > 0 && limitePorEfectivo < (limitePorCapacidadTotal - 50000)) {
            setNotaDinamica("Tu efectivo inicial limita tu monto máximo.");
            setEsAlerta(true);
        } else {
            setNotaDinamica("Incluye gastos notariales y enganche.");
            setEsAlerta(false);
        }
    }, [capitalInicial, mensualidad]);

    // Opciones encontradas
    const opcionesEncontradas = useMemo(() => {
        if (presupuestoMaximo === 0 || dataMaestra.length === 0 || desarrollos.length === 0) return 0;

        const filters = {
            precioMin: 0,
            precioMax: presupuestoMaximo,
            habitaciones: recamaras || 0,
            status: entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all'),
            tipo: 'all',
            amenidad: '',
            showNoPrice: false
        };

        return CatalogService.filterCatalog(dataMaestra, desarrollos, filters, '').length;
    }, [presupuestoMaximo, recamaras, entregaInmediata, dataMaestra, desarrollos]);

    // --- HANDLERS ---
    const nextStep = () => {
        if (step < totalSteps) {
            trackBehavior('step_completed', { step_number: step });

            // Micro-Feedback Visual (Sin clicks extra)
            const mensajes = ["", ""];
            setMicroFeedback(mensajes[step - 1]);
            setTimeout(() => setMicroFeedback(''), 2000);

            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate('/');
        }
    };

    // Disparador del Modal de Confirmación
    const handlePreFinalizar = () => {
        if (!user) {
            setShowLoginModal(true);
        } else {
            handleFinalizar(); // Si ya está logueado, pasa directo
        }
    };

    // 🟢 Didáctico: Permite al usuario ver resultados sin crear cuenta.
    // Mantiene la filosofía "Buyer First" al no bloquear el valor prometido.
    const handleSkipLogin = () => {
        const statusParam = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
        const maxPrice = presupuestoMaximo > 0 ? Math.round(presupuestoMaximo) : '';
        const rooms = recamaras || '';

        localStorage.removeItem(STORAGE_KEY);

        // Navegamos al catálogo con los filtros aplicados
        navigate(`/catalogo?maxPrice=${maxPrice}&rooms=${rooms}&status=${statusParam}`, { replace: true });
    };

    // Acción Real de Finalización (Login + Save)
    const handleFinalizar = async () => {
        setIsSaving(true);
        setShowLoginModal(false);
        try {
            let firebaseUser = user;
            if (!firebaseUser) {
                firebaseUser = await loginWithGoogle('cliente');
            }

            if (firebaseUser) {
                // REFACTOR: Usar Service Layer (ClientService via ServiceProvider or UserContext abstraction)
                // Para mantener consistencia, accedemos al servicio global o inyectado.
                // Importamos 'clientService' directamente de serviceProvider para este caso puntual
                // o lo agregamos al context. Por simplicidad y evitar ciclos, usaremos el import arriba.
                // (Nota: Asegurarse de importar clientService al inicio del archivo)

                const profileData = {
                    capitalInicial,
                    mensualidadMaxima: mensualidad,
                    presupuestoCalculado: presupuestoMaximo,
                    recamarasDeseadas: recamaras,
                    interesInmediato: entregaInmediata
                };

                // Actualizamos nombre/email si vienen del provider (Google)
                // Esto podría manejarse dentro del completeOnboarding si le pasamos todo el user object
                // pero por seguridad pasamos solo lo necesario.

                await clientService.completeOnboarding(firebaseUser.uid, profileData);

                // Update root fields like email/name just in case (optional, but good for sync)
                // clientService.updateClientContact(firebaseUser.uid, { email: firebaseUser.email, nombre: firebaseUser.displayName });

                const statusParam = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
                const maxPrice = presupuestoMaximo > 0 ? Math.round(presupuestoMaximo) : '';
                const rooms = recamaras || '';

                localStorage.removeItem(STORAGE_KEY);

                // ⭐ Tracking: Meta CompleteRegistration
                metaService.trackCompleteRegistration({
                    value: presupuestoMaximo || 0,
                    currency: 'MXN',
                    status: 'completed'
                }, metaService.generateEventId());

                navigate(`/catalogo?maxPrice=${maxPrice}&rooms=${rooms}&status=${statusParam}`, { replace: true });
            }
        } catch (error) {
            console.error(error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Hubo un problema al conectar.");
            }
        } finally {
            if (!user) setIsSaving(false);
        }
    };

    const isStepValid = () => {
        return true;
    };

    return (
        <main className="onboarding-container">
            <article className="onboarding-card">

                {/* Barra de Progreso */}
                <header className="onboarding-card__header">
                    <div className="onboarding-card__progress-container">
                        <div className="onboarding-card__progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                    </div>

                    {/* Feedback "Microporras" */}
                    <div className={`onboarding-card__feedback ${microFeedback ? 'onboarding-card__feedback--visible' : ''}`}>
                        {microFeedback}
                    </div>
                </header>

                <section className="onboarding-card__content" key={step}>

                    {step === 1 && (
                        <>
                            <h1 className="onboarding-card__title">Hablemos de números</h1>
                            <p className="onboarding-card__subtitle">Ajusta los valores para ver tu capacidad real.</p>

                            <div className="onboarding-card__calculator">
                                <div className="onboarding-card__calc-group">
                                    <label className="onboarding-card__label">Ahorros disponibles:</label>
                                    <input
                                        type="number"
                                        className="onboarding-card__numeric-field"
                                        value={capitalInicial}
                                        onChange={(e) => setCapitalInicial(Number(e.target.value))}
                                    />
                                    <input
                                        type="range" min="50000" max="3000000" step="10000"
                                        value={capitalInicial}
                                        onChange={(e) => setCapitalInicial(Number(e.target.value))}
                                    />
                                </div>

                                <div className="onboarding-card__calc-group">
                                    <label className="onboarding-card__label">Cuanto puedes pagar mensual:</label>
                                    <input
                                        type="number"
                                        className="onboarding-card__numeric-field"
                                        value={mensualidad}
                                        onChange={(e) => setMensualidad(Number(e.target.value))}
                                    />
                                    <input
                                        type="range" min="5000" max="150000" step="1000"
                                        value={mensualidad}
                                        onChange={(e) => setMensualidad(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className="onboarding-card__title">¡Listo!</h1>
                            <p className="onboarding-card__subtitle">Este es el valor de propiedad recomendado:</p>

                            <div className="onboarding-card__result">
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>
                                    {formatoMoneda(presupuestoMaximo)}
                                </div>
                                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>{notaDinamica}</div>
                            </div>

                            <p style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {opcionesEncontradas > 0
                                    ? `Encontramos ${opcionesEncontradas} opciones para ti.`
                                    : "El mercado está limitado con estos filtros."}
                            </p>
                        </>
                    )}
                </section>

                <footer className="onboarding-card__footer">
                    <button onClick={prevStep} className="btn-secondary">Atrás</button>
                    <button
                        onClick={step < totalSteps ? nextStep : handlePreFinalizar}
                        disabled={!isStepValid() || isSaving}
                        className="btn-primary"
                    >
                        {step === totalSteps ? (isSaving ? 'Procesando...' : 'Ver Propiedades') : 'Siguiente'}
                    </button>
                </footer>

                {/* MODAL PRE-LOGIN */}
                {showLoginModal && (
                    <div className="onboarding-card__modal-overlay">
                        <div className="onboarding-card__modal">
                            <h3 className="onboarding-card__modal-title">🔐 Datos Seguros</h3>
                            <p className="onboarding-card__modal-text">
                                Para guardar tu perfil y buscarte las mejores opciones, necesitamos crear una cuenta segura.
                            </p>
                            <div className="onboarding-card__modal-actions">
                                <button onClick={handleSkipLogin} className="btn-secondary">Continuar sin cuenta</button>
                                <button onClick={handleFinalizar} className="btn-primary">Continuar con Google</button>
                            </div>
                        </div>
                    </div>
                )}

            </article>
        </main>
    );
}
