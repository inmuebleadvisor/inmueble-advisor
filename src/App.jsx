// src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
// ✅ IMPORTACIÓN: Nuevo contexto para la data de catálogo
import { CatalogProvider } from './context/CatalogContext'; 

// --- SEGURIDAD ---
import ProtectedRoute from './components/ProtectedRoute';

// --- LAYOUT PRINCIPAL ---
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

function App() {
  // PORQUÉ: Anidar CatalogProvider dentro de UserProvider asegura que 
  // cualquier lógica que use el catálogo tenga acceso al perfil del usuario.
  return (
    <UserProvider>
      <CatalogProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
            
              {/* 1. RUTA PÚBLICA (Home/Perfil de Cliente) */}
              <Route index element={<Perfil />} />
              
              {/* 2. LANDING PARA CAPTACIÓN DE ASESORES (Pública) */}
              <Route path="soy-asesor" element={<LandingAsesores />} />

              {/* 3. WIZARD DE ONBOARDING (Protegida: Requiere Login, pero NO onboarding previo) */}
              <Route path="onboarding-asesor" element={
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

              {/* 6. RUTAS DE DETALLE (Ahora consumen datos del contexto, ¡más rápido!) */}
              <Route path="modelo/:id" element={<DetalleModelo />} />
              <Route path="desarrollo/:id" element={<DetalleDesarrollo />} />

              {/* 404 - Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
          </Routes>
        </BrowserRouter>
      </CatalogProvider>
    </UserProvider>
  );
}

export default App;