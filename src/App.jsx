// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';

// --- SEGURIDAD ---
import ProtectedRoute from './components/ProtectedRoute'; // ✅ Importamos el guardia

// --- LAYOUT PRINCIPAL ---
import Layout from './components/Layout';

// --- PANTALLAS (SCREENS) ---
import Perfil from './screens/Perfil';
import Catalogo from './screens/Catalogo';
import DetalleModelo from './screens/DetalleModelo';
import DetalleDesarrollo from './screens/DetalleDesarrollo';
import Mapa from './screens/Mapa';
import LandingAsesores from './screens/LandingAsesores';
import OnboardingAsesor from './screens/OnboardingAsesor'; // ✅ Importamos la nueva pantalla

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
          
            {/* 1. RUTA PÚBLICA (Home/Perfil) */}
            <Route index element={<Perfil />} />
            
            {/* 2. LANDING PARA CAPTACIÓN DE ASESORES (Pública) */}
            <Route path="soy-asesor" element={<LandingAsesores />} />

            {/* 3. WIZARD DE ONBOARDING (Protegida: Requiere Login, pero NO requiere onboarding previo) */}
            <Route path="onboarding-asesor" element={
              <ProtectedRoute requireOnboarding={false}>
                <OnboardingAsesor />
              </ProtectedRoute>
            } />

            {/* 4. RUTAS DEL SISTEMA (Protegidas y con verificación de onboarding) */}
            {/* Si un ASESOR entra aquí sin terminar sus datos, será redirigido al wizard */}
            
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

            {/* 5. RUTAS DE DETALLE */}
            <Route path="modelo/:id" element={<DetalleModelo />} />
            <Route path="desarrollo/:id" element={<DetalleDesarrollo />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;