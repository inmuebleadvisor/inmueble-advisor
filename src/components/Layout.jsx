// src/components/Layout.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
// ✅ Importamos contexto y la función logout
import { useUser } from '../context/UserContext'; 
// Importamos el hook de Favoritos para el contador
import { useFavorites } from '../context/FavoritesContext'; 

// URL del Logotipo Oficial
const LOGO_URL = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/Logo-InmuebleAdvisor-en-fondo-Azul-e1758163267740.png";

// --- ICONOS SVG ---
const MenuIcons = {
  Menu: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Layout() {
  // ✅ Obtenemos logout, userProfile y user
  const { userProfile, user, logout } = useUser(); 
  // Obtenemos el ID de favoritos (para el badge en el paso anterior)
  const { favoritosIds } = useFavorites(); 
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
            
            <Link 
              to="/favoritos" 
              style={getLinkStyle('/favoritos')}
            >
              <span style={styles.linkWithBadge}>
                 Comparador
                 {favoritosIds.length > 0 && (
                   <span style={styles.favoriteBadge}>
                      {favoritosIds.length}
                   </span>
                 )}
              </span>
            </Link>
            
            {isAsesor ? (
               // DASHBOARD ASESOR
               <Link 
                 to="/account-asesor" 
                 style={getLinkStyle('/account-asesor')}
               >
                 Panel Asesor
               </Link>
            ) : (
               // ENLACE ASESOR/ONBOARDING
               <Link 
                 to={user ? '/onboarding-asesor' : '/soy-asesor'} 
                 style={getLinkStyle(user ? '/onboarding-asesor' : '/soy-asesor')}
               >
                 Soy Asesor
               </Link>
            )}

            {/* ⭐ NUEVO: BOTÓN DE LOGOUT CONDICIONAL */}
            {user && (
                <button 
                    onClick={logout} 
                    style={styles.logoutButton}
                >
                    Cerrar Sesión ({userProfile?.nombre?.split(' ')[0] || 'Usuario'})
                </button>
            )}
            
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
  
  // ⭐ NUEVO ESTILO: Botón de Cerrar Sesión (Se ve como un enlace en el menú)
  logoutButton: {
    background: 'none',
    border: 'none',
    color: '#ffc107', // Color dorado/amarillo para destacar
    padding: '4px 0',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'opacity 0.2s',
    // Asegura que en móvil tenga el mismo estilo que los Links
    '@media (max-width: 768px)': {
        fontSize: '1.5rem',
        padding: '15px 0',
        width: '80%', 
        borderBottom: '3px solid transparent',
        textDecoration: 'none',
        display: 'block'
    }
  },
  
  linkWithBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  favoriteBadge: {
    backgroundColor: '#fbbf24', // Amarillo dorado
    color: 'var(--primary-color)',
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '10px',
    lineHeight: 1,
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