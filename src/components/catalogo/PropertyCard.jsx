import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ImageLoader from '../shared/ImageLoader';
import FavoriteBtn from '../shared/FavoriteBtn';
import Delightbox from '../common/Delightbox';
import HighlightsModal from '../common/HighlightsModal';
import { FINANZAS, IMAGES } from '../../config/constants';
import { useState } from 'react';

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
    <article className="card" style={style}>
      {/* 1. SECCIÓN VISUAL (CARRUSEL) */}
      <div style={styles.carouselContainer} className="hide-scrollbar">
        {galeriaImagenes.map((imgSrc, idx) => (
          <div
            key={`${item.id}-img-${idx}`}
            style={{ ...styles.carouselSlide, cursor: 'zoom-in' }}
            onClick={() => {
              setShowDelightbox(true);
              setInitialImageIndex(idx);
            }}
          >
            <ImageLoader
              src={imgSrc}
              alt={`${item.nombre_modelo} - foto ${idx + 1}`}
              style={styles.image}
            />
            {idx === 0 && galeriaImagenes.length > 1 && (
              <div style={styles.swipeHint}>+{galeriaImagenes.length - 1}</div>
            )}
          </div>
        ))}

        <span style={{
          ...styles.statusTag,
          backgroundColor: item.esPreventa ? '#f59e0b' : '#10b981'
        }}>
          {item.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
        </span>

        <div style={styles.favoriteBtnWrapper}>
          <FavoriteBtn modeloId={item.id} />
        </div>

        {showDevName && (
          <div style={styles.imageOverlay} className="pointer-events-none">
            <h3 style={{ ...styles.overlayModelName, fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{item.nombre_modelo}</h3>
            <p style={{ ...styles.overlayDevName, fontSize: '0.9rem', opacity: 0.9, fontWeight: '500' }}>{item.nombreDesarrollo}</p>
          </div>
        )}
      </div>

      {/* 2. DATOS DE LA PROPIEDAD */}
      <div style={styles.cardBody}>

        {!showDevName && (
          <>
            <h3 style={styles.inlineTitle}>{item.nombre_modelo}</h3>
          </>
        )}

        {/* Ubicación Nueva: Icono + Tipo + en + Colonia */}
        <div style={styles.locationRow}>
          <span style={{ marginRight: '4px', display: 'flex', color: 'var(--primary-color)' }}><Icons.Pin /></span>
          <span style={{ fontWeight: 600, marginRight: '4px', color: 'var(--text-main)' }}>{item.tipoVivienda}</span> en {item.colonia || (item.zona ? `${item.zona}` : "Ubicación pendiente")}
        </div>

        {/* Características Básicas */}
        <div style={styles.featuresRow}>
          <span style={styles.featureItem}>🛏 {item.recamaras} Rec.</span>
          <span style={styles.separator}>|</span>
          <span style={styles.featureItem}>🚿 {item.banos} Baños</span>
          <span style={styles.separator}>|</span>
          <span style={styles.featureItem}>📐 {item.m2} m²</span>
        </div>

        {/* Precio */}
        <div style={styles.priceBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={styles.priceLabel}>PRECIO DE LISTA</span>
            {precioMostrar > 0 && item.precios?.metroCuadrado && (
              <span style={styles.priceLabel}>
                {formatoMoneda(item.precios.metroCuadrado)} m²
              </span>
            )}
          </div>
          <div style={{
            ...styles.priceValue,
            color: precioMostrar > 0 ? 'var(--text-main)' : 'var(--text-secondary)',
            fontSize: precioMostrar > 0 ? '1.5rem' : '1.2rem'
          }}>
            {precioMostrar > 0 ? formatoMoneda(precioMostrar) : "Consultar Precio"}
          </div>
          {precioMostrar > 0 && (
            <div style={styles.priceNote}>
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
              style={styles.highlightsFlag}
              title="Ver beneficios destacados"
            >
              <Icons.Flag />
            </button>
          )}
        </div>

        <Link
          to={`/modelo/${item.id}`}
          className="btn btn-primary btn-full"
          style={{ marginTop: '1rem' }}
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

// --- ESTILOS ---
const styles = {
  // .card class handles main container bg/border/shadow/radius
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '220px', position: 'relative', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' },
  carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  swipeHint: { position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10 },
  statusTag: { position: 'absolute', top: '12px', right: '12px', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 10 },
  favoriteBtnWrapper: { position: 'absolute', top: '50px', right: '12px', zIndex: 11 },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '40px 16px 12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 10 },
  overlayDevName: { color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: '700', margin: 0, lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  overlayModelName: { color: 'white', fontSize: '1.4rem', margin: '4px 0 0 0', fontWeight: '800' },

  cardBody: { padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  inlineTitle: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' },
  locationRow: { color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  featuresRow: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', marginTop: 'auto' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  separator: { color: 'var(--bg-tertiary)', fontSize: '1.2rem', fontWeight: '300' },

  priceBox: {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '12px',
    padding: '12px',
    marginTop: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    position: 'relative'
  },
  priceLabel: { fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' },
  priceValue: { fontWeight: '800', margin: '2px 0' },
  priceNote: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.8 },

  highlightsFlag: { position: 'absolute', bottom: '10px', right: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--primary-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 5, color: 'var(--primary-color)' },
};
