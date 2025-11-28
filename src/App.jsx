import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';

// --- LAYOUT PRINCIPAL ---
import Layout from './components/Layout';

// --- PANTALLAS (SCREENS) ---
import Perfil from './screens/Perfil';
import Catalogo from './screens/Catalogo';
import DetalleModelo from './screens/DetalleModelo';
import DetalleDesarrollo from './screens/DetalleDesarrollo';
import Mapa from './screens/Mapa';
import LandingAsesores from './screens/LandingAsesores'; // ✅ 1. Importamos la nueva pantalla

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* 
            El Layout envuelve a todas las rutas internas.
            Mantiene el Header y Footer visibles en todas las pantallas.
          */}
          <Route path="/" element={<Layout />}>
            
            {/* Ruta por defecto (Index): Carga el Perfil/Bienvenida */}
            <Route index element={<Perfil />} />
            
            {/* Rutas de Navegación Principal */}
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="mapa" element={<Mapa />} />

            {/* ✅ 2. Nueva Ruta para el Portal de Asesores */}
            {/* Acceso mediante: /soy-asesor */}
            <Route path="soy-asesor" element={<LandingAsesores />} />

            {/* Rutas de Detalle (Dinámicas) */}
            <Route path="modelo/:id" element={<DetalleModelo />} />
            <Route path="desarrollo/:id" element={<DetalleDesarrollo />} />

            {/* Ruta 404: Redirecciona al inicio si la URL no existe */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;