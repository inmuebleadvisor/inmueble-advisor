// src/screens/OnboardingCliente.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerDatosUnificados } from '../services/catalog.service';
import { FINANZAS, IMAGES } from '../config/constants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Clave para guardar el progreso en el navegador (Persistencia ante recargas)
const STORAGE_KEY = 'inmueble_advisor_onboarding_cliente_temp';

export default function OnboardingCliente() {
    const navigate = useNavigate();
    const { loginWithGoogle, trackBehavior, user, loadingUser, userProfile } = useUser();

    // --- 1. ESTADOS CON RECUPERACIÓN (Persistencia) ---
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

    // Step comienza en 1 porque el 0 es la selección de rol en Perfil.jsx
    const [step, setStep] = useState(() => getSavedState('step', 1));
    // Total steps relativo a este flujo (1, 2, 3) -> Total 3 pasos en este wizard
    const totalSteps = 3;

    const [isSaving, setIsSaving] = useState(false);

    const [capitalInicial, setCapitalInicial] = useState(() => getSavedState('capitalInicial', 250000));
    const [mensualidad, setMensualidad] = useState(() => getSavedState('mensualidad', 15000));
    const [recamaras, setRecamaras] = useState(() => getSavedState('recamaras', null));
    const [entregaInmediata, setEntregaInmediata] = useState(() => getSavedState('entregaInmediata', null));

    const [dataMaestra, setDataMaestra] = useState([]);
    const [presupuestoMaximo, setPresupuestoMaximo] = useState(0);
    const [notaDinamica, setNotaDinamica] = useState('');
    const [esAlerta, setEsAlerta] = useState(false);

    // --- 2. EFECTO DE GUARDADO AUTOMÁTICO ---
    useEffect(() => {
        const estadoAGuardar = { step, capitalInicial, mensualidad, recamaras, entregaInmediata };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoAGuardar));
    }, [step, capitalInicial, mensualidad, recamaras, entregaInmediata]);

    const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    // --- 3. LÓGICA DE REDIRECCIÓN INTELIGENTE (Similar a Perfil, pero ajustada) ---
    useEffect(() => {
        if (loadingUser) return;

        // Si el usuario ya completó el onboarding previamente, redirigir al catálogo
        // (Opcional: Si queremos permitir que re-hagan el onboarding, quitamos esto,
        // pero mantenemos la lógica de login persistente).
        // Por ahora, asumimos que si llegan aquí es porque quieren hacer el onboarding.

        // Si ya completaron el paso 3 y tienen usuario, redirect automático
        if (user && step === 3) {
            const statusParam = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
            const maxPrice = presupuestoMaximo > 0 ? Math.round(presupuestoMaximo) : '';
            const rooms = recamaras || '';

            localStorage.removeItem(STORAGE_KEY);
            navigate(`/catalogo?maxPrice=${maxPrice}&rooms=${rooms}&status=${statusParam}`, { replace: true });
        }
    }, [user, step, navigate, presupuestoMaximo, recamaras, entregaInmediata, loadingUser]);

    // Carga de Datos Catálogo
    useEffect(() => {
        const cargar = async () => {
            const datos = await obtenerDatosUnificados();
            setDataMaestra(datos);
        };
        cargar();
    }, []);

    // Lógica Financiera
    useEffect(() => {
        const { PORCENTAJE_GASTOS_NOTARIALES, PORCENTAJE_ENGANCHE_MINIMO, FACTOR_MENSUALIDAD_POR_MILLON } = FINANZAS;
        const maxCreditoBanco = (mensualidad / FACTOR_MENSUALIDAD_POR_MILLON) * 1000000;
        const limitePorEfectivo = capitalInicial / (PORCENTAJE_GASTOS_NOTARIALES + PORCENTAJE_ENGANCHE_MINIMO);
        const limitePorCapacidadTotal = (capitalInicial + maxCreditoBanco) / (1 + PORCENTAJE_GASTOS_NOTARIALES);
        const capacidadReal = Math.min(limitePorEfectivo, limitePorCapacidadTotal);

        setPresupuestoMaximo(capacidadReal);

        if (capacidadReal > 0) {
            const costoTotalInicial = capacidadReal * (PORCENTAJE_ENGANCHE_MINIMO + PORCENTAJE_GASTOS_NOTARIALES);
            const remanente = Math.max(0, capitalInicial - costoTotalInicial);
            const pctEnganche = (PORCENTAJE_ENGANCHE_MINIMO * 100).toFixed(0);
            const pctNotaria = (PORCENTAJE_GASTOS_NOTARIALES * 100).toFixed(0);
            const mensajeBase = `Incluye gastos notariales (${pctNotaria}%) y enganche (${pctEnganche}%). Te sobran ${formatoMoneda(remanente)} de tu efectivo.`;

            if (limitePorEfectivo < (limitePorCapacidadTotal - 50000)) {
                setNotaDinamica(mensajeBase + " (Tu efectivo limita tu compra, podrías pagar más mensualidad si tuvieras más ahorro).");
                setEsAlerta(true);
            } else {
                setNotaDinamica(mensajeBase);
                setEsAlerta(false);
            }
        }
    }, [capitalInicial, mensualidad]);

    // Conteo
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
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            // Si estamos en el primer paso del onboarding y damos atrás, volvemos al perfil
            navigate('/');
        }
    };

    const handleFinalizar = async () => {
        setIsSaving(true);
        try {
            let firebaseUser = user;

            if (!firebaseUser) {
                // Login con Google
                firebaseUser = await loginWithGoogle('cliente');
            }

            if (firebaseUser) {
                // Guardado de datos
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

                trackBehavior('onboarding_completed', {
                    presupuesto: presupuestoMaximo,
                    opciones_vistas: opcionesEncontradas
                });

                // Redirección explícita
                const statusParam = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
                const maxPrice = presupuestoMaximo > 0 ? Math.round(presupuestoMaximo) : '';
                const rooms = recamaras || '';

                localStorage.removeItem(STORAGE_KEY);
                navigate(`/catalogo?maxPrice=${maxPrice}&rooms=${rooms}&status=${statusParam}`, { replace: true });
            }
        } catch (error) {
            console.error("Error en finalización:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Hubo un problema al conectar. Intenta de nuevo.");
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
        <div style={styles.container}>
            {/* Reutilizando estilos en línea por consistencia con Perfil.jsx inicial, idealmente mover a CSS */}
            <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .step-content { animation: slideIn 0.4s ease-out forwards; width: 100%; }
          input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: var(--primary-color); cursor: pointer; margin-top: -10px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
          input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #e0e0e0; border-radius: 3px; }
      `}</style>

            <div style={styles.card}>
                <div style={styles.progressBarContainer}>
                    {/* Calculamos progreso basado en 3 pasos */}
                    <div style={{ ...styles.progressBarFill, width: `${(step / totalSteps) * 100}%` }}></div>
                </div>

                <div className="step-content" key={step}>

                    {step === 1 && (
                        <>
                            <h1 style={styles.title}>Dime qué buscas</h1>
                            <p style={styles.subtitle}>Filtraremos las mejores opciones para ti.</p>
                            <label style={styles.label}>Recámaras mínimas:</label>
                            <div style={styles.optionsContainer}>
                                {[1, 2, 3, 4].map((num) => (
                                    <button key={num} onClick={() => setRecamaras(num)} style={{ ...styles.circleBtn, backgroundColor: recamaras === num ? 'var(--primary-color)' : '#f0f0f0', color: recamaras === num ? 'white' : '#555', transform: recamaras === num ? 'scale(1.1)' : 'scale(1)' }}>{num === 4 ? '4+' : num}</button>
                                ))}
                            </div>
                            <label style={{ ...styles.label, marginTop: '20px' }}>Tiempo de entrega:</label>
                            <div style={styles.deliveryContainer}>
                                <button onClick={() => setEntregaInmediata(true)} style={{ ...styles.deliveryBtn, backgroundColor: entregaInmediata === true ? 'var(--primary-color)' : 'white', color: entregaInmediata === true ? 'white' : '#555', borderColor: entregaInmediata === true ? 'var(--primary-color)' : '#eee' }}>Entrega inmediata</button>
                                <button onClick={() => setEntregaInmediata(false)} style={{ ...styles.deliveryBtn, backgroundColor: entregaInmediata === false ? 'var(--primary-color)' : 'white', color: entregaInmediata === false ? 'white' : '#555', borderColor: entregaInmediata === false ? 'var(--primary-color)' : '#eee' }}>Pre-venta</button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 style={styles.title}>Hablemos de números</h1>
                            <p style={styles.subtitle}>Sin compromiso. Ajusta los valores para ver tu capacidad real.</p>
                            <div style={styles.calculatorBox}>
                                <div style={styles.calcInputGroup}>
                                    <label style={styles.labelSmall}>Ahorros disponibles (Enganche + Gastos):</label>
                                    <div style={styles.sliderValue}>{formatoMoneda(capitalInicial)}</div>
                                    <input type="range" min="50000" max="3000000" step="10000" value={capitalInicial} onChange={(e) => setCapitalInicial(Number(e.target.value))} />
                                </div>
                                <div style={styles.calcInputGroup}>
                                    <label style={styles.labelSmall}>Mensualidad cómoda:</label>
                                    <div style={styles.sliderValue}>{formatoMoneda(mensualidad)}</div>
                                    <input type="range" min="5000" max="150000" step="1000" value={mensualidad} onChange={(e) => setMensualidad(Number(e.target.value))} />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h1 style={styles.title}>¡Listo!</h1>
                            <p style={styles.subtitle}>Basado en tus finanzas, este es el valor máximo de propiedad que te recomendamos:</p>
                            <div style={styles.finalResultBox}>
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Tu Presupuesto Máximo:</span>
                                <div style={styles.finalAmount}>{formatoMoneda(presupuestoMaximo)}</div>
                                <div style={{ ...styles.resultNote, color: esAlerta ? '#fff9c4' : 'white', fontWeight: '500' }}>{notaDinamica}</div>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '20px' }}>
                                {dataMaestra.length > 0 ? (
                                    opcionesEncontradas > 0
                                        ? `Hemos analizado el mercado y encontramos ${opcionesEncontradas} opciones para ti.`
                                        : "Con estos parámetros, el mercado está limitado. Ajusta tus filtros para encontrar más opciones."
                                ) : "Cargando datos del mercado..."}
                            </p>
                        </>
                    )}
                </div>

                <div style={styles.navContainer}>
                    <button onClick={prevStep} style={styles.secondaryButton}>Atrás</button>
                    <button
                        onClick={step < totalSteps ? nextStep : handleFinalizar}
                        disabled={!isStepValid() || isSaving}
                        style={{
                            ...styles.primaryButton,
                            opacity: (!isStepValid() || isSaving) ? 0.5 : 1,
                            backgroundColor: step === totalSteps ? '#28a745' : 'var(--primary-color)'
                        }}
                    >
                        {step === totalSteps
                            ? (isSaving ? 'Procesando...' : 'Ver Propiedades')
                            : 'Siguiente 👉'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', width: '100%', padding: '20px', boxSizing: 'border-box' },
    card: { backgroundColor: 'white', padding: '40px 30px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    progressBarContainer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#f0f0f0' },
    progressBarFill: { height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease' },
    title: { color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800' },
    subtitle: { color: '#666', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' },
    label: { display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '10px', textAlign: 'left' },
    optionsContainer: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '10px' },
    circleBtn: { width: '55px', height: '55px', borderRadius: '50%', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' },
    deliveryContainer: { display: 'flex', gap: '10px' },
    deliveryBtn: { flex: 1, padding: '15px 5px', borderRadius: '15px', border: '2px solid', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s ease' },
    calculatorBox: { backgroundColor: '#f9fcff', borderRadius: '20px', padding: '20px', border: '1px solid #eef' },
    calcInputGroup: { marginBottom: '25px', textAlign: 'left' },
    labelSmall: { fontSize: '0.9rem', color: '#555', fontWeight: '600', display: 'block', marginBottom: '5px' },
    sliderValue: { fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '5px' },
    finalResultBox: { backgroundColor: 'var(--primary-color)', color: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,57,106,0.25)', animation: 'pulse 2s infinite' },
    finalAmount: { fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' },
    resultNote: { fontSize: '0.95rem', lineHeight: '1.5', padding: '0 10px' },
    navContainer: { display: 'flex', gap: '15px', marginTop: '30px' },
    primaryButton: { flex: 2, backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '18px', fontSize: '1.1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    secondaryButton: { flex: 1, backgroundColor: 'transparent', color: '#888', border: '2px solid #eee', padding: '18px', fontSize: '1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }
};
