// src/layouts/MainLayout.jsx
// AUDIO: Refactored to use centralized ThemeContext assets and new Navbar component
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import WhatsAppButton from '../components/common/WhatsAppButton/WhatsAppButton';
import ThemeToggle from '../components/layout/ThemeToggle';
import Navbar from '../components/layout/Navbar';

export default function Layout() {
  const { userProfile } = useUser();
  const location = useLocation();

  // Define si el usuario es un asesor O ADMIN
  // Keeping this check only if needed for footer logic below
  const isAsesor = userProfile?.role === 'asesor' || userProfile?.role === 'admin';

  // Detectar si estamos en rutas que requieren Viewport Fit
  const isViewportFit = location.pathname === '/' || location.pathname === '/onboarding-cliente' || location.pathname === '/mapa';

  // Detectar si estamos en el panel de administración
  const isAdminPanel = location.pathname.startsWith('/administrador');

  return (
    <div className={`layout ${isViewportFit ? 'layout--viewport-fit' : ''}`}>

      {/* --- HEADER / NAVBAR --- */}
      <Navbar />

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className={`main-content ${isAdminPanel ? 'main-content--full' : ''}`}>
        <Outlet />
      </main>

      {/* --- FOOTER (Oculto en rutas Viewport Fit) --- */}
      {!isViewportFit && (
        <>
          <footer className="footer">
            <div className="footer__links">
              <span className="footer__link">Términos y Condiciones</span>
              <span className="footer__separator">|</span>
              <span className="footer__link">Aviso de Privacidad</span>
              <span className="footer__separator">|</span>

              {/* Enlace de Asesor en footer dual - Keeping logic for footer but nav links removed */}
              {isAsesor ? (
                // Note: /account-asesor link might be broken if route removed, but keeping as per careful refactor
                // If route is truly dead, this should be removed too. The prompt said "Busca codigo obsoleto... en el menu principal". 
                // I removed it from Navbar. Leaving here optionally or removing? 
                // Task said "menu principal". I'll keep footer as is mostly but if route is dead...
                // App.jsx comments said "Modelo Deprecado" for "LANDING / ONBOARDING / ACCOUNT ASESORES ELIMINADOS".
                // So I should likely update this to not point to dead routes or just leave simple footer.
                // For safety and strict adherence to "menu principal", I'll leave footer as is or safe pointer.
                // Assuming /account-asesor might still exist in some legacy form or admin form, but App.jsx didn't show it enabled.
                // Actually App.jsx DOES NOT have /account-asesor in Routes! It has /administrador.
                // So this link is BROKEN.
                <span className="footer__link footer__link--highlight">Asesor: {userProfile.nombre}</span>
              ) : (
                // /soy-asesor is also NOT in App.jsx.
                // So broken link.
                <span className="footer__link">Inmueble Advisor</span>
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
