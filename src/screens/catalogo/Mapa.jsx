// src/screens/Mapa.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Map as MapIcon, RotateCcw } from 'lucide-react'; // Added icons for Fullscreen

import { useUser } from '../../context/UserContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCatalogFilter } from '../../hooks/useCatalogFilter';
import { useFavorites } from '../../context/FavoritesContext';
import { normalizar } from '../../utils/formatters';

// Shared Components
import SearchBar from '../../components/layout/SearchBar';
import FilterBar from '../../components/layout/FilterBar';
import FilterModal from '../../components/modals/FilterModal';

// Styles
import '../../styles/Catalogo.css';
import '../../styles/Mapa.css';

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
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
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

const MapRevalidator = () => {
  const map = useMap();

  useEffect(() => {
    // 1. Lock Body Scroll to prevent "activation scroll" on first touch/click
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 2. Force Focus to the map container silently
    const container = map.getContainer();
    if (container) {
      container.focus({ preventScroll: true });
    }

    // 3. Invalidate size logic (existing)
    map.invalidateSize();

    const timer = setTimeout(() => {
      map.invalidateSize();
      // Re-assert focus if lost during layout shift
      if (container && document.activeElement !== container) {
        container.focus({ preventScroll: true });
      }
    }, 100);

    return () => {
      // Restore original scroll behavior
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, [map]);
  return null;
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
  const { favoritasIds, isFavorite } = useFavorites();

  /* --- STATE: Map & Filters --- */
  const [isFullscreen, setIsFullscreen] = useState(false); // New Fullscreen State
  const [mapRef, setMapRef] = useState(null);
  const [activeProperty, setActiveProperty] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /* --- FULLSCREEN TOGGLE --- */
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Optional: Force map resize event if needed after transition
    setTimeout(() => {
      if (mapRef) mapRef.invalidateSize();
    }, 300);
  };

  const {
    filtros,
    setFiltros,
    searchTerm,
    setSearchTerm,
    hayFiltrosActivos,
    modelosFiltrados,
    limpiarTodo
  } = useCatalogFilter(dataMaestra, dataDesarrollos, loading);

  const marcadoresVisibles = useMemo(() => {
    if (loading) return [];
    if (!dataDesarrollos || dataDesarrollos.length === 0) return [];
    if (!modelosFiltrados) return [];

    const idsDesarrollosVisibles = new Set(modelosFiltrados.map(m => String(m.idDesarrollo)));

    return dataDesarrollos.map(dev => {
      if (!idsDesarrollosVisibles.has(String(dev.id))) return null;
      if (!dev.ubicacion?.latitud || !dev.ubicacion?.longitud) return null;

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
      }

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
      <div className="map-view map-view--loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando mapa...</p>
      </div>
    );
  }
  // --- RENDER ---
  return (
    <div className={`map-view ${isFullscreen ? 'map-view--fullscreen' : ''}`}>
      {!isFullscreen && (
        <div className="map-view__controls">
          <header className="map-view__header">
            <div className="map-view__header-content">
              <h1 className="map-view__title">Explorar Mapa</h1>
              <p className="map-view__subtitle">{marcadoresVisibles.length} desarrollos en esta zona</p>
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
      )}

      {/* Solo mostramos controles si NO estamos en fullscreen, o decidimos mostrarlos flotantes */}

      <div className="map-view__container">
        {/* Fullscreen Toggle Button - SIEMPRE VISIBLE */}
        <button
          onClick={toggleFullscreen}
          className="map-view__fullscreen-toggle"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'var(--bg-secondary)',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
        >
          {isFullscreen ? <Minimize2 size={20} color="var(--text-main)" /> : <Maximize2 size={20} color="var(--text-main)" />}
        </button>

        <MapContainer
          center={centroMapa}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          tap={false}
          whenCreated={setMapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ControlZoom marcadores={marcadoresVisibles} />
          <MapRevalidator />
          {marcadoresVisibles.map((dev) => (
            <Marker
              key={dev.id}
              position={[dev.ubicacion.latitud, dev.ubicacion.longitud]}
              icon={createCustomIcon(dev.etiquetaPrecio, dev.esFavorito ? 'var(--status-favorite)' : 'var(--primary-color)')}
              eventHandlers={{
                click: () => trackBehavior('map_marker_click', { dev_name: dev.nombre }),
              }}
            >
              <Popup className="custom-popup">
                <div className="map-popup__content">
                  <img
                    src={dev.portada || FALLBACK_IMG}
                    alt={dev.nombre}
                    className="map-popup__image"
                    onError={(e) => e.target.src = FALLBACK_IMG}
                  />
                  <h4 className="map-popup__title">{dev.nombre}</h4>
                  <p className="map-popup__price">{dev.etiquetaPrecio}</p>
                  <p className="map-popup__location">{dev.zona || 'Aguascalientes'}</p>
                  <Link
                    to={`/desarrollo/${dev.id}`}
                    className="map-popup__button"
                  >
                    Ver Desarrollo
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-view__legend">
          <div className="map-view__legend-item">
            <span className="map-view__legend-color map-view__legend-color--favorite"></span>
            <span>En rojo los Favoritos.</span>
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
