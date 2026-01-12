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
import { metaService } from './services/serviceProvider';
import { AnalyticsService } from './services/eventLogger.service';
import { useEffect } from 'react';

// --- SEGURIDAD Y LAYOUT ---
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './layouts/MainLayout';

// Screens - Cliente
import Perfil from './screens/cliente/Perfil';
import OnboardingCliente from './screens/cliente/OnboardingCliente';
import Favoritos from './screens/cliente/Favoritos';

// Screens - Catalogo
import Catalogo from './screens/catalogo/Catalogo';
import Mapa from './screens/catalogo/Mapa';
import DetalleModelo from './screens/catalogo/DetalleModelo';
import DetalleDesarrollo from './screens/catalogo/DetalleDesarrollo';

// Screens - Admin
import AdminDataExport from './screens/admin/AdminDataExport';
import AdminHome from './screens/admin/AdminHome';
import AdminLeads from './screens/admin/AdminLeads';
import AdminUsers from './screens/admin/AdminUsers';
import AdvisorsDirectory from './screens/admin/AdvisorsDirectory';

// Layouts & Modals
import AdminLayout from './layouts/AdminLayout';
import CitySelectorModal from './components/modals/CitySelectorModal';

const META_PIXEL_ID = "25721482294159393";

// ⭐ NUEVO: Tracker Unificado de Meta
import MetaTracker from './components/common/MetaTracker';

function App() {
  // Inicializar Meta Pixel (Solo configuración base, el tracker maneja los eventos)
  useEffect(() => {
    metaService.init(META_PIXEL_ID);
  }, []);

  // El orden de los Providers es estratégico. FavoritesProvider usa datos de User y Catalog.
  return (
    <PostHogProvider client={posthog}>
      <UserProvider>

        <CatalogProvider>
          <ServiceProvider>
            {/* ⭐ AÑADIMOS EL NUEVO PROVEEDOR AQUÍ */}
            <FavoritesProvider>
              {/* ⭐ MODAL DE SELECCIÓN DE CIUDAD (Global) */}
              <CitySelectorModal />

              <BrowserRouter>
                <MetaTracker /> {/* ✅ Rastreo Unificado de PageView */}
                <AnalyticsTracker />
                <Routes>
                  <Route path="/" element={<Layout />}>

                    {/* 1. RUTA PÚBLICA (Home/Perfil de Cliente) */}
                    <Route index element={<Perfil />} />
                    <Route path="onboarding-cliente" element={<OnboardingCliente />} />

                    {/* 2. LANDING / ONBOARDING / ACCOUNT ASESORES ELIMINADOS (Modelo Deprecado) */}

                    {/* 5. RUTAS DEL SISTEMA (Protegidas) */}

                    <Route path="catalogo" element={<Catalogo />} />

                    <Route path="mapa" element={<Mapa />} />

                    {/* ⭐ NUEVA RUTA: Ruta para la pantalla de Comparador y Favoritos */}
                    <Route path="favoritos" element={
                      <ProtectedRoute requireAuth={UI_OPCIONES.REQUIRE_AUTH_FOR_DETAILS}>
                        <Favoritos />
                      </ProtectedRoute>
                    } />

                    {/* 6. RUTAS DE DETALLE */}
                    <Route path="modelo/:id" element={
                      <ProtectedRoute requireAuth={UI_OPCIONES.REQUIRE_AUTH_FOR_DETAILS}>
                        <DetalleModelo />
                      </ProtectedRoute>
                    } />
                    <Route path="desarrollo/:id" element={
                      <ProtectedRoute requireAuth={UI_OPCIONES.REQUIRE_AUTH_FOR_DETAILS}>
                        <DetalleDesarrollo />
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
              </BrowserRouter>
            </FavoritesProvider> {/* ⭐ CERRAMOS EL NUEVO PROVEEDOR */}
          </ServiceProvider>
        </CatalogProvider>

      </UserProvider>
    </PostHogProvider >
  );
}

// ⭐ NUEVO: Componente interno para rastrear navegación
// Debe estar DENTRO de BrowserRouter para usar useLocation


function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useUser();

  // 1. Iniciar sesión al montar (y cuando el user cambia, p.ej. login)
  useEffect(() => {
    AnalyticsService.startSession(user, location.pathname);

    return () => {
      AnalyticsService.endSession();
    };
  }, [user]); // Reinicia sesión si cambia el usuario

  // 2. Rastrear cambios de ruta
  useEffect(() => {
    AnalyticsService.trackPageView(location.pathname);
  }, [location]);

  return null;
}

export default App;