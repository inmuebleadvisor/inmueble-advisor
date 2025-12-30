// src/screens/OnboardingCliente.jsx
// ÚLTIMA MODIFICACION: 17/12/2025 - Refactor Buyer First (Numeric Inputs + Micro-interactions)

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { catalogService } from '../../services/serviceProvider';
import { FINANZAS } from '../../config/constants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/Onboarding.css'; // Importamos estilos dedicados

const STORAGE_KEY = 'inmueble_advisor_onboarding_cliente_temp';

export default function OnboardingCliente() {
    const navigate = useNavigate();
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
    const totalSteps = 3;
    const [isSaving, setIsSaving] = useState(false);

    // Datos del formulario
    const [capitalInicial, setCapitalInicial] = useState(() => getSavedState('capitalInicial', 250000));
    const [mensualidad, setMensualidad] = useState(() => getSavedState('mensualidad', 15000));
    const [recamaras, setRecamaras] = useState(() => getSavedState('recamaras', null));
    const [entregaInmediata, setEntregaInmediata] = useState(() => getSavedState('entregaInmediata', null));

    // Estados derivados
    const [dataMaestra, setDataMaestra] = useState([]);
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
        if (presupuestoMaximo === 0 || dataMaestra.length === 0) return 0;
        return dataMaestra.filter(item => {
            if (item.precioNumerico > presupuestoMaximo) return false;
            if (recamaras && item.recamaras < recamaras) return false;
            if (entregaInmediata === true && item.esPreventa === true) return false;
            if (entregaInmediata === false && item.esPreventa === false) return false;
            return true;
        }).length;
    }, [presupuestoMaximo, recamaras, entregaInmediata, dataMaestra]);

    // --- HANDLERS ---
    const nextStep = () => {
        if (step < totalSteps) {
            trackBehavior('step_completed', { step_number: step });

            // Micro-Feedback Visual (Sin clicks extra)
            const mensajes = ["Paso 2 de 3", "", ""];
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
                const updates = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    nombre: firebaseUser.displayName,
                    ultimoAcceso: new Date().toISOString(),
                    perfilFinanciero: {
                        capitalInicial,
                        mensualidadMaxima: mensualidad,
                        presupuestoCalculado: presupuestoMaximo,
                        recamarasDeseadas: recamaras,
                        interesInmediato: entregaInmediata
                    }
                };

                await setDoc(doc(db, "users", firebaseUser.uid), updates, { merge: true });

                const statusParam = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
                const maxPrice = presupuestoMaximo > 0 ? Math.round(presupuestoMaximo) : '';
                const rooms = recamaras || '';

                localStorage.removeItem(STORAGE_KEY);
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
        if (step === 1) return recamaras !== null && entregaInmediata !== null;
        return true;
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">

                {/* Barra de Progreso */}
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                </div>

                {/* Feedback "Microporras" */}
                <div className={`micro-feedback ${microFeedback ? 'visible' : ''}`}>
                    {microFeedback}
                </div>

                <div className="step-content" key={step}>

                    {step === 1 && (
                        <>
                            <h1 className="onboarding-title">Dime qué buscas</h1>
                            <p className="onboarding-subtitle">Filtraremos las mejores opciones para ti.</p>

                            <label className="input-label">Recámaras mínimas:</label>
                            <div className="options-container">
                                {[1, 2, 3, 4].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setRecamaras(num)}
                                        className={`circle-btn ${recamaras === num ? 'active' : ''}`}
                                    >
                                        {num === 4 ? '4+' : num}
                                    </button>
                                ))}
                            </div>

                            <label className="input-label" style={{ marginTop: '20px' }}>Tiempo de entrega:</label>
                            <div className="delivery-container">
                                <button onClick={() => setEntregaInmediata(true)} className={`delivery-btn ${entregaInmediata === true ? 'active' : ''}`}>Entrega inmediata</button>
                                <button onClick={() => setEntregaInmediata(false)} className={`delivery-btn ${entregaInmediata === false ? 'active' : ''}`}>Pre-venta</button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className="onboarding-title">Hablemos de números</h1>
                            <p className="onboarding-subtitle">Ajusta los valores para ver tu capacidad real.</p>

                            <div className="calculator-box">
                                <div className="calc-input-group">
                                    <label className="input-label">Ahorros disponibles:</label>
                                    <input
                                        type="number"
                                        className="numeric-input-field"
                                        value={capitalInicial}
                                        onChange={(e) => setCapitalInicial(Number(e.target.value))}
                                    />
                                    <input
                                        type="range" min="50000" max="3000000" step="10000"
                                        value={capitalInicial}
                                        onChange={(e) => setCapitalInicial(Number(e.target.value))}
                                    />
                                </div>

                                <div className="calc-input-group">
                                    <label className="input-label">Mensualidad cómoda:</label>
                                    <input
                                        type="number"
                                        className="numeric-input-field"
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

                    {step === 3 && (
                        <>
                            <h1 className="onboarding-title">¡Listo!</h1>
                            <p className="onboarding-subtitle">Este es el valor de propiedad recomendado:</p>

                            <div className="final-result-box">
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
                </div>

                <div className="nav-container">
                    <button onClick={prevStep} className="btn-secondary">Atrás</button>
                    <button
                        onClick={step < totalSteps ? nextStep : handlePreFinalizar}
                        disabled={!isStepValid() || isSaving}
                        className="btn-primary"
                    >
                        {step === totalSteps ? (isSaving ? 'Procesando...' : 'Ver Propiedades') : 'Siguiente'}
                    </button>
                </div>

                {/* MODAL PRE-LOGIN */}
                {showLoginModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>🔐 Datos Seguros</h3>
                            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                Para guardar tu perfil y buscarte las mejores opciones, necesitamos crear una cuenta segura.
                            </p>
                            <div className="modal-actions">
                                <button onClick={() => setShowLoginModal(false)} className="btn-secondary">Cancelar</button>
                                <button onClick={handleFinalizar} className="btn-primary">Continuar con Google</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
