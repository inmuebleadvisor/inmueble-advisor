import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

// --- ICONOS SVG ---
// Definimos los iconos aquí para no depender de librerías externas.
const Icons = {
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Users: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Handshake: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path></svg>,
  Trophy: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8m-4-9v9m-2.062-5.36L15 15.586l4.939-4.939a2.939 2.939 0 0 0-4.158-4.158L10 10.586l-2.781-2.781a2.939 2.939 0 0 0-4.158 4.158L8 16.94z"/></svg>,
  Star: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Percentage: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
};

export default function LandingAsesores() {
  const { trackBehavior } = useUser();
  const [variant, setVariant] = useState(null);

  /**
   * 🎲 LÓGICA DE EXPERIMENTACIÓN (A/B TESTING)
   * Se ejecuta una sola vez al montar el componente.
   * Decide aleatoriamente qué título mostrar para medir efectividad.
   */
  useEffect(() => {
    const selectedVariant = Math.random() > 0.5 ? 'A' : 'B';
    setVariant(selectedVariant);
    
    // Registramos qué variante vio el usuario
    trackBehavior('view_landing_advisor', { variant: selectedVariant });
  }, []);

  /**
   * Manejador del botón de acción (CTA)
   * @param {string} source - Indica si el clic fue en el 'hero' o en el 'footer'
   */
  const handleJoinClick = (source) => {
    trackBehavior('click_join_advisor', { variant: variant, source: source });
    alert("¡Gracias por tu interés! Pronto habilitaremos el registro.");
  };

  // Evitamos renderizar nada hasta que se decida la variante A o B
  if (!variant) return null;

  return (
    // Usamos 'main-content' (de index.css) para márgenes consistentes y 'animate-fade-in' para suavidad
    <div className="main-content animate-fade-in" style={{ paddingBottom: '50px' }}>
      
      {/* --- HERO SECTION: Primera impresión --- */}
      <header style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>Portal de Aliados</span>
          
          {/* Título dinámico basado en la variante A/B */}
          <h1 style={styles.heroTitle}>
            {variant === 'A' 
              ? "Inmueble Advisor te premia con Leads Calificados si das un buen servicio."
              : "Inmueble Advisor te premia con Leads Calificados si eres un buen Asesor."
            }
          </h1>

          <p style={styles.heroSubtitle}>
            La primera plataforma basada en meritocracia de datos. 
            Olvídate de pagar por visibilidad; gánatela con calidad.
          </p>

          <button onClick={() => handleJoinClick('hero')} style={styles.ctaButton}>
            Quiero unirme ahora
          </button>
          
          <p style={styles.disclaimerText}>
            *Acceso exclusivo para asesores certificados.
          </p>
        </div>
      </header>

      {/* --- CÓMO FUNCIONA: Explicación del proceso --- */}
      <section style={styles.stepsSection}>
        <h2 style={styles.sectionTitle}>¿Cómo trabajamos juntos?</h2>
        
        <div style={styles.stepsGrid}>
          {/* Paso 1 */}
          <div style={styles.stepCard}>
            <div style={styles.iconCircle}><Icons.Upload /></div>
            <h3 style={styles.stepTitle}>1. Das de Alta</h3>
            <p style={styles.stepText}>
              Tú cargas o actualizas la información de tus propiedades. Nosotros te damos las herramientas.
            </p>
          </div>

          {/* Paso 2 */}
          <div style={styles.stepCard}>
            <div style={styles.iconCircle}><Icons.Users /></div>
            <h3 style={styles.stepTitle}>2. Agendamos Cita</h3>
            <p style={styles.stepText}>
              Nosotros buscamos personas interesadas, perfilamos su crédito y las citamos para que las atiendas.
            </p>
          </div>

          {/* Paso 3 */}
          <div style={styles.stepCard}>
            <div style={styles.iconCircle}><Icons.Handshake /></div>
            <h3 style={styles.stepTitle}>3. Cierras la Venta</h3>
            <p style={styles.stepText}>
              Tú haces lo que mejor sabes hacer: atender al cliente y lograr el cierre de la operación.
            </p>
          </div>
        </div>
      </section>

      {/* --- MODELO DE NEGOCIO (FEE): Claridad financiera --- */}
      <section style={styles.feeSection}>
        {/* 
           ⚠️ IMPORTANTE: Usamos la clase 'flex-responsive' definida en index.css 
           para que en móvil se ponga en columna y centrado, y en PC en fila.
        */}
        <div className="flex-responsive"> 
          <div style={styles.feeIconWrapper}>
            <Icons.Percentage />
          </div>
          <div style={styles.feeTextWrapper}>
            <h3 style={styles.feeTitle}>Ganamos solo si tú ganas</h3>
            <p style={styles.feeText}>
              Nuestro modelo es 100% contra resultados. 
              <strong> Solo si la venta se realiza</strong> cobramos un fee del <strong>1%</strong> sobre el valor de la propiedad.
            </p>
            <p style={styles.feeSubtext}>
              Sin mensualidades, sin pagos por leads basura. Riesgo compartido.
            </p>
          </div>
        </div>
      </section>

      {/* --- SCORECARD: Explicación de reglas --- */}
      <section style={styles.scoreSection}>
        <div style={styles.scoreContainer}>
          <h2 style={{...styles.sectionTitle, color: 'white'}}>Gestiona tu Score</h2>
          <p style={{color: '#cbd5e1', marginBottom: '30px'}}>
            Tu visibilidad depende de tu calidad, no de tu presupuesto.
          </p>
          
          <div style={styles.scoreVisual}>
            <div style={styles.scoreBarContainer}>
              <div style={styles.scoreBarFill}></div>
              <div style={styles.scoreBadge}>Tu Nivel</div>
            </div>
            <div style={styles.scoreRules}>
              <div style={styles.ruleItem}>✅ <strong>Sube puntos:</strong> Actualizar precios y disponibilidad.</div>
              <div style={styles.ruleItem}>✅ <strong>Sube puntos:</strong> Buenas reseñas de clientes atendidos.</div>
              <div style={styles.ruleItem}>❌ <strong>Baja puntos:</strong> Datos falsos o desactualizados.</div>
              <div style={styles.ruleItem}>❌ <strong>Baja puntos:</strong> Mal servicio en la cita.</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIOS: Prueba social --- */}
      <section style={styles.testimonialSection}>
        <h2 style={styles.sectionTitle}>Lo que dicen los expertos</h2>
        <div style={styles.testimonialGrid}>
          <div style={styles.testimonialCard}>
            <div style={styles.stars}><Icons.Star /><Icons.Star /><Icons.Star /><Icons.Star /><Icons.Star /></div>
            <p style={styles.quote}>"Por fin una plataforma que valora mi trabajo y no solo quién paga más anuncios. Mis cierres aumentaron un 30%."</p>
            <p style={styles.author}>- Carlos M., Asesor Inmobiliario</p>
          </div>
          <div style={styles.testimonialCard}>
            <div style={styles.stars}><Icons.Star /><Icons.Star /><Icons.Star /><Icons.Star /><Icons.Star /></div>
            <p style={styles.quote}>"La calidad de los leads es impresionante. Ya vienen con presupuesto real, no pierdo el tiempo."</p>
            <p style={styles.author}>- Ana R., Gerente de Ventas</p>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA: Último llamado a la acción --- */}
      <div style={styles.finalCtaSection}>
        <p style={styles.finalCtaText}>¿Listo para recibir mejores clientes?</p>
        <button onClick={() => handleJoinClick('footer')} style={styles.ctaButtonSecondary}>
          Contactar
        </button>
      </div>

    </div>
  );
}

