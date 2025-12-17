// src/components/Layout.jsx
// AUDIO: Refactored to use centralized ThemeContext assets
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useFavorites } from '../context/FavoritesContext';
import WhatsAppButton from './common/WhatsAppButton/WhatsAppButton';
import ThemeToggle from './shared/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import SeasonalTheme from './SeasonalTheme';

// --- ICONOS SVG ---
const MenuIcons = {
  Menu: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Layout() {
  const { userProfile, user, logout, selectedCity, updateSelectedCity, loginWithGoogle } = useUser();
  // CONSUME NEW CONTEXT PROPS: currentAssets
  const { currentAssets } = useTheme();
  const { favoritosIds } = useFavorites();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    if (isMenuOpen) setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  // Helper de estilos para enlaces activos
  const getLinkClassName = (path) => {
    const isActive = path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

    return `nav__link ${isActive ? 'nav__link--active' : ''}`;
  };

  // Define si el usuario es un asesor O ADMIN (para ver dashboard ventas)
  const isAsesor = userProfile?.role === 'asesor' || userProfile?.role === 'admin';

  // Detectar si estamos en la Home para ajustar el layout (100dvh, sin scroll)
  const isHome = location.pathname === '/';

  return (
    <div className={`layout ${isHome ? 'layout--viewport-fit' : ''}`}>


      {/* --- HEADER --- */}
      <header className="header">
        <div className="header__content">

          {/* LOGOTIPO */}
          <Link to="/" className="header__logo-link" onClick={() => setIsMenuOpen(false)}>
            <img
              src={currentAssets.logo}
              alt="Inmueble Advisor"
              className="header__logo-img"
            />
          </Link>

          {/* ⭐ BOTÓN CAMBIAR CIUDAD (Movido al Header para visibilidad móvil) */}
          {selectedCity && (
            <button
              onClick={() => {
                updateSelectedCity(null); // Resetea para mostrar modal
                setIsMenuOpen(false);
              }}
              className="nav__btn-city"
            >
              📍 {selectedCity}
            </button>
          )}

          {/* BOTÓN HAMBURGUESA (Móvil) */}
          <button onClick={toggleMenu} className="menu-toggle-btn">
            {isMenuOpen ? <MenuIcons.Close /> : <MenuIcons.Menu />}
          </button>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className={`nav ${isMenuOpen ? 'is-open' : ''}`}>
            {/* 1. CATÁLOGO */}
            <Link to="/catalogo" className={getLinkClassName('/catalogo')}>Catálogo</Link>

            {/* 2. MAPA */}
            <Link to="/mapa" className={getLinkClassName('/mapa')}>Mapa</Link>

            {/* 3. FAVORITOS */}
            <Link
              to="/favoritos"
              className={getLinkClassName('/favoritos')}
            >
              Favoritos
              {favoritosIds.length > 0 && (
                <span className="nav__badge">
                  {favoritosIds.length}
                </span>
              )}
            </Link>

            {/* 4. PERFILADO */}
            <Link to="/onboarding-cliente" className={getLinkClassName('/onboarding-cliente')}>Perfilado</Link>

            {/* 5. OPCIÓN CONDICIONAL: Mis Leads (Asesor) o Soy Asesor (Público/Cliente) */}
            {isAsesor ? (
              <Link
                to="/account-asesor"
                className={getLinkClassName('/account-asesor')}
              >
                Mis Leads
              </Link>
            ) : (
              <Link
                to="/soy-asesor"
                className={getLinkClassName('/soy-asesor')}
              >
                Soy asesor
              </Link>
            )}

            {/* 1. BOTÓN DE SESIÓN (LOGIN / LOGOUT) */}
            {user ? (
              <button
                onClick={logout}
                className="nav__link"
              >
                Cerrar Sesión ({userProfile?.nombre?.split(' ')[0] || 'Usuario'})
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="nav__link"
              >
                Iniciar Sesión
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
      {/* --- SEASONAL THEME (Visible en todas las páginas) --- */}
      <SeasonalTheme />

      {/* --- FOOTER (Oculto en Home si es viewport-fit) --- */}
      {!isHome && (
        <>
          <footer className="footer">
            <div className="footer__links">
              <span className="footer__link">Términos y Condiciones</span>
              <span className="footer__separator">|</span>
              <span className="footer__link">Aviso de Privacidad</span>
              <span className="footer__separator">|</span>

              {/* Enlace de Asesor en footer dual */}
              {isAsesor ? (
                <Link to="/account-asesor" className="footer__link footer__link--highlight">Panel Asesor</Link>
              ) : (
                <Link to="/soy-asesor" className="footer__link footer__link--highlight">Quiero ser Asesor</Link>
              )}
              <span className="footer__separator">|</span>
              <ThemeToggle />
            </div>

            <div className="footer__copy">
              © {new Date().getFullYear()} Inmueble Advisor. Tecnología inmobiliaria inteligente.
            </div>
          </footer>
        </>
      )}

      <WhatsAppButton />

    </div>
  );
}
