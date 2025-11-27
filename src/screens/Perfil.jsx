import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Importamos datos para calcular coincidencias reales
import modelosRaw from '../data/modelos.json';
import desarrollosRaw from '../data/desarrollos.json';

// ==========================================
// HELPERS (Lógica traída para el filtrado)
// ==========================================
const esFechaFutura = (fechaStr) => {
  if (!fechaStr) return false;
  try {
    const partes = fechaStr.split('/'); // DD/MM/YYYY
    if (partes.length !== 3) return false;
    const fechaEntrega = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoy = new Date();
    return fechaEntrega > hoy;
  } catch (e) { return false; }
};

const procesarDatosMaestros = (modelos, desarrollos) => {
  const desarrolloMap = new Map();
  desarrollos.forEach(d => {
    const idDev = String(d.id_desarrollo || d.id).trim(); 
    if (idDev) desarrolloMap.set(idDev, d);
  });

  return modelos.map((modelo) => {
    const idDev = String(modelo.id_desarrollo || modelo.desarrollo_id).trim();
    const desarrolloInfo = desarrolloMap.get(idDev);

    let precioFinal = 0;
    const precioRaw = modelo.precio?.actual || modelo.precio;
    if (precioRaw) {
      precioFinal = Number(String(precioRaw).replace(/[^0-9.]/g, ""));
    }

    // Detección de Preventa
    const statusRaw = desarrolloInfo?.status || '';
    const statusLower = String(statusRaw).toLowerCase();
    const fechaEntrega = desarrolloInfo?.info_comercial?.fecha_entrega || '';
    
    const esPrevTexto = statusLower.includes('preventa') || 
                        statusLower.includes('pre-venta') ||
                        statusLower.includes('construcci') || 
                        statusLower.includes('obra') ||
                        statusLower.includes('avance');
    const esPrevFecha = esFechaFutura(fechaEntrega);
    const esPreventa = esPrevTexto || esPrevFecha;

    return {
      ...modelo,
      precioNumerico: precioFinal,
      recamaras: Number(modelo.caracteristicas?.recamaras || modelo.recamaras || 0),
      esPreventa: esPreventa
    };
  });
};

/**
 * COMPONENTE PERFIL
 */
