import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
// Assuming CitySelectorModal manages its own visibility via global state or similar, 
// strictly based on MainLayout it was modifying selectedCity in UserContext to null to show modal.
// We need to replicate that logic.

// --- ICONOS SVG ---
const MenuIcons = {
    Menu: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    Close: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

const Navbar = () => {
    const { userProfile, user, logout, selectedCity, updateSelectedCity, loginWithGoogle } = useUser();
    const { currentAssets } = useTheme();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Cierra el menú móvil al cambiar de ruta
    useEffect(() => {
        if (isMenuOpen) setIsMenuOpen(false);
    }, [location.pathname]);

    const toggleMenu = () => setIsMenuOpen(prev => !prev);

    // Helper de estilos para enlaces activos - BEM naming
    const getLinkClassName = (path) => {
        const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

        return `navbar__link ${isActive ? 'navbar__link--active' : ''}`;
    };

    // Define si el usuario es un asesor O ADMIN
    // NOTE: Logic for "Mis Leads" and "Soy asesor" removed as per request to remove obsolete/broken code.
    // Keeping specific checks if needed strictly for layout, but links are gone.

    return (
        <header className="navbar">
            <div className="navbar__content">

                {/* LOGOTIPO */}
                <Link to="/" className="navbar__logo-link" onClick={() => setIsMenuOpen(false)}>
                    <img
                        src={currentAssets.logo}
                        alt="Inmueble Advisor"
                        className="navbar__logo-img"
                        width="180"
                        height="48"
                        fetchPriority="high"
                    />
                </Link>

                {/* CONTROLS GROUP (City + Mobile Toggle) */}
                <div className="navbar__controls">
                    {/* BOTÓN CAMBIAR CIUDAD */}
                    {selectedCity && (
                        <button
                            onClick={() => {
                                updateSelectedCity(null);
                                setIsMenuOpen(false);
                            }}
                            className="navbar__btn-city"
                            aria-label="Cambiar ciudad seleccionada"
                        >
                            📍 {selectedCity}
                        </button>
                    )}

                    {/* BOTÓN HAMBURGUESA (Móvil) */}
                    <button
                        onClick={toggleMenu}
                        className="navbar__toggle-btn"
                        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <MenuIcons.Close /> : <MenuIcons.Menu />}
                    </button>
                </div>

                {/* MENÚ DE NAVEGACIÓN */}
                <nav className={`navbar__menu ${isMenuOpen ? 'navbar__menu--open' : ''}`}>
                    {/* 1. CATÁLOGO */}
                    <Link to="/catalogo" className={getLinkClassName('/catalogo')}>Catálogo</Link>

                    {/* 2. MAPA */}
                    <Link to="/mapa" className={getLinkClassName('/mapa')}>Mapa</Link>

                    {/* 3. FAVORITOS */}
                    <Link to="/favoritos" className={getLinkClassName('/favoritos')}>Favoritos</Link>

                    {/* 4. ACTIONS (Login/Logout) */}
                    <div className="navbar__actions">
                        {user ? (
                            <button
                                onClick={logout}
                                className="navbar__link navbar__link--logout"
                            >
                                Cerrar Sesión ({userProfile?.nombre?.split(' ')[0] || 'Usuario'})
                            </button>
                        ) : (
                            <button
                                onClick={loginWithGoogle}
                                className="navbar__link navbar__link--login"
                            >
                                Iniciar Sesión
                            </button>
                        )}
                    </div>
                </nav>

            </div>
        </header>
    );
};

export default Navbar;
