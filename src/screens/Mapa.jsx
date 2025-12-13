// src/screens/Mapa.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { useCatalogFilter } from '../hooks/useCatalogFilter';
import { useFavorites } from '../context/FavoritesContext';
import { normalizar } from '../utils/formatters';

// Shared Components
import SearchBar from '../components/shared/SearchBar';
import FilterBar from '../components/shared/FilterBar';
import FilterModal from '../components/shared/FilterModal';

// Styles (Imported to ensure shared components look correct)
import '../styles/Catalogo.css';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- HELPERS ---
const createCustomIcon = (textoPrecio, backgroundColor) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${backgroundColor};
      color: white;
      padding: 6px 10px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.75rem;
      white-space: nowrap;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      border: 2px solid white;
      text-align: center;
      min-width: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    ">
      ${textoPrecio}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>`,
    iconSize: [null, 30],
    iconAnchor: [30, 35],
    popupAnchor: [0, -35]
  });
};

const ControlZoom = ({ marcadores }) => {
  const map = useMap();
  useEffect(() => {
    if (marcadores.length > 0) {
      const bounds = L.latLngBounds();
      let validos = 0;
      marcadores.forEach(m => {
        if (m.ubicacion?.latitud && m.ubicacion?.longitud) {
          bounds.extend([m.ubicacion.latitud, m.ubicacion.longitud]);
          validos++;
        }
      });
      if (validos > 0) map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [marcadores, map]);
  return null;
};

export default function Mapa() {
  const { trackBehavior } = useUser();
  const { modelos: dataMaestra, desarrollos: dataDesarrollos, amenidades: topAmenidades, loadingCatalog: loading } = useCatalog();
  const { favoritasIds, isFavorite } = useFavorites(); // Integracion de favoritos

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Use Shared Logic
  const {
    filtros,
    setFiltros,
    searchTerm,
    setSearchTerm,
    hayFiltrosActivos,
    modelosFiltrados,
    limpiarTodo
  } = useCatalogFilter(dataMaestra, dataDesarrollos, loading);

  // 3. LÓGICA DE AGRUPACIÓN (De Modelos Filtrados -> Desarrollos)
  const marcadoresVisibles = useMemo(() => {
    if (loading) return [];
    if (!dataDesarrollos || dataDesarrollos.length === 0) return [];
    if (!modelosFiltrados) return [];

    // Conjunto de IDs de desarrollo que tienen modelos que pasaron el filtro
    const idsDesarrollosVisibles = new Set(modelosFiltrados.map(m => String(m.idDesarrollo)));

    return dataDesarrollos.map(dev => {
      // 1. Validar que el desarrollo tenga modelos visibles
      if (!idsDesarrollosVisibles.has(String(dev.id))) return null;

      // 2. Validar Ubicación
      if (!dev.ubicacion?.latitud || !dev.ubicacion?.longitud) return null;

      // Generación de Etiqueta de Precio (Basado solo en los modelos filtrados)
      const modelosHijosFiltrados = modelosFiltrados.filter(m => String(m.idDesarrollo) === String(dev.id));

      let etiqueta = "$ Consultar";
      if (modelosHijosFiltrados.length > 0) {
        const precios = modelosHijosFiltrados.map(m => Number(m.precioNumerico));
        const min = Math.min(...precios);
        const max = Math.max(...precios);

        const formatCompact = (val) => {
          if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
          return `$${val}`;
        };

        etiqueta = formatCompact(min);
        if (min !== max) etiqueta = `${formatCompact(min)} - ${formatCompact(max)}`;
      } else if (dev.precioDesde) {
        // Fallback por si acaso, aunque no deberia pasar si filtramos por modelos
        etiqueta = `$${(dev.precioDesde / 1000000).toFixed(1)}M`;
      }

      // Determinamos si el desarrollo tiene algun modelo favorito
      // Revisamos TODOS los modelos del desarrollo, no solo los filtrados
      const todosModelosDelDesarrollo = dataMaestra.filter(m => String(m.idDesarrollo) === String(dev.id));
      const tieneFavorito = todosModelosDelDesarrollo.some(m => isFavorite(m.id));

      return {
        id: dev.id,
        nombre: dev.nombre,
        zona: dev.zona,
        ubicacion: { latitud: dev.ubicacion.latitud, longitud: dev.ubicacion.longitud },
        portada: dev.imagen,
        etiquetaPrecio: etiqueta,
        esFavorito: tieneFavorito
      };
    }).filter(Boolean);

  }, [dataDesarrollos, modelosFiltrados, loading, isFavorite, dataMaestra]);

  const centroMapa = [21.88, -102.29];

  if (loading) {
    return (
      <div className="main-content" style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="main-content" style={styles.pageContainer}>

      {/* Replaced Header with Shared Components */}
      <div style={{ padding: '0', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Mapa Interactivo</h1>
            <p style={styles.subtitle}>{marcadoresVisibles.length} desarrollos encontrados</p>
          </div>
        </header>

        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <FilterBar
          setIsFilterOpen={setIsFilterOpen}
          hayFiltrosActivos={hayFiltrosActivos}
          limpiarTodo={limpiarTodo}
          filtros={filtros}
        />
      </div>

      <div style={styles.mapContainer}>
        <MapContainer
          center={centroMapa}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ControlZoom marcadores={marcadoresVisibles} />

          {marcadoresVisibles.map((dev) => (
            <Marker
              key={dev.id}
              position={[dev.ubicacion.latitud, dev.ubicacion.longitud]}
              icon={createCustomIcon(dev.etiquetaPrecio, dev.esFavorito ? '#8B0000' : 'var(--primary-color)')}
              eventHandlers={{
                click: () => trackBehavior('map_marker_click', { dev_name: dev.nombre }),
              }}
            >
              <Popup className="custom-popup">
                <div style={styles.popupContent}>
                  <img
                    src={dev.portada || FALLBACK_IMG}
                    alt={dev.nombre}
                    style={styles.popupImage}
                    onError={(e) => e.target.src = FALLBACK_IMG}
                  />
                  <h4 style={styles.popupTitle}>{dev.nombre}</h4>
                  <p style={styles.popupPrice}>{dev.etiquetaPrecio}</p>
                  <p style={styles.popupLocation}>{dev.zona || 'Aguascalientes'}</p>
                  <Link
                    to={`/desarrollo/${dev.id}`}
                    style={styles.popupButton}
                  >
                    Ver Desarrollo
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Leyenda del Mapa */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: '#8B0000', borderRadius: '50%', display: 'inline-block' }}></span>
            <span>En rojo donde tienes modelos favoritos</span>
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filtros={filtros}
        setFiltros={setFiltros}
        limpiarTodo={limpiarTodo}
        topAmenidades={topAmenidades}
        resultadosCount={modelosFiltrados.length}
      />
    </div>
  );
}

// Cleaned up styles - removed filter/modal specific styles
const styles = {
  pageContainer: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' },
  header: { backgroundColor: 'var(--bg-main)', padding: '15px 20px 5px 20px' },
  title: { color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: '800' },
  subtitle: { color: 'white', margin: '2px 0 0 0', fontSize: '0.9rem' },
  mapContainer: { flex: 1, width: '100%', position: 'relative', zIndex: 1 },
  popupContent: { textAlign: 'center', width: '160px' },
  popupImage: { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#eee' },
  popupTitle: { margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#333' },
  popupPrice: { margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-color)' },
  popupLocation: { margin: '0 0 8px 0', fontSize: '0.8rem', color: '#666' },
  popupButton: { display: 'block', backgroundColor: '#111', color: 'white', padding: '8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' },
};