export default function Perfil() {
  const navigate = useNavigate();
  const { login, trackBehavior } = useUser();

  // ==========================================
  // ESTADOS DE CONTROL E INTERFAZ
  // ==========================================
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // ==========================================
  // ESTADOS DE DATOS (Respuestas del Usuario)
  // ==========================================
  const [nombre, setNombre] = useState('');
  const [capitalInicial, setCapitalInicial] = useState(250000);
  const [mensualidad, setMensualidad] = useState(15000);
  const [recamaras, setRecamaras] = useState(null); 
  const [entregaInmediata, setEntregaInmediata] = useState(null);

  // ==========================================
  // ESTADOS DE CÁLCULO
  // ==========================================
  const [presupuestoMaximo, setPresupuestoMaximo] = useState(0);
  const [notaDinamica, setNotaDinamica] = useState('');
  const [esAlerta, setEsAlerta] = useState(false);

  // Helper de formato moneda
  const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  // ==========================================
  // 1. LÓGICA FINANCIERA (Ajustada)
  // ==========================================
  useEffect(() => {
    const PORCENTAJE_GASTOS_NOTARIALES = 0.06;
    const PORCENTAJE_ENGANCHE = 0.10; // Siempre 10% según requerimiento
    const FACTOR_MENSUALIDAD_POR_MILLON = 11000;

    // Capacidad basada en crédito
    const maxCreditoBanco = (mensualidad / FACTOR_MENSUALIDAD_POR_MILLON) * 1000000;
    
    // Capacidad basada solo en efectivo (Efectivo debe cubrir el 16% del valor total)
    const limitePorEfectivo = capitalInicial / (PORCENTAJE_GASTOS_NOTARIALES + PORCENTAJE_ENGANCHE);
    
    // Capacidad total (Crédito + Efectivo disponible para enganche/gastos)
    // PrecioCasa = Credito + Enganche
    // CapitalInicial >= Enganche + GastosNotariales
    // CapitalInicial >= (0.10 * Precio) + (0.06 * Precio)
    // Si el crédito limita: Precio = Credito / 0.90 (asumiendo 90% financiamiento máx)
    // Pero usaremos la lógica conservadora: El presupuesto es el menor entre lo que permite el efectivo y lo que permite la deuda.
    
    // Formula simplificada de "Poder de Compra":
    // Opción A (Limitada por efectivo): Capital / 0.16
    // Opción B (Limitada por mensualidad): (Capital + Credito) / 1.06 (Aprox, asumiendo que Capital paga enganche y gastos)
    
    // Mantendremos la lógica original de comparación, ajustando el enganche fijo al 10%
    const limitePorCapacidadTotal = (capitalInicial + maxCreditoBanco) / (1 + PORCENTAJE_GASTOS_NOTARIALES);

    const capacidadReal = Math.min(limitePorEfectivo, limitePorCapacidadTotal);
    setPresupuestoMaximo(capacidadReal);

    if (capacidadReal > 0) {
      // Cálculo del remanente
      const costoTotalInicial = capacidadReal * (PORCENTAJE_ENGANCHE + PORCENTAJE_GASTOS_NOTARIALES);
      const remanente = Math.max(0, capitalInicial - costoTotalInicial);

      // Validación de alerta (si el efectivo limita mucho la capacidad de crédito)
      if (limitePorEfectivo < (limitePorCapacidadTotal - 50000)) {
        setNotaDinamica(`Incluye gastos notariales (6%) y enganche (10%). Te sobran ${formatoMoneda(remanente)} de tu efectivo inicial.`);
        setEsAlerta(true); // Usamos alerta para resaltar que el efectivo es el "cuello de botella"
      } else {
        setNotaDinamica(`Incluye gastos notariales (6%) y enganche (10%). Te sobran ${formatoMoneda(remanente)} de tu efectivo inicial.`);
        setEsAlerta(false);
      }
    }
  }, [capitalInicial, mensualidad]);

  // ==========================================
  // 2. CONTEO DE OPCIONES (Nuevo)
  // ==========================================
  const opcionesEncontradas = useMemo(() => {
    if (presupuestoMaximo === 0) return 0;

    const dataProcesada = procesarDatosMaestros(modelosRaw, desarrollosRaw);
    
    return dataProcesada.filter(item => {
      // Filtro Precio
      if (item.precioNumerico > presupuestoMaximo) return false;
      
      // Filtro Recámaras
      if (recamaras && item.recamaras < recamaras) return false;
      
      // Filtro Entrega (Si entregaInmediata es true, descarta preventas. Si es false, acepta todo)
      if (entregaInmediata === true && item.esPreventa === true) return false;
      
      return true;
    }).length;

  }, [presupuestoMaximo, recamaras, entregaInmediata]);

  // ==========================================
  // NAVEGACIÓN
  // ==========================================
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
  };

  const handleFinalizar = () => {
    const userProfile = {
      nombre,
      capitalInicial,
      mensualidadMaxima: mensualidad,
      presupuestoCalculado: presupuestoMaximo,
      recamaras,
      entregaInmediata
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
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .step-content {
            animation: slideIn 0.4s ease-out forwards;
          }
          input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%;
            background: var(--primary-color); cursor: pointer; margin-top: -10px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%; height: 6px; cursor: pointer; background: #e0e0e0; border-radius: 3px;
          }
        `}
      </style>

      <div style={styles.card}>
        <div style={styles.progressBarContainer}>
          <div style={{...styles.progressBarFill, width: `${(step / totalSteps) * 100}%`}}></div>
        </div>
        
        {/* LOGO: Solo en el paso 1 */}
        {step === 1 && (
          <div style={styles.logoContainer}>
            <img src="https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png" alt="Logo" style={styles.logoIcon} />
          </div>
        )}

        <div className="step-content" key={step}> 
          
          {/* PASO 1: NOMBRE */}
          {step === 1 && (
            <>
              <h1 style={styles.title}>¡Hola! 👋</h1>
              <p style={styles.subtitle}>Soy tu asesor virtual. Antes de empezar, ¿cómo te gusta que te llamen?</p>
              <input
                type="text"
                placeholder="Escribe tu nombre aquí..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={styles.input}
                autoFocus
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
                  <button
                    key={num}
                    onClick={() => setRecamaras(num)}
                    style={{
                      ...styles.circleBtn,
                      backgroundColor: recamaras === num ? 'var(--primary-color)' : '#f0f0f0',
                      color: recamaras === num ? 'white' : '#555',
                      transform: recamaras === num ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {num === 4 ? '4+' : num}
                  </button>
                ))}
              </div>

              <label style={{...styles.label, marginTop: '20px'}}>Tiempo de entrega:</label>
              <div style={styles.deliveryContainer}>
                <button
                  onClick={() => setEntregaInmediata(true)}
                  style={{
                    ...styles.deliveryBtn,
                    backgroundColor: entregaInmediata === true ? 'var(--primary-color)' : 'white',
                    color: entregaInmediata === true ? 'white' : '#555',
                    borderColor: entregaInmediata === true ? 'var(--primary-color)' : '#eee',
                  }}
                >
                  Entrega inmediata
                </button>
                <button
                  onClick={() => setEntregaInmediata(false)}
                  style={{
                    ...styles.deliveryBtn,
                    backgroundColor: entregaInmediata === false ? 'var(--primary-color)' : 'white',
                    color: entregaInmediata === false ? 'white' : '#555',
                    borderColor: entregaInmediata === false ? 'var(--primary-color)' : '#eee',
                  }}
                >
                   Pre-venta
                </button>
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
                  <input 
                    type="range" 
                    min="50000" max="3000000" step="10000" 
                    value={capitalInicial} 
                    onChange={(e) => setCapitalInicial(Number(e.target.value))} 
                  />
                </div>

                <div style={styles.calcInputGroup}>
                  <label style={styles.labelSmall}>Mensualidad cómoda:</label>
                  <div style={styles.sliderValue}>{formatoMoneda(mensualidad)}</div>
                  <input 
                    type="range" 
                    min="5000" max="150000" step="1000" 
                    value={mensualidad} 
                    onChange={(e) => setMensualidad(Number(e.target.value))} 
                  />
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
                <div style={{
                  ...styles.resultNote,
                  // Si es alerta usamos un amarillo suave, si no blanco
                  color: esAlerta ? '#fff9c4' : 'white', 
                  fontWeight: '500'
                }}>
                  {notaDinamica}
                </div>
              </div>
              
              <p style={{fontSize: '0.9rem', color: '#666', marginTop: '20px'}}>
                {opcionesEncontradas > 0 
                  ? "Hemos analizado el mercado para ti." 
                  : "Ajusta tus filtros para encontrar más opciones."}
              </p>
            </>
          )}

        </div>

        <div style={styles.navContainer}>
          {step > 1 && (
            <button onClick={prevStep} style={styles.secondaryButton}>
              Atrás
            </button>
          )}
          
          {step < totalSteps ? (
            <button 
              onClick={nextStep} 
              disabled={!isStepValid()}
              style={{
                ...styles.primaryButton,
                opacity: isStepValid() ? 1 : 0.5,
                width: step === 1 ? '100%' : 'auto'
              }}
            >
              Siguiente 👉
            </button>
          ) : (
            <button 
              onClick={handleFinalizar}
              style={{...styles.primaryButton, backgroundColor: '#28a745'}}
            >
              Encontramos {opcionesEncontradas} opciones
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ESTILOS
const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '85vh', width: '100%', padding: '20px', boxSizing: 'border-box'
  },
  card: {
    backgroundColor: 'white', padding: '40px 30px', borderRadius: '25px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
    minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  },
  progressBarContainer: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#f0f0f0'
  },
  progressBarFill: {
    height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease'
  },
  logoContainer: { marginBottom: '20px' },
  logoIcon: { width: '50px', height: 'auto' },
  title: { color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800' },
  subtitle: { color: '#666', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' },
  input: {
    width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid #eee',
    fontSize: '1.2rem', textAlign: 'center', outline: 'none', marginBottom: '20px'
  },
  label: { display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '10px', textAlign: 'left' },
  optionsContainer: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '10px' },
  circleBtn: {
    width: '55px', height: '55px', borderRadius: '50%', border: 'none', fontSize: '1.2rem',
    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  },
  deliveryContainer: { display: 'flex', gap: '10px' },
  deliveryBtn: {
    flex: 1, padding: '15px 5px', borderRadius: '15px', border: '2px solid', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s ease'
  },
  calculatorBox: { backgroundColor: '#f9fcff', borderRadius: '20px', padding: '20px', border: '1px solid #eef' },
  calcInputGroup: { marginBottom: '25px', textAlign: 'left' },
  labelSmall: { fontSize: '0.9rem', color: '#555', fontWeight: '600', display: 'block', marginBottom: '5px' },
  sliderValue: { fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '5px' },
  finalResultBox: {
    backgroundColor: 'var(--primary-color)', color: 'white', padding: '30px', borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,57,106,0.25)', animation: 'pulse 2s infinite'
  },
  finalAmount: { fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' },
  resultNote: { fontSize: '0.95rem', lineHeight: '1.5', padding: '0 10px' },
  navContainer: { display: 'flex', gap: '15px', marginTop: '30px' },
  primaryButton: {
    flex: 2, backgroundColor: 'var(--primary-color)', color: 'white', border: 'none',
    padding: '18px', fontSize: '1.1rem', borderRadius: '50px', cursor: 'pointer',
    fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  secondaryButton: {
    flex: 1, backgroundColor: 'transparent', color: '#888', border: '2px solid #eee',
    padding: '18px', fontSize: '1rem', borderRadius: '50px', cursor: 'pointer',
    fontWeight: 'bold', transition: 'all 0.2s'
  }
};