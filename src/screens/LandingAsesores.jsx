// src/screens/LandingAsesores.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function LandingAsesores() {
  const navigate = useNavigate();
  const { trackBehavior, loginWithGoogle, userProfile, user, loadingUser } = useUser(); 
  
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ CORRECCIÓN 1: Redirección Reactiva Unificada
  // Este efecto actúa como un "semáforo" inteligente. En cuanto detecta sesión, decide a dónde mandarte.
  useEffect(() => {
    if (loadingUser) return; // Esperamos a que Firebase termine de checar

    if (user && userProfile) {
      if (userProfile.role === 'asesor') {
        // Si ya eres asesor -> Dashboard
        navigate('/account-asesor');
      } else {
        // Si eres cliente o nuevo -> Onboarding
        navigate('/onboarding-asesor');
      }
    }
  }, [user, userProfile, loadingUser, navigate]);

  const handleComenzar = async () => {
    setIsProcessing(true);
    trackBehavior('click_advisor_cta', { source: 'landing_hero' });

    try {
      if (!user) {
        await loginWithGoogle(); 
        // 💡 NOTA: Ya no navegamos aquí manualmente.
        // Dejamos que el useEffect de arriba detecte el cambio de 'user' y redirija.
        // Esto evita que el ProtectedRoute nos bloquee por race conditions.
      }
    } catch (error) {
      console.error("Error en el flujo de entrada:", error);
      alert("Hubo un error al conectar. Por favor intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="main-content animate-fade-in" style={styles.container}>
      {/* HEADER HERO */}
      <header style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.badge}>Portal de Aliados</span>
          <h1 style={styles.title}>
            Tu red inmobiliaria,<br />
            <span style={{color: 'var(--primary-color)'}}>basada en resultados.</span>
          </h1>
          <p style={styles.subtitle}>
            Olvídate de pagar por publicidad sin garantía. En Inmueble Advisor, 
            te conectamos con clientes pre-calificados listos para comprar.
          </p>

          <button 
            onClick={handleComenzar} 
            disabled={isProcessing} 
            style={{
              ...styles.ctaButton, 
              opacity: isProcessing ? 0.7 : 1,
              cursor: isProcessing ? 'wait' : 'pointer'
            }}
          >
            {isProcessing ? 'Conectando...' : 'Comenzar Registro Gratuito'}
          </button>
          
          <p style={styles.microCopy}>*Sin tarjetas de crédito. Registro en 2 minutos.</p>
        </div>
      </header>

      {/* SECCIÓN DE BENEFICIOS */}
      <section style={styles.benefitsSection}>
        <BenefitCard emoji="🚀" title="Leads Calificados" desc="Olvídate de 'sólo estoy viendo'. Recibe clientes con perfil financiero validado." />
        <BenefitCard emoji="🤝" title="Cero Riesgo" desc="No cobramos mensualidad. Solo ganamos una comisión si tú cierras la venta." />
        <BenefitCard emoji="⭐" title="Meritocracia" desc="Tu posición en el buscador depende de tus reseñas y velocidad, no de cuánto pagues." />
      </section>
    </div>
  );
}

const BenefitCard = ({ emoji, title, desc }) => (
  <div style={styles.card}>
    <div style={{fontSize: '2.5rem', marginBottom: '15px'}}>{emoji}</div>
    <h3 style={{margin: '0 0 10px 0', color: '#111'}}>{title}</h3>
    <p style={{margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: '1.5'}}>{desc}</p>
  </div>
);

const styles = {
  container: { paddingBottom: '50px' },
  heroSection: { textAlign: 'center', padding: '60px 20px 40px', backgroundColor: 'white' },
  heroContent: { maxWidth: '800px', margin: '0 auto' },
  badge: { backgroundColor: '#eff6ff', color: 'var(--primary-color)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '20px' },
  title: { fontSize: '2.5rem', color: '#111827', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px' },
  subtitle: { fontSize: '1.2rem', color: '#4b5563', lineHeight: '1.6', marginBottom: '40px' },
  ctaButton: { backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '18px 32px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '50px', boxShadow: '0 8px 20px rgba(0,57,106,0.3)', transition: 'transform 0.2s' },
  microCopy: { marginTop: '15px', fontSize: '0.85rem', color: '#9ca3af' },
  benefitsSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', textAlign: 'center' }
};