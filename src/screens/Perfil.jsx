import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
// ✅ Importamos helpers compartidos
import { obtenerDatosUnificados, formatoMoneda } from '../services/dataService';

/**
 *    COMPONENTE PERFIL & BIENVENIDA
 *    Lógica financiera maximizadora.
 *    Desglose: Valor Casa (Crédito + Enganche + Extra) vs Gastos (Escrituras).
 */
export default function Perfil() {
  const navigate = useNavigate();
  const { login, trackBehavior } = useUser();

  // --- ESTADOS DE NAVEGACIÓN ---
  const [step, setStep] = useState(0); 
  const totalSteps = 4;

  // --- ESTADOS DE DATOS ---
  const [nombre, setNombre] = useState('');
  const [capitalInicial, setCapitalInicial] = useState(250000);
  const [mensualidad, setMensualidad] = useState(15000);
  const [recamaras, setRecamaras] = useState(null); 
  const [entregaInmediata, setEntregaInmediata] = useState(null);

  // --- ESTADOS DE CÁLCULO ---
  const [presupuestoMaximo, setPresupuestoMaximo] = useState(0);
  const [notaDinamica, setNotaDinamica] = useState('');
  const [esAlerta, setEsAlerta] = useState(false);
  
  const [desglose, setDesglose] = useState({
    banco: 0,
    engancheMinimo: 0,
    aportacionExtra: 0,
    escrituras: 0
  });

  const [confettiParticles, setConfettiParticles] = useState([]);

  // ==========================================
  // 1. LÓGICA FINANCIERA (MAXIMIZADORA)
  // ==========================================
  useEffect(() => {
    const PORCENTAJE_GASTOS_NOTARIALES = 0.06; // 6%
    const PORCENTAJE_ENGANCHE_MIN = 0.10;      // 10%
    const FACTOR_MENSUALIDAD = 11000;          // 11k mensual = 1M crédito

    // A. Crédito Máximo
    const maxCreditoBanco = (mensualidad / FACTOR_MENSUALIDAD) * 1000000;

    // B. Capacidad Maximizada (Suma de Flujo + Ahorro)
    // Formula: (Credito + Ahorro) / 1.06 = Precio Casa
    const capacidadPorSuma = (maxCreditoBanco + capitalInicial) / (1 + PORCENTAJE_GASTOS_NOTARIALES);

    // C. Capacidad Limitada por Efectivo (Regla del 16%)
    const capacidadPorEfectivo = capitalInicial / (PORCENTAJE_ENGANCHE_MIN + PORCENTAJE_GASTOS_NOTARIALES);

    // Presupuesto Real
    const capacidadReal = Math.min(capacidadPorSuma, capacidadPorEfectivo);
    setPresupuestoMaximo(capacidadReal);

    if (capacidadReal > 0) {
        // --- CÁLCULO DE DESGLOSE ---
        const escrituras = capacidadReal * PORCENTAJE_GASTOS_NOTARIALES;
        const engancheMinimo = capacidadReal * PORCENTAJE_ENGANCHE_MIN;
        
        // Gastos obligatorios que salen del ahorro
        const gastosObligatorios = escrituras + engancheMinimo;
        
        // El resto del ahorro se va a capital para completar el precio
        const aportacionExtra = Math.max(0, capitalInicial - gastosObligatorios);

        // Crédito Final = Precio Casa - (Enganche + Extra)
        const creditoFinal = capacidadReal - (engancheMinimo + aportacionExtra);

        setDesglose({
            banco: creditoFinal,
            engancheMinimo: engancheMinimo,
            aportacionExtra: aportacionExtra,
            escrituras: escrituras
        });

        // Feedback
        if (capacidadPorEfectivo < capacidadPorSuma) {
            setNotaDinamica("Tu ahorro es el límite. Podrías pagar una mensualidad mayor, pero te falta efectivo para las escrituras.");
            setEsAlerta(true);
        } else {
            setNotaDinamica("¡Presupuesto optimizado! Usamos todo tu crédito y ahorro disponibles.");
            setEsAlerta(false);
        }
    }
  }, [capitalInicial, mensualidad]);

  // ==========================================
  // 2. CONFETI
  // ==========================================
  useEffect(() => {
    if (step === 4) {
      const particles = Array.from({ length: 50 }).map((_, i) => ({
        id: i, x: 50, y: 50,
        tx: (Math.random() - 0.5) * 200, ty: (Math.random() - 1) * 200,
        color: ['#FFD700', '#FF4500', '#00FF00', '#1E90FF', '#FF69B4'][Math.floor(Math.random() * 5)],
        scale: Math.random() * 1 + 0.5, rotation: Math.random() * 360
      }));
      setConfettiParticles(particles);
    }
  }, [step]);

  // ==========================================
  // 3. CONTEO OPCIONES
  // ==========================================
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
  // NAVEGACIÓN
  // ==========================================
  const handleRoleSelection = (role) => {
    trackBehavior('select_role', { role });
    if (role === 'asesor') navigate('/soy-asesor');
    else setStep(1);
  };

  const isStepValid = () => {
    if (step === 1) return nombre.trim().length > 0;
    if (step === 2) return recamaras !== null && entregaInmediata !== null;
    return true;
  };

  const nextStep = () => {
    if (isStepValid() && step < totalSteps) {
      trackBehavior('step_completed', { step_number: step });
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else if (step === 1) setStep(0);
  };

  const handleFinalizar = () => {
    const userProfile = {
      nombre, capitalInicial, mensualidadMaxima: mensualidad, presupuestoCalculado: presupuestoMaximo,
      recamaras, status: entregaInmediata ? 'inmediata' : 'preventa' 
    };
    login(userProfile);
    trackBehavior('onboarding_completed', { presupuesto: presupuestoMaximo });
    navigate('/catalogo');
  };

  return (
    <div style={styles.container}>
      <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .step-content { animation: slideIn 0.4s ease-out forwards; width: 100%; }
          @keyframes explode { 0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(var(--s)) rotate(var(--r)); opacity: 0; } }
          .confetti { position: absolute; width: 10px; height: 10px; border-radius: 2px; top: 30%; left: 50%; pointer-events: none; }
          input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: var(--primary-color); cursor: pointer; margin-top: -10px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
          input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #e0e0e0; border-radius: 3px; }
      `}</style>

      <div style={styles.card}>
        {step > 0 && <div style={styles.progressBarContainer}><div style={{...styles.progressBarFill, width: `${(step / totalSteps) * 100}%`}}></div></div>}
        {step <= 1 && <div style={styles.logoContainer}><img src="https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png" alt="Logo" style={styles.logoIcon} /></div>}

        <div className="step-content" key={step}>
          
          {step === 0 && (
            <>
              <h1 style={styles.title}>Bienvenido</h1>
              <p style={styles.subtitle}>Selecciona tu perfil para comenzar:</p>
              <div style={styles.roleGrid}>
                <button onClick={() => handleRoleSelection('comprador')} style={styles.roleCard}><div style={styles.roleIcon}>🏠</div><h3 style={styles.roleTitle}>Busco mi Hogar</h3><p style={styles.roleDesc}>Quiero ver opciones a mi alcance.</p></button>
                <button onClick={() => handleRoleSelection('asesor')} style={{...styles.roleCard, border: '2px solid #e2e8f0'}}><div style={styles.roleIcon}>💼</div><h3 style={styles.roleTitle}>Soy Asesor</h3><p style={styles.roleDesc}>Quiero subir propiedades.</p></button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 style={styles.title}>¡Hola! 👋</h1>
              <p style={styles.subtitle}>Soy tu asesor virtual. ¿Cómo te llamas?</p>
              <input type="text" placeholder="Tu nombre..." value={nombre} onChange={(e) => setNombre(e.target.value)} style={styles.input} autoFocus onKeyDown={(e) => e.key === 'Enter' && nextStep()} />
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={styles.title}>Dime qué buscas</h1>
              <p style={styles.subtitle}>Filtremos las mejores opciones para {nombre}.</p>
              <label style={styles.label}>Recámaras mínimas:</label>
              <div style={styles.optionsContainer}>{[1, 2, 3, 4].map(num => <button key={num} onClick={() => setRecamaras(num)} style={{...styles.circleBtn, backgroundColor: recamaras === num ? 'var(--primary-color)' : '#f0f0f0', color: recamaras === num ? 'white' : '#555', transform: recamaras === num ? 'scale(1.1)' : 'scale(1)'}}>{num === 4 ? '4+' : num}</button>)}</div>
              <label style={{...styles.label, marginTop: '20px'}}>Entrega:</label>
              <div style={styles.deliveryContainer}>
                <button onClick={() => setEntregaInmediata(true)} style={{...styles.deliveryBtn, backgroundColor: entregaInmediata === true ? 'var(--primary-color)' : 'white', color: entregaInmediata === true ? 'white' : '#555', borderColor: entregaInmediata === true ? 'var(--primary-color)' : '#eee'}}>Inmediata</button>
                <button onClick={() => setEntregaInmediata(false)} style={{...styles.deliveryBtn, backgroundColor: entregaInmediata === false ? 'var(--primary-color)' : 'white', color: entregaInmediata === false ? 'white' : '#555', borderColor: entregaInmediata === false ? 'var(--primary-color)' : '#eee'}}>Pre-venta</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={styles.title}>Hablemos de dinero</h1>
              <p style={styles.subtitle}>Ajusta los valores (sin compromiso) para calcular tu capacidad.</p>
              <div style={styles.calculatorBox}>
                <div style={styles.calcInputGroup}>
                  <label style={styles.labelSmall}>Tu Ahorro (Enganche + Gastos):</label>
                  <div style={styles.sliderValue}>{formatoMoneda(capitalInicial)}</div>
                  <input type="range" min="50000" max="3000000" step="10000" value={capitalInicial} onChange={(e) => setCapitalInicial(Number(e.target.value))} />
                </div>
                <div style={styles.calcInputGroup}>
                   <label style={styles.labelSmall}>Mensualidad que puedes pagar:</label>
                   <div style={styles.sliderValue}>{formatoMoneda(mensualidad)}</div>
                   <input type="range" min="5000" max="150000" step="1000" value={mensualidad} onChange={(e) => setMensualidad(Number(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              {/* CONFETI EXPLOSIVO */}
              {opcionesEncontradas > 0 && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden'}}>{confettiParticles.map(p => <div key={p.id} className="confetti" style={{backgroundColor: p.color, '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--s': p.scale, '--r': `${p.rotation}deg`, animation: `explode 1.2s ease-out forwards`}} />)}</div>}

              <h1 style={styles.title}>¡Listo, {nombre}!</h1>
              <p style={styles.subtitle}>Este es el valor máximo de propiedad recomendado para ti:</p>
              
              <div style={styles.finalResultBox}>
                <span style={{fontSize: '0.9rem', opacity: 0.8}}>Valor Máximo de Propiedad:</span>
                <div style={styles.finalAmount}>{formatoMoneda(presupuestoMaximo)}</div>
                
                {/* 🏦 DESGLOSE FINANCIERO CORREGIDO */}
                <div style={styles.breakdownContainer}>
                  <h4 style={styles.breakdownTitle}>¿Cómo se paga esta casa?</h4>
                  
                  <div style={styles.breakdownRow}>
                    <span style={styles.breakdownLabel}>🏦 Crédito Banco (Máx):</span>
                    <span style={styles.breakdownValue}>{formatoMoneda(desglose.banco)}</span>
                  </div>
                  
                  <div style={styles.breakdownRow}>
                    <span style={styles.breakdownLabel}>💰 Enganche Mínimo (10%):</span>
                    <span style={styles.breakdownValue}>+ {formatoMoneda(desglose.engancheMinimo)}</span>
                  </div>

                  {desglose.aportacionExtra > 0 && (
                    <div style={styles.breakdownRow}>
                      <span style={styles.breakdownLabel}>➕ Aportación de tu ahorro:</span>
                      <span style={styles.breakdownValue}>+ {formatoMoneda(desglose.aportacionExtra)}</span>
                    </div>
                  )}

                  {/* LÍNEA SEPARADORA */}
                  <div style={{height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '10px 0'}}></div>

                  {/* CAJA DE ESCRITURAS */}
                  <div style={styles.remanenteBox}>
                    <span style={{fontSize:'0.8rem', opacity: 0.9}}>Gastos Notariales (6% aprox):</span>
                    <div style={{color: '#fff', fontWeight:'bold', marginTop:'2px'}}>
                       {formatoMoneda(desglose.escrituras)}
                    </div>
                    <span style={{fontSize:'0.7rem', opacity: 0.7}}>*Se pagan aparte con tu ahorro.</span>
                  </div>
                </div>
              </div>

              <p style={{fontSize: '1rem', color: '#166534', marginTop: '20px', fontWeight: '600', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0'}}>
                {opcionesEncontradas > 0 
                  ? `¡Buenas noticias! 🎉 Hay al menos ${opcionesEncontradas} viviendas para ti.`
                  : "El mercado está un poco ajustado con estos números. Prueba aumentando un poco tu ahorro o mensualidad."}
              </p>
            </>
          )}
        </div>

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
  card: { backgroundColor: 'white', padding: '40px 30px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '680px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  progressBarContainer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#f0f0f0' },
  progressBarFill: { height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease' },
  logoContainer: { marginBottom: '20px' },
  logoIcon: { width: '50px', height: 'auto' },
  title: { color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800' },
  subtitle: { color: '#666', marginBottom: '20px', fontSize: '1rem', lineHeight: '1.5' },
  roleGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roleCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#fff', border: '2px solid var(--primary-color)', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center' },
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
  
  finalResultBox: { backgroundColor: 'var(--primary-color)', color: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,57,106,0.25)', marginTop: '10px' },
  finalAmount: { fontSize: '2.2rem', fontWeight: 'bold', margin: '5px 0 15px 0' },
  
  breakdownContainer: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '15px', marginBottom: '10px', textAlign: 'left' },
  breakdownTitle: { margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.9, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' },
  breakdownLabel: { opacity: 0.8 },
  breakdownValue: { fontWeight: 'bold' },
  remanenteBox: { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' },
  
  resultNote: { fontSize: '0.85rem', lineHeight: '1.4', fontStyle: 'italic', marginTop: '10px' },
  navContainer: { display: 'flex', gap: '15px', marginTop: '20px' },
  primaryButton: { flex: 2, backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '18px', fontSize: '1.1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  secondaryButton: { flex: 1, backgroundColor: 'transparent', color: '#888', border: '2px solid #eee', padding: '18px', fontSize: '1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }
};