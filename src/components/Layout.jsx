// src/components/Layout.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // ✅ Importamos contexto

// URL del Logotipo Oficial
const LOGO_URL = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/Logo-InmuebleAdvisor-en-fondo-Azul-e1758163267740.png";

// --- ICONOS SVG ---
const MenuIcons = {
  Menu: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Layout() {
  const { userProfile, user } = useUser(); // ✅ Obtenemos el perfil y el estado de login
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    if (isMenuOpen) setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  // Helper de estilos para enlaces activos
  const getLinkStyle = (path) => {
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);

    return {
      color: 'white',
      textDecoration: 'none',
      fontWeight: isActive ? '700' : '400',
      borderBottom: isActive ? '3px solid #fbbf24' : '3px solid transparent', // Línea dorada activa
      paddingBottom: '4px',
      opacity: isActive ? 1 : 0.85,
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      display: 'block' 
    };
  };
  
  // Define si el usuario es un asesor
  const isAsesor = userProfile?.role === 'asesor';

  return (
    <div style={styles.layoutContainer}>

      {/* --- HEADER --- */}
      <header style={styles.header}>
        <div style={styles.headerContent}>

          {/* LOGOTIPO */}
          <Link to="/" style={styles.logoContainer} onClick={() => setIsMenuOpen(false)}>
            <img src={LOGO_URL} alt="Inmueble Advisor" style={styles.logoImage} />
          </Link>
          
          {/* BOTÓN HAMBURGUESA (Móvil) */}
          <button onClick={toggleMenu} className="menu-toggle-btn">
            {isMenuOpen ? <MenuIcons.Close /> : <MenuIcons.Menu />}
          </button>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav 
            className={`nav-menu ${isMenuOpen ? 'is-open' : ''}`}
            style={styles.nav}
          >
            {/* Tareas de Cliente (Visibles para todos los logueados) */}
            <Link 
              to="/" 
              style={getLinkStyle('/')}
            >
              {isAsesor ? 'Mi Perfil' : 'Inicio'}
            </Link>
            
            <Link to="/catalogo" style={getLinkStyle('/catalogo')}>Catálogo</Link>
            <Link to="/mapa" style={getLinkStyle('/mapa')}>Mapa</Link>
            
            {/* TAREA 2.1: LÓGICA DE NAVEGACIÓN DUAL */}
            {isAsesor ? (
               // Si es ASESOR -> Ve su Dashboard
               <Link 
                 to="/account-asesor" 
                 style={getLinkStyle('/account-asesor')}
               >
                 Panel Asesor
               </Link>
            ) : (
               // Si es CLIENTE o PÚBLICO (No Asesor) -> Ve invitación
               <Link 
                 to={user ? '/onboarding-asesor' : '/soy-asesor'} // Si está logueado va al onboarding, si no al landing
                 style={getLinkStyle(user ? '/onboarding-asesor' : '/soy-asesor')}
               >
                 Soy Asesor
               </Link>
            )}
            
            {/* NOTA: El Asesor ahora tiene acceso directo a / y puede rellenar su perfil financiero. */}
            
          </nav>

        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* --- FOOTER --- */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <span style={styles.footerLink}>Términos y Condiciones</span>
          <span style={styles.footerSeparator}>|</span>
          <span style={styles.footerLink}>Aviso de Privacidad</span>
          <span style={styles.footerSeparator}>|</span>
          
          {/* Enlace de Asesor en footer dual */}
          {isAsesor ? (
            <Link to="/account-asesor" style={styles.footerLinkAnchor}>Panel Asesor</Link>
          ) : (
            <Link to="/soy-asesor" style={styles.footerLinkAnchor}>Quiero ser Asesor</Link>
          )}
        </div>

        <div style={styles.copyText}>
          © {new Date().getFullYear()} Inmueble Advisor. Tecnología inmobiliaria inteligente.
        </div>
      </footer>

    </div>
  );
}

// --- ESTILOS CSS-IN-JS ---
const styles = {
  layoutContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-color)'
  },
  header: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    zIndex: 1010
  },
  logoImage: {
    height: '40px',
    width: 'auto',
    objectFit: 'contain'
  },
  nav: {
    // La clase .nav-menu en index.css maneja el responsive (flex row vs column)
  },
  
  footer: {
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    padding: '30px 20px',
    textAlign: 'center',
    marginTop: 'auto',
    borderTop: '1px solid #374151'
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    fontSize: '0.85rem',
    flexWrap: 'wrap'
  },
  footerLink: {
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  footerLinkAnchor: {
    color: '#9ca3af',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
    fontWeight: 'bold'
  },
  footerSeparator: {
    color: '#4b5563'
  },
  copyText: {
    fontSize: '0.8rem',
    color: '#6b7280'
  }
};