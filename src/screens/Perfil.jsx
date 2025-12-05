// src/screens/Perfil.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { IMAGES } from '../config/constants';

export default function Perfil() {
  const navigate = useNavigate();
  // Solo necesitamos trackBehavior y loginWithGoogle aquí
  const { loginWithGoogle, trackBehavior } = useUser();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        navigate('/catalogo');
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