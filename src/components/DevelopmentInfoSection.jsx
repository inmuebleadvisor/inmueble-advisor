// src/components/DevelopmentInfoSection.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { useMemo, useState } from 'react';
import AmenidadesList from './AmenidadesList';
import Carousel from './Carousel'; // Importamos el componente para no duplicar código
import MapModal from './shared/MapModal';


// --- ICONOS ---
const Icons = {
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Play: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Calendar: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
};

// --- HELPER DE FECHAS ---
const esFechaFutura = (timestamp) => {
  if (!timestamp) return false;
  // Manejo robusto: Funciona si viene de Firebase (seconds) o como Date nativo
  const fecha = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const hoy = new Date();
  // Retorna true solo si la fecha de entrega es mayor a hoy
  return fecha > hoy;
};

const formatFecha = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
};

export default function DevelopmentInfoSection({ desarrollo }) {
  const [mostrarMapa, setMostrarMapa] = useState(false);

  if (!desarrollo) return null;

  // 1. Extracción de Datos
  const videoUrl = desarrollo.media?.video || desarrollo.multimedia?.video;
  const brochureUrl = desarrollo.media?.brochure || desarrollo.multimedia?.brochure;

  // Ubicación y Mapas
  const lat = desarrollo.ubicacion?.latitud;
  const lng = desarrollo.ubicacion?.longitud;
  const mapsUrl = (lat && lng) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : '#';
  const direccion = `${desarrollo.ubicacion?.calle || ''}, ${desarrollo.ubicacion?.colonia || ''}, ${desarrollo.ubicacion?.ciudad || ''}`;

  // Info Comercial
  const info = desarrollo.info_comercial || {};
  const mostrarFechaEntrega = esFechaFutura(info.fecha_entrega);

  // 2. Preparar Galería (Reutilizando lógica del componente Carousel)
  // Nota Didáctica: Memoizamos para evitar cálculos innecesarios en cada render
  const galeriaItems = useMemo(() => {
    let imagenes = [];

    // 1. Cover (Priority 1)
    if (desarrollo.media?.cover) {
      imagenes.push(desarrollo.media.cover);
    }

    // 2. Gallery (Priority 2 - appended)
    if (desarrollo.media?.gallery && Array.isArray(desarrollo.media.gallery)) {
      imagenes = [...imagenes, ...desarrollo.media.gallery];
    }
    // Fallback: Legacy Gallery (only if main gallery missing?) - Actually, let's append if no main gallery
    else if (desarrollo.multimedia?.galeria && Array.isArray(desarrollo.multimedia.galeria)) {
      imagenes = [...imagenes, ...desarrollo.multimedia.galeria];
    }

    // 3. Fallback: Legacy Image (only if nothing else found)
    if (imagenes.length === 0 && desarrollo.imagen) {
      imagenes = [desarrollo.imagen];
    }

    // Transformamos al formato que pide tu Carousel: { url, type }
    return imagenes.map(url => ({ url, type: 'image' }));
  }, [desarrollo]);

  return (
    <div style={styles.container}>

      {/* A. GALERÍA (Posición 1: Debajo del título, antes de la descripción) */}
      {/* Asignamos una altura fija para que no desplace el contenido bruscamente al cargar */}
      <div style={styles.carouselContainer}>
        <Carousel items={galeriaItems} />
      </div>

      {/* B. DESCRIPCIÓN (Posición 2) */}
      <section style={styles.section}>
        <p style={styles.descriptionText}>
          {desarrollo.descripcion || desarrollo.info_comercial?.descripcion || "Información del desarrollo no disponible."}
        </p>
      </section>

      {/* C. BROCHURE Y VIDEO (Posición 3: Debajo de la descripción) */}
      {(videoUrl || brochureUrl) && (
        <div style={styles.mediaButtonsContainer}>
          {brochureUrl && (
            <a href={brochureUrl} target="_blank" rel="noopener noreferrer" style={{ ...styles.mediaButton, backgroundColor: '#1f2937', color: 'white', border: 'none' }}>
              <Icons.Download /> Descargar Brochure
            </a>
          )}
          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={styles.mediaButton}>
              <Icons.Play /> Ver Video del Desarrollo
            </a>
          )}
        </div>
      )}

      {/* D. ENTREGA ESTIMADA (Posición 4: Solo si es futura) */}
      {mostrarFechaEntrega && (
        <div style={styles.deliveryDateBox}>
          <div style={styles.iconBox}><Icons.Calendar /></div>
          <div>
            <span style={styles.statLabel}>Entrega Estimada del Proyecto</span>
            <div style={styles.statValue}>{formatFecha(info.fecha_entrega)}</div>
          </div>
        </div>
      )}

      {/* E. AMENIDADES (Posición 5) */}
      {desarrollo.amenidades && desarrollo.amenidades.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Amenidades del Desarrollo</h3>
          <AmenidadesList amenidades={desarrollo.amenidades} />
        </section>
      )}

      {/* F. UBICACIÓN (Posición 6: Al final) */}
      <section style={{ ...styles.section, marginBottom: 0 }}>
        <h3 style={styles.sectionTitle}>Ubicación</h3>
        <p style={styles.addressText}>{direccion}</p>
        <button
          onClick={() => setMostrarMapa(true)}
          disabled={!lat || !lng}
          className="btn btn-secondary btn-md btn-full"
          style={{ opacity: (lat && lng) ? 1 : 0.5 }}
        >
          <Icons.MapPin /> Ver ubicación
        </button>
      </section>

      <MapModal
        isOpen={mostrarMapa}
        onClose={() => setMostrarMapa(false)}
        location={desarrollo.ubicacion}
        developmentName={desarrollo.nombre}
      />

    </div>
  );
}

// --- ESTILOS ---
const styles = {
  container: { marginTop: '20px' },

  // Carousel Container
  carouselContainer: {
    width: '100%',
    height: '300px', // Altura controlada para mantener consistencia visual
    marginBottom: '25px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#e5e7eb' // Placeholder color mientras carga
  },

  // Descripción
  section: { marginBottom: '30px' },
  descriptionText: { color: '#4b5563', lineHeight: '1.7', fontSize: '0.95rem', whiteSpace: 'pre-line' },

  // Botones Multimedia
  mediaButtonsContainer: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' },
  mediaButton: { flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'white', color: '#1f2937', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },

  // Fecha de Entrega (Estilo destacado pero limpio)
  deliveryDateBox: { display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50px', marginBottom: '30px', color: '#166534' },
  iconBox: { display: 'flex', alignItems: 'center' },
  statLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' },
  statValue: { fontSize: '1rem', fontWeight: '800' },

  // Títulos y Textos Generales
  sectionTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '15px', color: '#111827' },
  addressText: { color: '#6b7280', fontSize: '0.95rem', margin: '0 0 15px 0' },

  // Botón Mapa
  mapButtonExternal: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#374151', fontWeight: '600', textDecoration: 'none', fontSize: '0.95rem', transition: 'background 0.2s' },
};