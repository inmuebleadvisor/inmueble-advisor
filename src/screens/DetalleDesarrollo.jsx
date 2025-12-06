// src/screens/DetalleDesarrollo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerInformacionDesarrollo } from '../services/catalog.service';
import { useCatalog } from '../context/CatalogContext';

// Componentes UI
import ImageLoader from '../components/ImageLoader';
import PropertyCard from '../components/PropertyCard';
import DevelopmentInfoSection from '../components/DevelopmentInfoSection';

// --- ICONOS ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
};

export default function DetalleDesarrollo() {
  const { id } = useParams();
  const { trackBehavior } = useUser();
  const { loadingCatalog } = useCatalog();
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [desarrollo, setDesarrollo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. CARGA DE DATOS
  useEffect(() => {
    // Si el catálogo global aún carga, esperamos para no hacer peticiones dobles
    if (loadingCatalog) return;

    const cargarDesarrollo = async () => {
      setLoading(true);
      try {
        const data = await obtenerInformacionDesarrollo(id);
        setDesarrollo(data);

        if (data) {
          trackBehavior('view_development', { id: id, name: data.nombre });
        }
      } catch (error) {
        console.error("Error cargando desarrollo:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDesarrollo();
    window.scrollTo(0, 0);
  }, [id, loadingCatalog]);

  if (loadingCatalog || loading) {
    return (
      <div className="main-content" style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando desarrollo...</p>
      </div>
    );
  }

  if (!desarrollo) {
    return (
      <div style={styles.errorContainer}>
        <h2>Desarrollo no encontrado</h2>
        <button onClick={() => navigate('/catalogo')} style={styles.backButtonSimple}>Volver al Catálogo</button>
      </div>
    );
  }

  return (
    <DevelopmentDetailsContent
      desarrollo={desarrollo}
      onBack={() => navigate(-1)}
    />
  );
}

const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '40px', fontFamily: "'Segoe UI', sans-serif" },
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

