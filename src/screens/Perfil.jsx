// src/screens/Perfil.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { IMAGES } from '../config/constants';

export default function Perfil() {
  const navigate = useNavigate();
  const location = useLocation(); // Recuperamos el estado de navegación (para redirects)
  const [searchParams] = useSearchParams(); // Para leer ?openLogin=true

  // Solo necesitamos trackBehavior y loginWithGoogle aquí, pero ahora también user data para redirección
  const { loginWithGoogle, trackBehavior, user, userProfile, loadingUser } = useUser();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // EFECTO: Si la URL trae ?openLogin=true (ej. rebote de ProtectedRoute), activamos la UI de logueo
  useEffect(() => {
    if (searchParams.get('openLogin') === 'true') {
      // Podríamos hacer scroll o focus, pero por ahora user initiation es mejor. 
      // Si queremos simular que ya le dio click:
      // (Opcional, depende de UX. Por ahora solo dejamos que el usuario lo vea)
      // Pero para ser más amables, podríamos poner un toast o mensaje.
      setIsLoggingIn(false); // Mantener cerrado o abrir automáticamente?
      // El requerimiento dice "invitarlos a loguearse".
      // Vamos a hacer scroll hacia el botón de login para que lo vean.
      const loginBtn = document.getElementById('btn-login-action');
      if (loginBtn) loginBtn.scrollIntoView({ behavior: 'smooth' });
      // O mejor, un alert o estado que muestre el form directamente si tuvieramos un form visible.
    }
  }, [searchParams]);

  // EFECTO: Redirección automática si ya tiene onboarding completo
  useEffect(() => {
    if (!loadingUser && user && userProfile?.onboardingCompleto) {
      // 1. Prioridad: ¿Venía de alguna ruta protegida?
      const origin = location.state?.from?.pathname || '/catalogo';
      navigate(origin, { replace: true });
    }
  }, [user, userProfile, loadingUser, navigate, location]);

  const handleRoleSelection = (role) => {
    trackBehavior('select_role', { role });
    if (role === 'asesor') {
      navigate('/soy-asesor');
    } else {
      // Redirección al nuevo Onboarding de Cliente
      navigate('/onboarding-cliente');
    }
  };

  const handleLoginDirecto = async () => {
    setIsLoggingIn(true);
    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        const firebaseUser = await loginWithGoogle();
        if (firebaseUser) {
          // La redirección la maneja el useEffect de arriba cuando detecta auth change
          // Pero para feedback inmediato si el effect tarda:
          const origin = location.state?.from?.pathname || '/catalogo';
          navigate(origin, { replace: true });
        }
      }
    } catch (error) {
      console.error("Login directo fallido", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .step-content { animation: slideIn 0.4s ease-out forwards; width: 100%; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src={IMAGES.LOGO_URL} alt="Logo" style={styles.logoIcon} />
        </div>

        <div className="step-content">
          <h1 style={styles.title}>Bienvenido</h1>
          <p style={styles.subtitle}>Selecciona tu perfil para comenzar:</p>
          <div style={styles.roleGrid}>
            <button onClick={() => handleRoleSelection('comprador')} style={styles.roleCard}>
              <div style={styles.roleIcon}>🏠</div>
              <h3 style={styles.roleTitle}>Busco mi Hogar</h3>
              <p style={styles.roleDesc}>Quiero ver opciones a mi alcance.</p>
            </button>
            <button onClick={() => handleRoleSelection('asesor')} style={{ ...styles.roleCard, border: '2px solid #e2e8f0' }}>
              <div style={styles.roleIcon}>💼</div>
              <h3 style={styles.roleTitle}>Soy Asesor</h3>
              <p style={styles.roleDesc}>Quiero subir propiedades y captar clientes.</p>
            </button>
          </div>

          <div style={{ marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button
              id="btn-login-action" // ID para scroll
              onClick={handleLoginDirecto}
              disabled={isLoggingIn}
              style={styles.textLinkButton}
            >
              {isLoggingIn ? 'Conectando...' : '¿Ya tienes cuenta? Iniciar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', width: '100%', padding: '20px', boxSizing: 'border-box' },
  card: { backgroundColor: 'white', padding: '40px 30px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, // Adjusted justifyContent
  logoContainer: { marginBottom: '20px' },
  logoIcon: { width: '50px', height: 'auto' },
  title: { color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800' },
  subtitle: { color: '#666', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' },
  roleGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roleCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#fff', border: '2px solid var(--primary-color)', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', textAlign: 'center' },
  roleIcon: { fontSize: '2.5rem', marginBottom: '10px' },
  roleTitle: { margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' },
  roleDesc: { margin: 0, fontSize: '0.9rem', color: '#666' },
  textLinkButton: { background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }
};