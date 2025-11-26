import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';

// --- LAYOUT PRINCIPAL ---
import Layout from './components/Layout';

// --- PANTALLAS (SCREENS) ---
import Perfil from './screens/Perfil';
import Catalogo from './screens/Catalogo';
import DetalleModelo from './screens/DetalleModelo';
import DetalleDesarrollo from './screens/DetalleDesarrollo'; // ✅ Nueva pantalla
import Mapa from './screens/Mapa'; // ✅ Nueva pantalla

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* El Layout envuelve a todas las rutas internas.
            Todas las rutas dentro de este bloque se renderizarán 
            en el espacio del <Outlet /> del Layout.
          */}
          <Route path="/" element={<Layout />}>
            
            {/* Ruta por defecto (Index): Actualmente carga el Perfil */}
            <Route index element={<Perfil />} />
            
            {/* Rutas de Navegación Principal */}
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="mapa" element={<Mapa />} />

            {/* Rutas de Detalle (Dinámicas) */}
            {/* :id captura el valor de la URL (ej: /modelo/aguila-1) */}
            <Route path="modelo/:id" element={<DetalleModelo />} />
            
            {/* ✅ Nueva ruta para el Desarrollo (ej: /desarrollo/2846) */}
            <Route path="desarrollo/:id" element={<DetalleDesarrollo />} />

            {/* Ruta 404: Redirecciona al inicio si no encuentra la página */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
export default App;