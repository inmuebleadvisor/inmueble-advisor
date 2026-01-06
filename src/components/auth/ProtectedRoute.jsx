// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Modal from '../ui/Modal';

// Icono de Google simple para el botón
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.52 12.29C23.52 11.43 23.4414 10.69 23.3 10H12V14.51H18.66C18.4314 15.9386 17.65 17.51 16.03 18.52V21.5H19.79C22.09 19.46 23.52 16.34 23.52 12.29Z" fill="#4285F4" />
    <path d="M12 24C15.24 24 17.9657 22.935 19.97 21.09L16.21 18.17C15.0991 18.9056 13.6391 19.3491 11.9991 19.3491C8.79909 19.3491 6.08909 17.26 5.11909 14.3491H1.40909V17.2191C3.39909 21.1691 7.42909 24 11.9991 24Z" fill="#34A853" />
    <path d="M5.12 14.35C4.85108 13.5658 4.72143 12.7483 4.72143 11.9679C4.72143 11.1874 4.85108 10.3699 5.12 9.58574V6.71574H1.41C0.505672 8.4414 0.0401495 10.3639 0.0401495 12.3087C0.0401495 14.2536 0.505672 16.1761 1.41 17.9017L5.12 14.35Z" fill="#FBBC05" />
    <path d="M12 4.75C14.36 4.75 15.91 5.72 16.81 6.54L20.24 3.11C18.11 1.13 15.24 0 12 0C7.43 0 3.4 2.83 1.41 6.72L5.12 9.59C6.09 6.68 8.79 4.75 12 4.75Z" fill="#EA4335" />
  </svg>
);

/**
 * COMPONENTE PROTECTED ROUTE
 * --------------------------
 * Actúa como un filtro de seguridad. 
 * - Si requireAuth es true y el usuario NO esta logueado: Muestra Modal de Login.
 * - Si requireAdmin es true y NO es admin: Redirige a Home.
 */
const ProtectedRoute = ({ children, requireOnboarding = false, requireAdmin = false, requireAuth = false }) => {
  const { user, userProfile, loadingUser, loginWithGoogle } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado local para el modal de login
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Efecto para abrir el modal si se requiere auth y no hay usuario
  useEffect(() => {
    if (!loadingUser && !user && requireAuth) {
      setLoginModalOpen(true);
    } else {
      setLoginModalOpen(false);
    }
  }, [user, loadingUser, requireAuth]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // El modal se cerrará automágicamente gracias al useEffect cuando 'user' cambie.
    } catch (error) {
      console.error("Login fallido en ProtectedRoute", error);
    }
  };

  const handleCancel = () => {
    // Al cancelar, regresamos al usuario a donde estaba
    navigate(-1);
  };

  // 1. ESTADO DE CARGA:
  if (loadingUser) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div> {/* Spinner CSS global si existe */}
      </div>
    );
  }

  // 2. LOGIC DE "REQUIRE AUTH" (MODAL)
  // Si no hay usuario y se requiere auth, mostramos null (o un placeholder)
  // MIENTRAS el modal flota encima. No queremos renderizar el children protegido aún.
  if (!user && requireAuth) {
    return (
      <>
        <div style={{ minHeight: '60vh' }}></div> {/* Spacer para que no se vea vacío feo */}
        <Modal
          isOpen={loginModalOpen}
          onClose={handleCancel}
          title="Inicia Sesión"
        >
          <div style={styles.modalBody}>
            <div style={styles.iconWrapper}>🔒</div>
            <h3 style={styles.modalTitle}>Acceso Exclusivo</h3>
            <p style={styles.text}>
              Para ver detalles de modelos, desarrollos o guardar tus favoritos,
              necesitas iniciar sesión. Es rápido y seguro.
            </p>
            <button onClick={handleLogin} style={styles.loginBtn}>
              <GoogleIcon />
              Continuar con Google
            </button>
            <button onClick={handleCancel} style={styles.cancelBtn}>
              Regresar
            </button>
          </div>
        </Modal>
      </>
    );
  }

  // 3. VERIFICACIONES ESTRICTAS (REDIRECCIONES)

  // Si requiere Auth pero falló el modal (no debería llegar aquí, pero por seguridad)
  if (!user && requireAuth) return null;

  // Si es una ruta de ADMIN o ONBOARDING (lógica legacy, redirección estricta)
  if (!user && (requireAdmin || requireOnboarding)) {
    return <Navigate to="/" replace />;
  }

  // Si la ruta es exclusiva de Admin y el usuario no lo es.
  if (requireAdmin && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Onboarding incompleto para asesores
  if (requireOnboarding && userProfile?.role === 'asesor' && !userProfile?.onboardingCompleto) {
    return <Navigate to="/onboarding-asesor" state={{ from: location }} replace />;
  }

  // 4. PASE AUTORIZADO:
  return children;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '30px 20px',
  },
  iconWrapper: {
    fontSize: '3rem',
    marginBottom: '20px',
    background: '#f1f5f9',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#1e293b',
    marginBottom: '10px',
    fontWeight: '700'
  },
  text: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '30px',
    lineHeight: '1.6',
    maxWidth: '85%',
  },
  loginBtn: {
    backgroundColor: 'var(--primary-color)', // Usando variable global si existe, sino fallback
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    transition: 'transform 0.1s',
  },
  cancelBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    textDecoration: 'underline'
  }
};

export default ProtectedRoute;
