// src/screens/Perfil.jsx
// ÚLTIMA MODIFICACION: 17/12/2025 - Refactor Buyer First
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import '../../styles/Perfil.css'; // Importamos estilos dedicados

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

  // LÓGICA DE REDIRECCIÓN (Evita FOUC - Flash of Unauthenticated Content)
  // Si el usuario ya está logueado y tiene onboarding, no mostramos NADA de la home,
  // redirigimos inmediatamente.
  if (!loadingUser && user && userProfile?.onboardingCompleto) {
    const origin = location.state?.from?.pathname || '/catalogo';
    return <Navigate to={origin} replace />;
  }

  // Si estamos cargando estado de usuario, mostramos null o spinner
  if (loadingUser) return null;

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
          Encuentra tu <span className="highlight-text">mejor inversión</span>
        </h1>

        <div className="hero-actions">
          {/* CTA 1: Onboarding */}
          <button
            onClick={handleStartOnboarding}
            className="btn-cta-primary"
          >
            Descubre tu monto de compra
          </button>

          {/* CTA 2: Catálogo */}
          <button
            onClick={() => navigate('/catalogo')}
            className="btn-cta-primary"
          >
            Conoce los modelos
          </button>

          {/* CTA 3: Mapa */}
          <button
            onClick={() => navigate('/catalogo', { state: { viewMode: 'map' } })}
            className="btn-cta-primary"
          >
            Navega por el mapa
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
