import React, { useState, useEffect } from 'react'; // ✅ Importamos useState y useEffect
import { Link, Outlet, useLocation } from 'react-router-dom';

// URL del Logotipo Oficial
const LOGO_URL = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/Logo-InmuebleAdvisor-en-fondo-Azul-e1758163267740.png";

// --- ICONOS PARA EL MENÚ (HAMBURGUESA/CERRAR) ---
const MenuIcons = {
  Menu: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Layout() {
  const location = useLocation();
  // ✅ ESTADO para controlar si el menú móvil está abierto
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  /**
   * Cierra el menú cuando la ruta cambia (si el usuario navega a otra pantalla).
   */
  useEffect(() => {
    // Si la ruta cambió y el menú estaba abierto, lo cerramos
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [location.pathname]); // Se dispara cada vez que la ruta cambia

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  /**
   * Helper para estilos de navegación (Active State)
   */
  const getLinkStyle = (path) => {
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);

    // ✅ NOTA: Añadimos 'display: block' para que ocupe todo el ancho en móvil
    return {
      color: 'white',
      textDecoration: 'none',
      fontWeight: isActive ? '700' : '400',
      borderBottom: isActive ? '3px solid #fbbf24' : '3px solid transparent',
      paddingBottom: '4px',
      opacity: isActive ? 1 : 0.85,
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      display: 'block' 
    };
  };

  return (
    <div style={styles.layoutContainer}>

      {/* --- 1. ENCABEZADO (HEADER) --- */}
      <header style={styles.header}>
        <div style={styles.headerContent}>

          {/* LOGOTIPO */}
          <Link to="/" style={styles.logoContainer} onClick={() => setIsMenuOpen(false)}>
            <img src={LOGO_URL} alt="Inmueble Advisor" style={styles.logoImage} />
          </Link>
          
          {/* BOTÓN DE MENÚ (Visible solo en móvil por CSS) */}
          <button onClick={toggleMenu} className="menu-toggle-btn">
            {isMenuOpen ? <MenuIcons.Close /> : <MenuIcons.Menu />}
          </button>

          {/* MENÚ DE NAVEGACIÓN (Clase dinámica para responsividad) */}
          <nav 
            className={`nav-menu ${isMenuOpen ? 'is-open' : ''}`}
            style={styles.nav}
          >
            {/* Añadimos onClick para cerrar el menú al hacer clic en un enlace */}
            <Link to="/" style={getLinkStyle('/')} onClick={() => setIsMenuOpen(false)}>Inicio</Link>
            <Link to="/catalogo" style={getLinkStyle('/catalogo')} onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
            <Link to="/mapa" style={getLinkStyle('/mapa')} onClick={() => setIsMenuOpen(false)}>Mapa</Link>
            <Link to="/soy-asesor" style={getLinkStyle('/soy-asesor')} onClick={() => setIsMenuOpen(false)}>Asesores</Link>
          </nav>

        </div>
      </header>

      {/* --- 2. CONTENIDO PRINCIPAL --- */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* --- 3. PIE DE PÁGINA (FOOTER) --- */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <span style={styles.footerLink}>Términos y Condiciones</span>
          <span style={styles.footerSeparator}>|</span>
          <span style={styles.footerLink}>Aviso de Privacidad</span>
          <span style={styles.footerSeparator}>|</span>
          <Link to="/soy-asesor" style={styles.footerLinkAnchor}>Soy Asesor</Link>
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
    zIndex: 1010 // Asegura que el logo esté visible sobre el menú overlay
  },
  logoImage: {
    height: '40px',
    width: 'auto',
    objectFit: 'contain'
  },
  nav: {
    // La clase .nav-menu y .is-open manejan la responsividad
  },
  
  // Estilos del Footer
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