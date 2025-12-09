// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * COMPONENTE PROTECTED ROUTE
 * --------------------------
 * Actúa como un filtro de seguridad. Si el usuario cumple las condiciones,
 * renderiza el contenido (children). Si no, lo redirige.
 * 
 * Props:
 * - children: El componente (Pantalla) que queremos proteger.
 * - requireOnboarding: (bool) Si es true, verifica que el usuario haya terminado sus datos.
 */
const ProtectedRoute = ({ children, requireOnboarding = false, requireAdmin = false }) => {
  const { user, userProfile, loadingUser } = useUser();
  const location = useLocation();

  // 1. ESTADO DE CARGA:
  // Si Firebase aún está verificando la sesión, mostramos un mensaje simple
  // para evitar que la app "parpadee" o redirija erróneamente.
  if (loadingUser) {
    return (
      <div style={styles.loadingContainer}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  // 2. VERIFICACIÓN DE LOGIN:
  // Si no hay usuario autenticado, lo mandamos al Inicio.
  // 'replace': Borra el historial para que no pueda volver atrás con el botón "Back".
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. VERIFICACIÓN DE ROL: ADMIN (NUEVO)
  // Si la ruta es exclusiva de Admin y el usuario no lo es.
  if (requireAdmin && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 4. VERIFICACIÓN DE ONBOARDING (Solo para Asesores):
  // Si soy admin, esta regla NO aplica (Super Usuario).
  // Si la ruta requiere onboarding completo (ej. Dashboard) y el usuario
  // tiene el rol de 'asesor' PERO la bandera 'onboardingCompleto' es falsa...
  if (requireOnboarding && userProfile?.role === 'asesor' && !userProfile?.onboardingCompleto) {
    // ... lo forzamos a ir al Wizard de Alta.
    return <Navigate to="/onboarding-asesor" state={{ from: location }} replace />;
  }

  // 4. PASE AUTORIZADO:
  // Si pasa todas las verificaciones, mostramos la pantalla solicitada.
  return children;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
    color: '#666'
  }
};

export default ProtectedRoute;