// src/screens/DetalleDesarrollo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerInformacionDesarrollo } from '../services/catalog.service';
import { useCatalog } from '../context/CatalogContext';

import DevelopmentDetailsContent from '../components/DevelopmentDetailsContent';

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
        <button onClick={() => navigate('/catalogo')} className="btn btn-secondary">Volver al Catálogo</button>
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
};

