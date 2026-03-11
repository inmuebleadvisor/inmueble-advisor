// src/layouts/MainLayout.jsx
// AUDIO: Refactored to use centralized ThemeContext assets and new Navbar component
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import WhatsAppButton from '../components/common/WhatsAppButton/WhatsAppButton';
import Navbar from '../components/layout/Navbar';

export default function Layout() {
  const { userProfile } = useUser();
  const location = useLocation();

  // Define si el usuario es un asesor O ADMIN
  // Keeping this check only if needed for footer logic below
  const isAsesor = userProfile?.role === 'asesor' || userProfile?.role === 'admin';

  // Detectar si estamos en el panel de administración
  const isAdminPanel = location.pathname.startsWith('/administrador');

  return (
    <div className="layout">

      {/* --- HEADER / NAVBAR --- */}
      <Navbar />

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className={`main-content ${isAdminPanel || location.pathname === '/' ? 'main-content--full' : ''}`}>
        <Outlet />
      </main>

      {/* --- FOOTER --- */}
      {true && (
        <>
          <footer className="footer">
            <div className="footer__links">
              <span className="footer__link">Términos y Condiciones</span>
              <span className="footer__separator">|</span>
              <span className="footer__link">Aviso de Privacidad</span>
              <span className="footer__separator">|</span>

              {/* Enlace de Asesor en footer dual - Keeping logic for footer but nav links removed */}
              <span className="footer__link">Inmueble Advisor</span>
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
