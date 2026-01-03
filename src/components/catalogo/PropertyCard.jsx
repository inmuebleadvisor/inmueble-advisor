import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ImageLoader from '../shared/ImageLoader';
import FavoriteBtn from '../shared/FavoriteBtn';
import Delightbox from '../common/Delightbox';
import HighlightsModal from '../common/HighlightsModal';
import { FINANZAS, IMAGES } from '../../config/constants';
import { useState } from 'react';
import './PropertyCard.css';

// --- ICONOS ---
const Icons = {
  Pin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Flag: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--base-primary-dark)" stroke="var(--base-primary-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
};

// --- HELPERS ---
const formatoMoneda = (val) => {
  if (!val || isNaN(val)) return "$0";
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

// Calcula escrituración aproximada con base en constante global
const calcularEscrituracion = (precio) => formatoMoneda(precio * (FINANZAS?.PORCENTAJE_GASTOS_NOTARIALES || 0.05));

export default function PropertyCard({ item, showDevName = true, style }) {
  const { trackBehavior } = useUser();

  const [showDelightbox, setShowDelightbox] = useState(false);
  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  if (!item) return null;

  const galeriaImagenes = (item.imagenes && item.imagenes.length > 0)
    ? item.imagenes
    : [item.imagen || IMAGES.FALLBACK_PROPERTY];

  const precioMostrar = item.precioNumerico || 0;

  return (
    <article className="card property-card" style={style}>
      {/* 1. SECCIÓN VISUAL (CARRUSEL) */}
      <div className="property-card__carousel-container hide-scrollbar">
        {galeriaImagenes.map((imgSrc, idx) => (
          <div
            key={`${item.id}-img-${idx}`}
            className="property-card__carousel-slide"
            onClick={() => {
              setShowDelightbox(true);
              setInitialImageIndex(idx);
            }}
          >
            <ImageLoader
              src={imgSrc}
              alt={`${item.nombre_modelo} - foto ${idx + 1}`}
              className="property-card__image"
            />
            {idx === 0 && galeriaImagenes.length > 1 && (
              <div className="property-card__swipe-hint">+{galeriaImagenes.length - 1}</div>
            )}
          </div>
        ))}

        {(() => {
          let hasPreventa = false;
          let hasInmediata = false;

          const check = (val) => {
            if (!val) return;
            const s = String(val).toUpperCase().trim();
            if (s.includes('PRE-VENTA') || s.includes('PREVENTA')) hasPreventa = true;
            if (s.includes('INMEDIATA') || s.includes('IMMEDIATE')) hasInmediata = true;
          };

          // Check Status Array/String
          if (item.status) {
            if (Array.isArray(item.status)) {
              item.status.forEach(check);
            } else {
              check(item.status);
            }
          }

          // Fallback legacy
          if (item.esPreventa) hasPreventa = true;

          // Determine Label & Color
          let label = null;
          let bgColor = 'transparent';

          if (hasInmediata && hasPreventa) {
            label = 'Inmediato/Preventa';
            bgColor = '#0ea5e9'; // Blue for mixed/special
          } else if (hasInmediata) {
            label = 'ENTREGA INMEDIATA';
            bgColor = '#10b981'; // Green
          } else if (hasPreventa) {
            label = 'PRE-VENTA';
            bgColor = '#f59e0b'; // Orange
          }

          if (!label) return null;

          return (
            <span
              className="property-card__status-tag"
              style={{ backgroundColor: bgColor }}
            >
              {label}
            </span>
          );
        })()}

        <div className="property-card__favorite-btn-wrapper">
          <FavoriteBtn modeloId={item.id} />
        </div>

        {showDevName && (
          <div className="property-card__image-overlay">
            <h3 className="property-card__overlay-model-name">{item.nombre_modelo}</h3>
            <p className="property-card__overlay-dev-name">{item.nombreDesarrollo}</p>
          </div>
        )}
      </div>

      {/* 2. DATOS DE LA PROPIEDAD */}
      <div className="property-card__body">

        {!showDevName && (
          <>
            <h3 className="property-card__inline-title">{item.nombre_modelo}</h3>
          </>
        )}

        {/* Ubicación Nueva: Icono + Tipo + en + Colonia */}
        <div className="property-card__location-row">
          <span className="property-card__location-icon"><Icons.Pin /></span>
          <span className="property-card__location-type">{item.tipoVivienda}</span> en {item.colonia || (item.zona ? `${item.zona}` : "Ubicación pendiente")}
        </div>

        {/* Características Básicas */}
        <div className="property-card__features-row">
          <span className="property-card__feature-item">🛏 {item.recamaras} Rec.</span>
          <span className="property-card__separator">|</span>
          <span className="property-card__feature-item">🚿 {item.banos} Baños</span>
          <span className="property-card__separator">|</span>
          <span className="property-card__feature-item">📐 {item.m2} m²</span>
        </div>

        {/* Precio */}
        <div className="property-card__price-box">
          <div className="property-card__price-header">
            <span className="property-card__price-label">PRECIO DE LISTA</span>
            {precioMostrar > 0 && item.precios?.metroCuadrado && (
              <span className="property-card__price-label">
                {formatoMoneda(item.precios.metroCuadrado)} m²
              </span>
            )}
          </div>
          <div className="property-card__price-value" style={{
            color: precioMostrar > 0 ? 'var(--text-main)' : 'var(--text-secondary)',
            fontSize: precioMostrar > 0 ? '1.5rem' : '1.2rem'
          }}>
            {precioMostrar > 0 ? formatoMoneda(precioMostrar) : "Consultar Precio"}
          </div>
          {precioMostrar > 0 && (
            <div className="property-card__price-note">
              *Escrituración aprox: {calcularEscrituracion(precioMostrar)}
            </div>
          )}

          {/* Highlights Trigger */}
          {item.highlights && item.highlights.length > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowHighlightsModal(true);
                trackBehavior('view_highlights', { id: item.id, origin: 'card_flag' });
              }}
              className="property-card__highlights-flag"
              title="Ver beneficios destacados"
            >
              <Icons.Flag />
            </button>
          )}
        </div>

        <Link
          to={`/modelo/${item.id}`}
          className="btn btn-primary btn-full property-card__cta"
          onClick={() => trackBehavior('select_property', { id: item.id, origin: 'card' })}
        >
          Ver Detalles Completos
        </Link>
      </div>

      <HighlightsModal
        isOpen={showHighlightsModal}
        onClose={() => setShowHighlightsModal(false)}
        highlights={item.highlights}
        modeloId={item.id}
      />

      {/* DELIGHTBOX INTEGRATION */}
      {showDelightbox && (
        <Delightbox
          isOpen={showDelightbox}
          images={galeriaImagenes}
          initialIndex={initialImageIndex}
          onClose={() => setShowDelightbox(false)}
        />
      )}
    </article>
  );
}
