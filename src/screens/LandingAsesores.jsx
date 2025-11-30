// src/screens/LandingAsesores.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// --- ICONOS (SVG en línea para rendimiento) ---
const Icons = {
  // ... (Mismos iconos que tenías, para ahorrar espacio no los repito aquí) ...
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function LandingAsesores() {
  const navigate = useNavigate();
  const { trackBehavior, loginWithGoogle, userProfile } = useUser(); 
  
  // ✅ CORRECCIÓN 1: Inicialización síncrona para evitar parpadeo (Flicker)
  const [variant] = useState(() => Math.random() > 0.5 ? 'A' : 'B');
  
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ CORRECCIÓN 2: Lógica de redirección inteligente
  const handleActionClick = async (source) => {
    trackBehavior('click_advisor_cta', { variant, source });
    
    // Si ya es asesor, lo mandamos directo a su dashboard/perfil
    if (userProfile?.role === 'asesor') {
      navigate('/perfil');
      return;
    }

    setIsProcessing(true);
    try {
      // Intentamos login (o verificamos sesión actual)
      // Nota: loginWithGoogle ahora NO cambia el rol, solo loguea.
      await loginWithGoogle();
      
      // Una vez logueado (sea nuevo o cliente existente), vamos al wizard
      navigate('/onboarding-asesor');
      
    } catch (error) {
      console.error("Error en flujo de entrada:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="main-content animate-fade-in" style={{ paddingBottom: '50px' }}>
      
      {/* HEADER HERO */}
      <header style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>Portal de Aliados</span>
          
          <h1 style={styles.heroTitle}>
            {variant === 'A' 
              ? "Gana comisiones por tu servicio, no por tu publicidad."
              : "Inmueble Advisor premia tu calidad con Leads reales."
            }
          </h1>

          <p style={styles.heroSubtitle}>
            Únete a la primera red inmobiliaria basada en meritocracia. 
            Si tienes buenas propiedades y buen trato, los clientes son tuyos.
          </p>

          <button 
            onClick={() => handleActionClick('hero')} 
            disabled={isProcessing} 
            style={{...styles.ctaButton, opacity: isProcessing ? 0.7 : 1}}
          >
            {isProcessing ? 'Conectando...' : 'Comenzar Registro Gratuito'}
          </button>
          
          <p style={styles.disclaimerText}>*Sin tarjetas de crédito. Registro en 2 minutos.</p>
        </div>
      </header>

      {/* BENEFICIOS (Diseño mejorado) */}
      <section style={styles.benefitsGrid}>
          <div style={styles.benefitCard}>
             <h3>🚀 Leads Calificados</h3>
             <p>Olvídate de "sólo estoy viendo". Te enviamos clientes con crédito perfilado.</p>
          </div>
          <div style={styles.benefitCard}>
             <h3>🤝 Cero Riesgo</h3>
             <p>No cobramos mensualidad. Solo ganamos una comisión si tú cierras la venta.</p>
          </div>
          <div style={styles.benefitCard}>
             <h3>⭐ Tu Reputación Cuenta</h3>
             <p>Tu posición en el buscador depende de tus reseñas, no de cuánto pagues.</p>
          </div>
      </section>

      {/* CTA FINAL */}
      <div style={styles.finalCtaSection}>
        <h3>¿Listo para modernizar tu forma de vender?</h3>
        <button 
          onClick={() => handleActionClick('footer')} 
          disabled={isProcessing}
          style={styles.ctaButtonSecondary}
        >
          Crear Cuenta de Asesor
        </button>
      </div>
    </div>
  );
}

const styles = {
  heroSection: { textAlign: 'center', padding: '60px 20px 40px', backgroundColor: 'white' },
  heroContent: { maxWidth: '800px', margin: '0 auto' },
  heroBadge: { backgroundColor: '#eff6ff', color: 'var(--primary-color)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '20px' },
  heroTitle: { fontSize: '2.5rem', color: '#111827', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px' },
  heroSubtitle: { fontSize: '1.2rem', color: '#4b5563', lineHeight: '1.6', marginBottom: '40px' },
  ctaButton: { backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '18px 32px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,57,106,0.3)', transition: 'transform 0.2s' },
  disclaimerText: { marginTop: '15px', fontSize: '0.85rem', color: '#9ca3af' },
  benefitsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' },
  benefitCard: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', textAlign: 'center' },
  finalCtaSection: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', marginTop: '40px' },
  ctaButtonSecondary: { backgroundColor: 'transparent', color: 'var(--primary-color)', border: '2px solid var(--primary-color)', padding: '15px 40px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer', marginTop: '20px' }
};