import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import Portal from '../common/Portal';

import './MapCatalogView.css';

/**
 * Helper to create a custom marker icon with price
 */
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

/**
 * Internal component to handle map revalidation and focus
 */
const MapRevalidator = () => {
    const map = useMap();

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;

        // Force focus and invalidate size
        const container = map.getContainer();
        if (container) {
            container.focus({ preventScroll: true });
        }

        map.invalidateSize();

        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => {
            document.body.style.overflow = originalOverflow;
            clearTimeout(timer);
        };
    }, [map]);
    return null;
};

/**
 * Internal component to auto-zoom to include all markers
 */
const ControlZoom = ({ marcadores }) => {
    const map = useMap();
    useEffect(() => {
        if (marcadores && marcadores.length > 0) {
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

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

/**
 * MapCatalogView Component
 * Integrates Leaflet map with Catalog developments
 * 
 * @param {Object} props
 * @param {Array} props.marcadores - List of markers to display
 * @param {Function} props.trackBehavior - Tracking function
 */
export default function MapCatalogView({ marcadores, trackBehavior, isFullscreen, setIsFullscreen }) {
    const [mapRef, setMapRef] = useState(null);

    // Manage body overflow when fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    const centroMapa = [21.88, -102.29];

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        // Force map resize event after transition
        setTimeout(() => {
            if (mapRef) mapRef.invalidateSize();
        }, 300);
    };

    const content = (
        <div className={`map-catalog-view ${isFullscreen ? 'map-catalog-view--fullscreen' : ''}`}>
            {/* Fullscreen Toggle */}
            <button
                onClick={toggleFullscreen}
                className="map-catalog-view__fullscreen-toggle"
                title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
            >
                {isFullscreen ? <Minimize2 size={20} color="var(--text-main)" /> : <Maximize2 size={20} color="var(--text-main)" />}
            </button>

            <div className="map-catalog-view__container">
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

                    <ControlZoom marcadores={marcadores} />
                    <MapRevalidator />

                    {marcadores.map((dev) => (
                        <Marker
                            key={dev.id}
                            position={[dev.ubicacion.latitud, dev.ubicacion.longitud]}
                            icon={createCustomIcon(dev.etiquetaPrecio, dev.esFavorito ? 'var(--status-favorite)' : 'var(--primary-color)')}
                            eventHandlers={{
                                click: () => trackBehavior && trackBehavior('map_marker_click', { dev_name: dev.nombre }),
                            }}
                        >
                            <Popup className="map-catalog-view__popup">
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

                <div className="map-catalog-view__legend">
                    <div className="map-catalog-view__legend-item">
                        <span className="map-catalog-view__legend-color map-catalog-view__legend-color--favorite"></span>
                        <span>En rojo los Favoritos.</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return isFullscreen ? <Portal>{content}</Portal> : content;
}
