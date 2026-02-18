// src/App.jsx

// ÚLTIMA MODIFICACION: 02/12/2025
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// --- CONTEXTOS GLOBALES ---
import { UserProvider, useUser } from './context/UserContext';
// Contexto para la data de catálogo (optimización de lectura)
import { CatalogProvider } from './context/CatalogContext';
// ⭐ NUEVO: Contexto de Favoritos, necesario para la nueva funcionalidad
import { FavoritesProvider } from './context/FavoritesContext';
// ⭐ NUEVO: Contexto de Servicios (DI)
import { ServiceProvider } from './context/ServiceContext';
// ⭐ NUEVO: Configuración Global (Temas Estacionales)

import { UI_OPCIONES } from './config/constants';
import { PostHogProvider } from 'posthog-js/react'
import posthog from './config/posthog';
import { metaService } from './services/service.provider';
// import { AnalyticsService } from './services/eventLogger.service'; // REMOVED LEGACY
import { useService } from './hooks/useService'; // Import useService
import { useEffect } from 'react';

// --- SEGURIDAD Y LAYOUT ---
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './layouts/MainLayout';
import './styles/components/Spinner.css';

// Screens - Cliente (Home is Eager Loaded for LCP)
import Home from './screens/cliente/Home';
import Perfil from './screens/cliente/Perfil';

const Favoritos = React.lazy(() => import('./screens/cliente/Favoritos'));

// Screens - Catalogo (Lazy Loaded)
const Catalogo = React.lazy(() => import('./screens/catalogo/Catalogo'));
// Mapa screen removed - Integrated into Catalogo
const DetalleModelo = React.lazy(() => import('./screens/catalogo/DetalleModelo'));
const DetalleDesarrollo = React.lazy(() => import('./screens/catalogo/DetalleDesarrollo'));

// Screens - Admin (Lazy Loaded)
const AdminDataExport = React.lazy(() => import('./screens/admin/AdminDataExport'));
const AdminHome = React.lazy(() => import('./screens/admin/AdminHome'));
const AdminLeads = React.lazy(() => import('./screens/admin/AdminLeads'));
const AdminUsers = React.lazy(() => import('./screens/admin/AdminUsers'));
const AdvisorsDirectory = React.lazy(() => import('./screens/admin/AdvisorsDirectory'));

// Layouts & Modals
import AdminLayout from './layouts/AdminLayout';
import CitySelectorModal from './components/modals/CitySelectorModal';
import RouteRemounter from './components/layout/RouteRemounter'; // ✅ Force Remount Wrapper



// ⭐ NUEVO: Tracker Unificado de Meta
import MetaTracker from './components/common/MetaTracker';
import ScrollToTop from './components/common/ScrollToTop'; // ✅ Scroll Restoration Logic
import { META_CONFIG } from './config/constants';

function App() {
  // Inicializar Meta Pixel (Solo configuración base, el tracker maneja los eventos)
  // Aunque MetaTracker ya lo hace, mantenerlo aquí asegura que esté listo para otros eventos si MetaTracker no montó aún.
  useEffect(() => {
    metaService.init(META_CONFIG.PIXEL_ID);
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <ServiceProvider>
        <UserProvider>
          <CatalogProvider>
            {/* ⭐ AÑADIMOS EL NUEVO PROVEEDOR AQUÍ */}
            <FavoritesProvider>
              {/* ⭐ MODAL DE SELECCIÓN DE CIUDAD (Global) */}
              <CitySelectorModal />

              <BrowserRouter>
                <ScrollToTop /> {/* ✅ Reset Scroll Restoration */}
                <MetaTracker /> {/* ✅ Rastreo Unificado de PageView */}
                <AnalyticsTracker />
                <Suspense fallback={
                  <div className="spinner-container">
                    <div className="spinner" />
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Layout />}>

                      {/* 1. RUTA PÚBLICA (Home) */}
                      <Route index element={<Home />} />

                      {/* 2. PERFIL DE USUARIO (Antes era Index) */}
                      <Route path="perfil" element={
                        <ProtectedRoute requireAuth={true}>
                          <Perfil />
                        </ProtectedRoute>
                      } />



                      {/* 3. RUTAS DEL SISTEMA (Protegidas) */}

                      <Route path="catalogo" element={<Catalogo />} />

                      {/* Redirect legacy map route to unified catalog view */}
                      <Route path="mapa" element={<Navigate to="/catalogo" replace />} />

                      {/* ⭐ NUEVA RUTA: Ruta para la pantalla de Comparador y Favoritos */}
                      <Route path="favoritos" element={
                        <ProtectedRoute requireAuth={true}>
                          <Favoritos />
                        </ProtectedRoute>
                      } />

                      {/* 6. RUTAS DE DETALLE */}
                      <Route path="modelo/:id" element={
                        <ProtectedRoute requireAuth={UI_OPCIONES.REQUIRE_AUTH_FOR_DETAILS}>
                          <RouteRemounter>
                            <DetalleModelo />
                          </RouteRemounter>
                        </ProtectedRoute>
                      } />
                      <Route path="desarrollo/:id" element={
                        <ProtectedRoute requireAuth={UI_OPCIONES.REQUIRE_AUTH_FOR_DETAILS}>
                          <RouteRemounter>
                            <DetalleDesarrollo />
                          </RouteRemounter>
                        </ProtectedRoute>
                      } />

                      {/* 7. HERRAMIENTAS ADMINISTRATIVAS (Uso interno) */}
                      {/* Accede manualmente escribiendo /admin-export-tool en la URL */}
                      <Route path="admin-export-tool" element={<AdminDataExport />} />

                      {/* ✅ NUEVO SISTEMA DE ADMINISTRACIÓN (Layout Anidado) */}
                      <Route path="administrador" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<AdminHome />} />
                        <Route path="leads" element={<AdminLeads />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="asesores" element={<AdvisorsDirectory />} />
                      </Route>

                      {/* 404 - Redirección por defecto */}
                      <Route path="*" element={<Navigate to="/" replace />} />

                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </FavoritesProvider> {/* ⭐ CERRAMOS EL NUEVO PROVEEDOR */}
          </CatalogProvider>
        </UserProvider>
      </ServiceProvider>
    </PostHogProvider >
  );
}

// ⭐ NUEVO: Componente interno para rastrear navegación
// Debe estar DENTRO de BrowserRouter para usar useLocation


function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useUser();
  const { analytics } = useService(); // Use new service

  // 1. Iniciar sesión al montar (y cuando el user cambia, p.ej. login)
  useEffect(() => {
    // AnalyticsService from DI
    analytics.startTracking({
      uid: user?.uid || 'ANONYMOUS',
      path: location.pathname,
      userAgent: navigator.userAgent
    });
    // End session is handled by stopTracking or let it be.
    // analytics.service.js assumes single session id in memory/storage.
  }, [user, analytics, location.pathname]);

  // 2. Rastrear cambios de ruta
  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location, analytics]);

  return null;
}

export default App;