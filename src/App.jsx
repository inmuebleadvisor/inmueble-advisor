// src/App.jsx

// ÚLTIMA MODIFICACION: 02/12/2025
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- CONTEXTOS GLOBALES ---
import { UserProvider } from './context/UserContext';
// Contexto para la data de catálogo (optimización de lectura)
import { CatalogProvider } from './context/CatalogContext';
// ⭐ NUEVO: Contexto de Favoritos, necesario para la nueva funcionalidad
import { FavoritesProvider } from './context/FavoritesContext';
// ⭐ NUEVO: Configuración Global (Temas Estacionales)

import { UI_OPCIONES } from './config/constants';

// --- SEGURIDAD Y LAYOUT ---
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './layouts/MainLayout';

// --- PANTALLAS (SCREENS) ---
import Perfil from './screens/cliente/Perfil';
import Catalogo from './screens/catalogo/Catalogo';
import DetalleModelo from './screens/catalogo/DetalleModelo';
import DetalleDesarrollo from './screens/catalogo/DetalleDesarrollo';
import Mapa from './screens/catalogo/Mapa';
// 🗑️ DELETED: LandingAsesores, OnboardingAsesor, AccountAsesor
// ⭐ NUEVO: Pantalla de Onboarding Cliente (migración UX)
import OnboardingCliente from './screens/cliente/OnboardingCliente';
// ⭐ NUEVO: Pantalla de Comparador y Favoritos (implementado en el plan)
import Favoritos from './screens/cliente/Favoritos';

// ⭐ HERRAMIENTA ADMIN: Importamos la pantalla de exportación
import AdminDataExport from './screens/admin/AdminDataExport';
// ⭐ NUEVO: Panel de Administrador (Sin link, acceso directo)
// ⭐ NUEVO MODULO DE ADMINISTRADOR
import AdminLayout from './layouts/AdminLayout';
import AdminHome from './screens/admin/AdminHome';
import AdminLeads from './screens/admin/AdminLeads';
import AdminUsers from './screens/admin/AdminUsers';
import AdvisorsDirectory from './screens/admin/AdvisorsDirectory';
// 🗑️ DEPRECATED: import AdminDashboard from './screens/AdminDashboard'; (Removed)

// ⭐ NUEVO: Modal de selección de ciudad
import CitySelectorModal from './components/shared/CitySelectorModal';

function App() {
  // El orden de los Providers es estratégico. FavoritesProvider usa datos de User y Catalog.
  return (
    <UserProvider>

      <CatalogProvider>
        {/* ⭐ AÑADIMOS EL NUEVO PROVEEDOR AQUÍ */}
        <FavoritesProvider>
          {/* ⭐ MODAL DE SELECCIÓN DE CIUDAD (Global) */}
          <CitySelectorModal />

          <BrowserRouter>
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
      </CatalogProvider>

    </UserProvider>
  );
}

export default App;