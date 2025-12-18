// src/screens/Perfil.jsx
// ÚLTIMA MODIFICACION: 17/12/2025 - Refactor Buyer First
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/Perfil.css'; // Importamos estilos dedicados

export default function Perfil() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Consumimos contexto
  const { loginWithGoogle, user, userProfile, loadingUser } = useUser();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // EFECTO: Si openLogin viene en URL
  useEffect(() => {
    if (searchParams.get('openLogin') === 'true') {
      setIsLoggingIn(true);
      loginWithGoogle().finally(() => setIsLoggingIn(false));
    }
  }, [searchParams, loginWithGoogle]);

  // EFECTO: Redirección si ya tiene onboarding completo
  useEffect(() => {
    if (!loadingUser && user && userProfile?.onboardingCompleto) {
      const origin = location.state?.from?.pathname || '/catalogo';
      navigate(origin, { replace: true });
    }
  }, [user, userProfile, loadingUser, navigate, location]);

  const handleStartOnboarding = () => {
    // Redirección directa al perfilado de comprador
    navigate('/onboarding-cliente');
  };

  const handleLoginDirecto = async () => {
    setIsLoggingIn(true);
    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        // Redirección manejada por Effect o fallback
        navigate('/catalogo', { replace: true });
      }
    } catch (error) {
      console.error("Login fallido", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="hero-container">
      <div className="hero-content">

        <h1 className="hero-title">
          Inversión <span className="highlight-text">inteligente</span> <span className="desktop-only">para tu futuro</span>
        </h1>

        <p className="hero-subtitle">
          Encuentra la propiedad perfecta <span className="desktop-only">con la mejor asesoría financiera y ubicación estratégica.</span>
        </p>

        <div className="hero-actions">
          {/* CTA Primario: Onboarding */}
          <button
            onClick={handleStartOnboarding}
            className="btn-cta-primary"
          >
            Descubre tu monto de compra
          </button>

          {/* CTA Secundario: Catálogo Directo */}
          <button
            onClick={() => navigate('/catalogo')}
            className="btn-cta-secondary"
          >
            Ver Catálogo
          </button>
        </div>

        <div className="login-link-container">
          <button
            onClick={handleLoginDirecto}
            disabled={isLoggingIn}
            className="btn-text-link"
          >
            {isLoggingIn ? 'Conectando...' : '¿Ya tienes cuenta? Iniciar Sesión'}
          </button>
        </div>

      </div>
    </div>
  );
}
