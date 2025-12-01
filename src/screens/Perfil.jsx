// src/screens/Perfil.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// ✅ 1. Importación del Servicio Modular
import { obtenerDatosUnificados } from '../services/catalog.service';

// ✅ 2. Importación de Constantes Centralizadas
import { FINANZAS, IMAGES } from '../config/constants';

// Importamos herramientas de la Base de Datos
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Perfil() {
  const navigate = useNavigate();
  const { loginWithGoogle, trackBehavior } = useUser();

  const [step, setStep] = useState(0); 
  const totalSteps = 3; 
  const [isSaving, setIsSaving] = useState(false);

  const [capitalInicial, setCapitalInicial] = useState(250000);
  const [mensualidad, setMensualidad] = useState(15000);
  const [recamaras, setRecamaras] = useState(null); 
  const [entregaInmediata, setEntregaInmediata] = useState(null);

  const [dataMaestra, setDataMaestra] = useState([]);

  const [presupuestoMaximo, setPresupuestoMaximo] = useState(0);
  const [notaDinamica, setNotaDinamica] = useState('');
  const [esAlerta, setEsAlerta] = useState(false);

  const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  // 1. CARGA DE DATOS (Servicio Catalog)
  useEffect(() => {
    const cargarDatosParaConteo = async () => {
      try {
        const datos = await obtenerDatosUnificados();
        setDataMaestra(datos);
      } catch (error) {
        console.error("Error cargando datos para perfil:", error);
      }
    };
    cargarDatosParaConteo();
  }, []);

  // 2. LÓGICA FINANCIERA (Usando Constantes)
  useEffect(() => {
    // Extraemos valores de la configuración global
    const { 
      PORCENTAJE_GASTOS_NOTARIALES, 
      PORCENTAJE_ENGANCHE_MINIMO, 
      FACTOR_MENSUALIDAD_POR_MILLON 
    } = FINANZAS;

    // Cálculo de capacidad
    const maxCreditoBanco = (mensualidad / FACTOR_MENSUALIDAD_POR_MILLON) * 1000000;
    
    // Escenario A: El capital limita (solo alcanza para enganche + escrituras)
    const limitePorEfectivo = capitalInicial / (PORCENTAJE_GASTOS_NOTARIALES + PORCENTAJE_ENGANCHE_MINIMO);
    
    // Escenario B: La mensualidad limita (capacidad de pago + lo que ponga de enganche)
    // Nota: Simplificación aritmética. Asumimos que el usuario pone TODO su capital menos gastos.
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

  // 3. CONTEO DE OPCIONES
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

  // ==========================================
  // NAVEGACIÓN Y HANDLERS
  // ==========================================
  
  const handleRoleSelection = (role) => {
    trackBehavior('select_role', { role });
    if (role === 'asesor') {
      navigate('/soy-asesor'); 
    } else {
      setStep(1); 
    }
  };

  const isStepValid = () => {
    switch(step) {
      case 1: return recamaras !== null && entregaInmediata !== null;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (isStepValid() && step < totalSteps) {
      trackBehavior('step_completed', { step_number: step });
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinalizar = async () => {
    setIsSaving(true);
    try {
      const firebaseUser = await loginWithGoogle('cliente'); 
      
      if (firebaseUser) {
        // Prepara el Status de Entrega para guardar
        const statusGuardado = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
        
        const userProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nombre: firebaseUser.displayName,
          foto: firebaseUser.photoURL,
          role: 'cliente', 
          
          perfilFinanciero: {
            capitalInicial,
            mensualidadMaxima: mensualidad,
            presupuestoCalculado: presupuestoMaximo,
            recamarasDeseadas: recamaras,
            interesInmediato: entregaInmediata
          },
          
          ultimoAcceso: new Date().toISOString(),
          registroCompleto: true
        };

        await setDoc(doc(db, "users", firebaseUser.uid), userProfile, { merge: true });

        trackBehavior('onboarding_completed', { 
          presupuesto: presupuestoMaximo,
          opciones_vistas: opcionesEncontradas
        });
        
        // ✅ CORRECCIÓN APLICADA: CONSTRUCCIÓN DE URL CON FILTROS
        
        // 1. Convertimos el booleano 'entregaInmediata' a la cadena de filtro 'inmediata' o 'preventa'
        const statusParam = entregaInmediata === true ? 'inmediata' : (entregaInmediata === false ? 'preventa' : 'all');
        
        // 2. Construimos la URL. Redondeamos el presupuesto para evitar números decimales en la URL.
        const urlConFiltros = `/catalogo?maxPrice=${Math.round(presupuestoMaximo)}&rooms=${recamaras}&status=${statusParam}`;

        // 3. Navegamos al catálogo con los parámetros aplicados
        navigate(urlConFiltros);
        
        // ✅ FIN DE CORRECCIÓN
      }
    } catch (error) {
      console.error("Error guardando perfil:", error);
      alert("Hubo un error al guardar tu sesión. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .step-content { animation: slideIn 0.4s ease-out forwards; width: 100%; }
          input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: var(--primary-color); cursor: pointer; margin-top: -10px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
          input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #e0e0e0; border-radius: 3px; }
      `}</style>

      <div style={styles.card}>
        {step > 0 && (
          <div style={styles.progressBarContainer}>
            <div style={{...styles.progressBarFill, width: `${(step / totalSteps) * 100}%`}}></div>
          </div>
        )}

        {step <= 1 && ( 
          <div style={styles.logoContainer}>
            {/* Usamos la constante de imagen */}
            <img src={IMAGES.LOGO_URL} alt="Logo" style={styles.logoIcon} />
          </div>
        )}

        <div className="step-content" key={step}>
          
          {step === 0 && (
            <>
              <h1 style={styles.title}>Bienvenido</h1>
              <p style={styles.subtitle}>Selecciona tu perfil para comenzar:</p>
              <div style={styles.roleGrid}>
                <button onClick={() => handleRoleSelection('comprador')} style={styles.roleCard}>
                  <div style={styles.roleIcon}>🏠</div>
                  <h3 style={styles.roleTitle}>Busco mi Hogar</h3>
                  <p style={styles.roleDesc}>Quiero ver opciones a mi alcance.</p>
                </button>
                <button onClick={() => handleRoleSelection('asesor')} style={{...styles.roleCard, border: '2px solid #e2e8f0'}}>
                  <div style={styles.roleIcon}>💼</div>
                  <h3 style={styles.roleTitle}>Soy Asesor</h3>
                  <p style={styles.roleDesc}>Quiero subir propiedades y captar clientes.</p>
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 style={styles.title}>Dime qué buscas</h1>
              <p style={styles.subtitle}>Filtraremos las mejores opciones para ti.</p>
              <label style={styles.label}>Recámaras mínimas:</label>
              <div style={styles.optionsContainer}>
                {[1, 2, 3, 4].map((num) => (
                  <button key={num} onClick={() => setRecamaras(num)} style={{...styles.circleBtn, backgroundColor: recamaras === num ? 'var(--primary-color)' : '#f0f0f0', color: recamaras === num ? 'white' : '#555', transform: recamaras === num ? 'scale(1.1)' : 'scale(1)'}}>{num === 4 ? '4+' : num}</button>
                ))}
              </div>
              <label style={{...styles.label, marginTop: '20px'}}>Tiempo de entrega:</label>
              <div style={styles.deliveryContainer}>
                <button onClick={() => setEntregaInmediata(true)} style={{...styles.deliveryBtn, backgroundColor: entregaInmediata === true ? 'var(--primary-color)' : 'white', color: entregaInmediata === true ? 'white' : '#555', borderColor: entregaInmediata === true ? 'var(--primary-color)' : '#eee'}}>Entrega inmediata</button>
                <button onClick={() => setEntregaInmediata(false)} style={{...styles.deliveryBtn, backgroundColor: entregaInmediata === false ? 'var(--primary-color)' : 'white', color: entregaInmediata === false ? 'white' : '#555', borderColor: entregaInmediata === false ? 'var(--primary-color)' : '#eee'}}>Pre-venta</button>
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
                <span style={{fontSize: '0.9rem', opacity: 0.8}}>Tu Presupuesto Máximo:</span>
                <div style={styles.finalAmount}>{formatoMoneda(presupuestoMaximo)}</div>
                <div style={{...styles.resultNote, color: esAlerta ? '#fff9c4' : 'white', fontWeight: '500'}}>{notaDinamica}</div>
              </div>
              <p style={{fontSize: '0.9rem', color: '#666', marginTop: '20px'}}>
                {dataMaestra.length > 0 ? (
                   opcionesEncontradas > 0 
                   ? `Hemos analizado el mercado y encontramos ${opcionesEncontradas} opciones para ti.` 
                   : "Con estos parámetros, el mercado está limitado. Ajusta tus filtros para encontrar más opciones."
                ) : "Cargando datos del mercado..."}
              </p>
            </>
          )}
        </div>

        {step > 0 && (
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
                    ? (isSaving ? 'Guardando...' : 'Ver Propiedades')
                    : (step === 1 ? 'Comenzar' : 'Siguiente 👉')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  // ... (Mismos estilos que tenías, no es necesario cambiarlos por ahora)
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', width: '100%', padding: '20px', boxSizing: 'border-box' },
  card: { backgroundColor: 'white', padding: '40px 30px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  progressBarContainer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#f0f0f0' },
  progressBarFill: { height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease' },
  logoContainer: { marginBottom: '20px' },
  logoIcon: { width: '50px', height: 'auto' },
  title: { color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800' },
  subtitle: { color: '#666', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' },
  roleGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roleCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#fff', border: '2px solid var(--primary-color)', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', textAlign: 'center' },
  roleIcon: { fontSize: '2.5rem', marginBottom: '10px' },
  roleTitle: { margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' },
  roleDesc: { margin: 0, fontSize: '0.9rem', color: '#666' },
  input: { width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid #eee', fontSize: '1.2rem', textAlign: 'center', outline: 'none', marginBottom: '20px' },
  label: { display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '10px', textAlign: 'left' },
  optionsContainer: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '10px' },
  circleBtn: { width: '55px', height: '55px', borderRadius: '50%', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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