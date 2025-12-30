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
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// --- PANTALLAS (SCREENS) ---
import Perfil from './screens/Perfil';
import Catalogo from './screens/Catalogo';
import DetalleModelo from './screens/DetalleModelo';
import DetalleDesarrollo from './screens/DetalleDesarrollo';
import Mapa from './screens/Mapa';
// 🗑️ DELETED: LandingAsesores, OnboardingAsesor, AccountAsesor
// ⭐ NUEVO: Pantalla de Onboarding Cliente (migración UX)
import OnboardingCliente from './screens/OnboardingCliente';
// ⭐ NUEVO: Pantalla de Comparador y Favoritos (implementado en el plan)
import Favoritos from './screens/Favoritos';

// ⭐ HERRAMIENTA ADMIN: Importamos la pantalla de exportación
import AdminDataExport from './screens/AdminDataExport';
// ⭐ NUEVO: Panel de Administrador (Sin link, acceso directo)
// ⭐ NUEVO: Panel de Administrador (Sin link, acceso directo)
import AdminDashboard from './screens/AdminDashboard';
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
                {/* Panel de Administrador Oculto (Protegido) */}
                <Route path="administrador" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

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