// --- ESTILOS CSS-IN-JS ---
const styles = {
  // Hero
  heroSection: {
    backgroundColor: 'white', padding: '40px 0', textAlign: 'center', marginBottom: '40px'
  },
  heroContent: { maxWidth: '800px', margin: '0 auto' },
  heroBadge: {
    backgroundColor: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px',
    fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px',
    display: 'inline-block', marginBottom: '20px'
  },
  heroTitle: {
    fontSize: '2.5rem', color: 'var(--primary-color)', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px'
  },
  heroSubtitle: { fontSize: '1.2rem', color: '#64748b', lineHeight: '1.6', marginBottom: '40px' },
  ctaButton: {
    backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '18px 40px',
    fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(0,0,0, 0.2)', transition: 'transform 0.2s', marginBottom: '15px'
  },
  disclaimerText: { fontSize: '0.8rem', color: '#94a3b8' },

  // Steps
  stepsSection: { marginBottom: '50px' },
  sectionTitle: {
    textAlign: 'center', fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '40px'
  },
  stepsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px'
  },
  stepCard: {
    backgroundColor: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb'
  },
  iconCircle: {
    width: '80px', height: '80px', backgroundColor: '#eff6ff', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
    color: 'var(--primary-color)'
  },
  stepTitle: { fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '10px' },
  stepText: { color: '#64748b', lineHeight: '1.5' },

  // Fee Section
  feeSection: { 
    backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '20px', 
    padding: '40px', marginBottom: '50px', maxWidth: '900px', margin: '0 auto 50px auto' 
  },
  feeIconWrapper: { 
    backgroundColor: '#ffedd5', color: '#c2410c', padding: '20px', borderRadius: '50%', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
  },
  // ⚠️ Corrección: Eliminado 'textAlign: left' para permitir que el CSS global centre el texto en móvil
  feeTextWrapper: { flex: 1 }, 
  feeTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#9a3412', marginBottom: '10px' },
  feeText: { fontSize: '1.1rem', color: '#431407', lineHeight: '1.6', marginBottom: '10px' },
  feeSubtext: { fontSize: '0.9rem', color: '#9a3412', fontStyle: 'italic' },

  // Scorecard
  scoreSection: {
    padding: '50px 20px', backgroundColor: 'var(--primary-color)', color: 'white',
    borderRadius: '20px', marginBottom: '50px'
  },
  scoreContainer: { maxWidth: '800px', margin: '0 auto', textAlign: 'center' },
  scoreVisual: {
    backgroundColor: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  scoreBarContainer: {
    height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px',
    marginBottom: '30px', position: 'relative', overflow: 'hidden'
  },
  scoreBarFill: { width: '70%', height: '100%', backgroundColor: '#22c55e', borderRadius: '10px' },
  scoreBadge: {
    position: 'absolute', top: '-30px', right: '25%', backgroundColor: '#22c55e', color: 'white',
    padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold'
  },
  scoreRules: { textAlign: 'left', display: 'grid', gap: '15px' },
  ruleItem: { fontSize: '1rem', color: '#e2e8f0' },

  // Testimonials
  testimonialSection: { marginBottom: '50px' },
  testimonialGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
  testimonialCard: {
    backgroundColor: 'white', padding: '30px', borderRadius: '16px',
    border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
  },
  stars: { display: 'flex', gap: '5px', marginBottom: '15px' },
  quote: { fontSize: '1.1rem', fontStyle: 'italic', color: '#334155', marginBottom: '20px', lineHeight: '1.6' },
  author: { fontWeight: 'bold', color: 'var(--primary-color)' },

  // Final CTA
  finalCtaSection: { textAlign: 'center', marginTop: '40px', padding: '20px' },
  finalCtaText: { fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' },
  ctaButtonSecondary: {
    backgroundColor: 'white', color: 'var(--primary-color)',
    border: '2px solid var(--primary-color)', padding: '15px 50px',
    fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '50px',
    cursor: 'pointer', transition: 'all 0.2s'
  }
};