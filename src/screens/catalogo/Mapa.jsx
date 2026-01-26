// src/screens/Mapa.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const { favoritasIds, isFavorite } = useFavorites();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  return (
    <div className="map-view">
      <div className="map-view__controls">
        <header className="map-view__header">
          <div className="map-view__header-content">
            <h1 className="map-view__title">Mapa Interactivo</h1>
            <p className="map-view__subtitle">{marcadoresVisibles.length} desarrollos encontrados</p>
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

      <div className="map-view__container">
        <MapContainer
          center={centroMapa}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          tap={false}
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
