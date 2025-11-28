import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// URL del Logotipo Oficial
const LOGO_URL = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/Logo-InmuebleAdvisor-en-fondo-Azul-e1758163267740.png";

export default function Layout() {
  // Hook para saber en qué URL estamos actualmente (ej: "/mapa")
  const location = useLocation();

  /**
   * Helper para estilos de navegación (Active State)
   * Devuelve estilos diferentes si el link coincide con la ruta actual.
   */
  const getLinkStyle = (path) => {
    // Verificamos si la ruta actual empieza con el path del link
    // Para el home ('/') la coincidencia debe ser exacta
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);

    return {
      color: 'white',
      textDecoration: 'none',
      fontWeight: isActive ? '700' : '400', // Negrita si está activo
      borderBottom: isActive ? '3px solid #fbbf24' : '3px solid transparent', // Línea amarilla
      paddingBottom: '4px',
      opacity: isActive ? 1 : 0.85, // Un poco transparente si no está activo
      fontSize: '0.95rem',
      transition: 'all 0.2s ease'
    };
  };

  return (
    <div style={styles.layoutContainer}>

      {/* --- 1. ENCABEZADO (HEADER) --- */}
      <header style={styles.header}>
        <div style={styles.headerContent}>

          {/* LOGOTIPO (Clic para ir al inicio) */}
          <Link to="/" style={styles.logoContainer}>
            <img src={LOGO_URL} alt="Inmueble Advisor" style={styles.logoImage} />
          </Link>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav style={styles.nav}>
            <Link to="/" style={getLinkStyle('/')}>Perfil</Link>
            <Link to="/catalogo" style={getLinkStyle('/catalogo')}>Catálogo</Link>
            <Link to="/mapa" style={getLinkStyle('/mapa')}>Mapa</Link>
            
            {/* ✅ NUEVO: Enlace al Portal de Asesores */}
            <Link to="/soy-asesor" style={getLinkStyle('/soy-asesor')}>Asesores</Link>
          </nav>

        </div>
      </header>

      {/* --- 2. CONTENIDO PRINCIPAL --- */}
      {/* 
          Outlet es el "hueco" donde se renderizan las pantallas hijas 
          (Catalogo, Mapa, Detalle, LandingAsesores, etc.) según la ruta.
          La clase "main-content" viene de index.css y maneja los márgenes responsivos.
      */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* --- 3. PIE DE PÁGINA (FOOTER) --- */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          {/* Enlaces legales (Placeholders) */}
          <span style={styles.footerLink}>Términos y Condiciones</span>
          <span style={styles.footerSeparator}>|</span>
          <span style={styles.footerLink}>Aviso de Privacidad</span>
          <span style={styles.footerSeparator}>|</span>
          
          {/* ✅ NUEVO: Enlace en el Footer también */}
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
    minHeight: '100vh', // Asegura que ocupe al menos toda la pantalla
    backgroundColor: 'var(--bg-color)' // Usa la variable global
  },
  header: {
    backgroundColor: 'var(--primary-color)', // Azul corporativo
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Sombra suave para dar profundidad
    position: 'sticky', // Hace que el menú se quede fijo arriba al scrollear
    top: 0,
    zIndex: 1000, // Siempre por encima de todo
  },
  headerContent: {
    maxWidth: '1200px', // Ancho máximo para pantallas grandes
    margin: '0 auto',
    padding: '0 20px',
    height: '60px', // Altura fija del header
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  logoImage: {
    height: '40px', // Tamaño controlado del logo
    width: 'auto',
    objectFit: 'contain'
  },
  nav: {
    display: 'flex',
    gap: '20px', // Espacio entre enlaces
  },
  
  // Estilos del Footer
  footer: {
    backgroundColor: '#1f2937', // Gris muy oscuro (casi negro)
    color: '#9ca3af', // Gris claro para texto
    padding: '30px 20px',
    textAlign: 'center',
    marginTop: 'auto', // Empuja el footer al fondo si hay poco contenido
    borderTop: '1px solid #374151'
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    fontSize: '0.85rem',
    flexWrap: 'wrap' // Para móviles
  },
  footerLink: {
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  // Estilo específico para links de React Router dentro del footer
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