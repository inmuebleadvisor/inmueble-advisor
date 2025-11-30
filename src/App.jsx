// src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';

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
import AccountAsesor from './screens/AccountAsessor'; // ✅ NUEVA PANTALLA IMPORTADA

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
          
            {/* 1. RUTA PÚBLICA (Home/Perfil de Cliente) */}
            <Route index element={<Perfil />} />
            
            {/* 2. LANDING PARA CAPTACIÓN DE ASESORES (Pública) */}
            <Route path="soy-asesor" element={<LandingAsesores />} />

            {/* 3. WIZARD DE ONBOARDING (Protegida: Requiere Login, pero NO onboarding previo) */}
            {/* Si un usuario entra aquí, sigue siendo 'cliente' hasta que termina el formulario */}
            <Route path="onboarding-asesor" element={
              <ProtectedRoute requireOnboarding={false}>
                <OnboardingAsesor />
              </ProtectedRoute>
            } />

            {/* 4. DASHBOARD EXCLUSIVO DE ASESORES (Protegida + Onboarding Completo) */}
            {/* Aquí vive el Scorecard, Inventario y Solicitudes */}
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

            {/* 6. RUTAS DE DETALLE */}
            <Route path="modelo/:id" element={<DetalleModelo />} />
            <Route path="desarrollo/:id" element={<DetalleDesarrollo />} />

            {/* 404 - Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;