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

// --- SEGURIDAD Y LAYOUT ---
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// --- PANTALLAS (SCREENS) ---
import Perfil from './screens/Perfil';
import Catalogo from './screens/Catalogo';
import DetalleModelo from './screens/DetalleModelo';
import DetalleDesarrollo from './screens/DetalleDesarrollo';
import Mapa from './screens/Mapa';
import LandingAsesores from './screens/LandingAsesores';
import OnboardingAsesor from './screens/OnboardingAsesor';
import AccountAsesor from './screens/AccountAsessor';
// ⭐ NUEVO: Pantalla de Comparador y Favoritos (implementado en el plan)
import Comparador from './screens/Comparador'; 

// ⭐ HERRAMIENTA ADMIN: Importamos la pantalla de exportación
import AdminDataExport from './screens/AdminDataExport';

function App() {
  // El orden de los Providers es estratégico. FavoritesProvider usa datos de User y Catalog.
  return (
    <UserProvider>
      <CatalogProvider>
        {/* ⭐ AÑADIMOS EL NUEVO PROVEEDOR AQUÍ */}
        <FavoritesProvider> 
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
              
                {/* 1. RUTA PÚBLICA (Home/Perfil de Cliente) */}
                <Route index element={<Perfil />} />
                
                {/* 2. LANDING PARA CAPTACIÓN DE ASESORES (Pública) */}
                <Route path="soy-asesor" element={<LandingAsesores />} />

                {/* 3. WIZARD DE ONBOARDING (Protegida: Requiere Login, pero NO onboarding previo) */}
                <Route path="onboarding-asesor" element={
                  // Sintaxis corregida: ProtectedRoute envuelve el componente
                  <ProtectedRoute requireOnboarding={false}>
                    <OnboardingAsesor />
                  </ProtectedRoute>
                } />

                {/* 4. DASHBOARD EXCLUSIVO DE ASESORES (Protegida + Onboarding Completo) */}
                <Route path="account-asesor" element={
                  <ProtectedRoute requireOnboarding={true}>
                    <AccountAsesor />
                  </ProtectedRoute>
                } />

                {/* 5. RUTAS DEL SISTEMA (Protegidas) */}
                
                <Route path="catalogo" element={
                  <ProtectedRoute requireOnboarding={true}>
                    <Catalogo />
                  </ProtectedRoute>
                } />
                
                <Route path="mapa" element={
                  <ProtectedRoute requireOnboarding={true}>
                    <Mapa />
                  </ProtectedRoute>
                } />

                {/* ⭐ NUEVA RUTA: Ruta para la pantalla de Comparador y Favoritos */}
                <Route path="favoritos" element={<Comparador />} /> 

                {/* 6. RUTAS DE DETALLE */}
                <Route path="modelo/:id" element={<DetalleModelo />} />
                <Route path="desarrollo/:id" element={<DetalleDesarrollo />} />

                {/* 7. HERRAMIENTAS ADMINISTRATIVAS (Uso interno) */}
                {/* Accede manualmente escribiendo /admin-export-tool en la URL */}
                <Route path="admin-export-tool" element={<AdminDataExport />} />

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