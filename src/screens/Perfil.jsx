import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
// ✅ Importamos el servicio centralizado de datos
import { obtenerDatosUnificados } from '../services/dataService';

/**
 *    COMPONENTE PERFIL & BIENVENIDA
 *    Actúa como "Controlador de Tráfico" inicial y luego perfila al comprador.
 */
export default function Perfil() {
  const navigate = useNavigate();
  const { login, trackBehavior } = useUser();

  // ==========================================
  // ESTADOS DE CONTROL E INTERFAZ
  // ==========================================
  // 0: Selección de Rol (Nuevo Inicio)
  // 1: Nombre
  // 2: Necesidades
  // 3: Calculadora
  // 4: Resultado
  const [step, setStep] = useState(0); 
  const totalSteps = 4; // Pasos efectivos del perfilamiento (sin contar el 0)

  // ==========================================
  // ESTADOS DE DATOS (Respuestas del Usuario)
  // ==========================================
  const [nombre, setNombre] = useState('');
  const [capitalInicial, setCapitalInicial] = useState(250000);
  const [mensualidad, setMensualidad] = useState(15000);
  const [recamaras, setRecamaras] = useState(null); 
  const [entregaInmediata, setEntregaInmediata] = useState(null);

  // ==========================================
  // ESTADOS DE CÁLCULO (Lógica Financiera)
  // ==========================================
  const [presupuestoMaximo, setPresupuestoMaximo] = useState(0);
  const [notaDinamica, setNotaDinamica] = useState('');
  const [esAlerta, setEsAlerta] = useState(false);

  // Helper de formato moneda
  const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  // 1. LÓGICA FINANCIERA (Se ejecuta cuando cambian los inputs)
  useEffect(() => {
    const PORCENTAJE_GASTOS_NOTARIALES = 0.06; 
    const PORCENTAJE_ENGANCHE = 0.10; 
    const FACTOR_MENSUALIDAD_POR_MILLON = 11000;

    const maxCreditoBanco = (mensualidad / FACTOR_MENSUALIDAD_POR_MILLON) * 1000000;
    const limitePorEfectivo = capitalInicial / (PORCENTAJE_GASTOS_NOTARIALES + PORCENTAJE_ENGANCHE);
    const limitePorCapacidadTotal = (capitalInicial + maxCreditoBanco) / (1 + PORCENTAJE_GASTOS_NOTARIALES);

    const capacidadReal = Math.min(limitePorEfectivo, limitePorCapacidadTotal);
    setPresupuestoMaximo(capacidadReal);

    if (capacidadReal > 0) {
      const costoTotalInicial = capacidadReal * (PORCENTAJE_ENGANCHE + PORCENTAJE_GASTOS_NOTARIALES);
      const remanente = Math.max(0, capitalInicial - costoTotalInicial);

      if (limitePorEfectivo < (limitePorCapacidadTotal - 50000)) {
        setNotaDinamica(`Incluye gastos notariales (6%) y enganche (10%). Te sobran ${formatoMoneda(remanente)} de tu efectivo inicial.`);
        setEsAlerta(true);
      } else {
        setNotaDinamica(`Incluye gastos notariales (6%) y enganche (10%). Te sobran ${formatoMoneda(remanente)} de tu efectivo inicial.`);
        setEsAlerta(false);
      }
    }
  }, [capitalInicial, mensualidad]);

  // 2. CONTEO DE OPCIONES (En tiempo real usando dataService)
  const dataMaestra = useMemo(() => obtenerDatosUnificados(), []);

  const opcionesEncontradas = useMemo(() => {
    if (presupuestoMaximo === 0) return 0;
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
  
  // ✅ Nuevo Handler para el Paso 0 (Bifurcación)
  const handleRoleSelection = (role) => {
    // Registramos la decisión del usuario
    trackBehavior('select_role', { role });

    if (role === 'asesor') {
      navigate('/soy-asesor'); // Redirige a la nueva Landing
    } else {
      setStep(1); // Inicia el flujo de comprador
    }
  };

  const isStepValid = () => {
    switch(step) {
      case 1: return nombre.trim().length > 0;
      case 2: return recamaras !== null && entregaInmediata !== null;
      case 3: return true;
      case 4: return true;
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
    if (step > 1) setStep(step - 1);
    // Si estamos en paso 1 y damos atrás, volvemos a la selección de rol (0)
    else if (step === 1) setStep(0);
  };

  const handleFinalizar = () => {
    const userProfile = {
      nombre,
      capitalInicial,
      mensualidadMaxima: mensualidad,
      presupuestoCalculado: presupuestoMaximo,
      recamaras,
      status: entregaInmediata ? 'inmediata' : 'preventa' 
    };
    login(userProfile);
    trackBehavior('onboarding_completed', { 
      presupuesto: presupuestoMaximo,
      opciones_vistas: opcionesEncontradas
    });
    navigate('/catalogo');
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  return (
    <div style={styles.container}>
      {/* Estilos locales para animación y sliders */}
      <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .step-content { animation: slideIn 0.4s ease-out forwards; width: 100%; }
          input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: var(--primary-color); cursor: pointer; margin-top: -10px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
          input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #e0e0e0; border-radius: 3px; }
      `}</style>

      <div style={styles.card}>
        
        {/* BARRA DE PROGRESO (Oculta en Paso 0) */}
        {step > 0 && (
          <div style={styles.progressBarContainer}>
            <div style={{...styles.progressBarFill, width: `${(step / totalSteps) * 100}%`}}></div>
          </div>
        )}

        {/* LOGO (Visible en Pasos 0 y 1) */}
        {step <= 1 && (
          <div style={styles.logoContainer}>
            <img src="https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png" alt="Logo" style={styles.logoIcon} />
          </div>
        )}

        {/* CONTENEDOR DE PASOS */}
        <div className="step-content" key={step}>
          
          {/* ✅ PASO 0: SELECCIÓN DE ROL (NUEVO) */}
          {step === 0 && (
            <>
              <h1 style={styles.title}>Bienvenido</h1>
              <p style={styles.subtitle}>Selecciona tu perfil para comenzar:</p>
              
              <div style={styles.roleGrid}>
                {/* Opción Comprador */}
                <button 
                  onClick={() => handleRoleSelection('comprador')}
                  style={styles.roleCard}
                >
                  <div style={styles.roleIcon}>🏠</div>
                  <h3 style={styles.roleTitle}>Busco mi Hogar</h3>
                  <p style={styles.roleDesc}>Quiero ver opciones a mi alcance.</p>
                </button>

                {/* Opción Asesor */}
                <button 
                  onClick={() => handleRoleSelection('asesor')}
                  style={{...styles.roleCard, border: '2px solid #e2e8f0'}}
                >
                  <div style={styles.roleIcon}>💼</div>
                  <h3 style={styles.roleTitle}>Soy Asesor</h3>
                  <p style={styles.roleDesc}>Quiero subir propiedades y captar clientes.</p>
                </button>
              </div>
            </>
          )}

          {/* PASO 1: NOMBRE */}
          {step === 1 && (
            <>
              <h1 style={styles.title}>¡Hola! 👋</h1>
              <p style={styles.subtitle}>Soy tu asesor virtual. Antes de empezar, ¿cómo te gusta que te llamen?</p>
              <input 
                type="text" placeholder="Escribe tu nombre aquí..." 
                value={nombre} onChange={(e) => setNombre(e.target.value)}
                style={styles.input} autoFocus
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
            </>
          )}

          {/* PASO 2: NECESIDADES */}
          {step === 2 && (
            <>
              <h1 style={styles.title}>Dime qué buscas</h1>
              <p style={styles.subtitle}>Para filtrar las mejores opciones para ti, {nombre}.</p>
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

          {/* PASO 3: CALCULADORA */}
          {step === 3 && (
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

          {/* PASO 4: RESULTADO */}
          {step === 4 && (
            <>
              <h1 style={styles.title}>¡Listo, {nombre}!</h1>
              <p style={styles.subtitle}>Basado en tus finanzas, este es el valor máximo de propiedad que te recomendamos:</p>
              <div style={styles.finalResultBox}>
                <span style={{fontSize: '0.9rem', opacity: 0.8}}>Tu Presupuesto Máximo:</span>
                <div style={styles.finalAmount}>{formatoMoneda(presupuestoMaximo)}</div>
                <div style={{...styles.resultNote, color: esAlerta ? '#fff9c4' : 'white', fontWeight: '500'}}>{notaDinamica}</div>
              </div>
              <p style={{fontSize: '0.9rem', color: '#666', marginTop: '20px'}}>
                {opcionesEncontradas > 0 ? `Hemos analizado el mercado y encontramos ${opcionesEncontradas} opciones para ti.` : "Con estos parámetros, el mercado está limitado. Ajusta tus filtros para encontrar más opciones."}
              </p>
            </>
          )}
        </div>

        {/* NAVEGACIÓN (Solo visible desde el Paso 1) */}
        {step > 0 && (
          <div style={styles.navContainer}>
            <button onClick={prevStep} style={styles.secondaryButton}>Atrás</button>
            {step < totalSteps ? (
              <button onClick={nextStep} disabled={!isStepValid()} style={{...styles.primaryButton, opacity: isStepValid() ? 1 : 0.5}}>{step === 1 ? 'Comenzar' : 'Siguiente 👉'}</button>
            ) : (
              <button onClick={handleFinalizar} style={{...styles.primaryButton, backgroundColor: '#28a745'}}>Ver Propiedades</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ESTILOS
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', width: '100%', padding: '20px', boxSizing: 'border-box' },
  card: { backgroundColor: 'white', padding: '40px 30px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  
  progressBarContainer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#f0f0f0' },
  progressBarFill: { height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease' },
  
  logoContainer: { marginBottom: '20px' },
  logoIcon: { width: '50px', height: 'auto' },
  title: { color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800' },
  subtitle: { color: '#666', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' },
  
  // ✅ ESTILOS NUEVOS PARA STEP 0 (Tarjetas de Rol)
  roleGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roleCard: { 
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', 
    backgroundColor: '#fff', border: '2px solid var(--primary-color)', 
    borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s',
    textAlign: 'center'
  },
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