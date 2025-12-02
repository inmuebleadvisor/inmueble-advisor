// src/components/DevelopmentInfoSection.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';
import AmenidadesList from './AmenidadesList'; // ✅ Reutilización

const Icons = {
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Play: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
};

export default function DevelopmentInfoSection({ desarrollo }) {
  if (!desarrollo) return null;

  // Lógica de medios (Lectura V2)
  const videoUrl = desarrollo.media?.video || desarrollo.multimedia?.video;
  const brochureUrl = desarrollo.media?.brochure || desarrollo.multimedia?.brochure;

  const lat = desarrollo.ubicacion?.latitud;
  const lng = desarrollo.ubicacion?.longitud;
  const mapsUrl = (lat && lng) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : '#';
  const direccion = `${desarrollo.ubicacion?.calle || ''}, ${desarrollo.ubicacion?.colonia || ''}, ${desarrollo.ubicacion?.ciudad || ''}`;

  return (
    <div style={styles.container}>
      
      {/* BOTONES MULTIMEDIA */}
      {(videoUrl || brochureUrl) && (
        <div style={styles.mediaButtonsContainer}>
          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={styles.mediaButton}>
              <Icons.Play /> Ver Video
            </a>
          )}
          {brochureUrl && (
            <a href={brochureUrl} target="_blank" rel="noopener noreferrer" style={{...styles.mediaButton, backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb'}}>
              <Icons.Download /> Brochure
            </a>
          )}
        </div>
      )}

      {/* DESCRIPCIÓN */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Sobre {desarrollo.nombre}</h3>
        <p style={styles.descriptionText}>
          {desarrollo.descripcion || "Un lugar increíble para vivir con tu familia."}
        </p>
      </section>

      {/* AMENIDADES (Usando componente reutilizado) */}
      {desarrollo.amenidades && desarrollo.amenidades.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Amenidades del Desarrollo</h3>
          <AmenidadesList amenidades={desarrollo.amenidades} />
        </section>
      )}

      {/* UBICACIÓN */}
      <section style={styles.section}>
         <h3 style={styles.sectionTitle}>Ubicación</h3>
         <p style={styles.addressText}>{direccion}</p>
         <a 
           href={mapsUrl}
           target={mapsUrl !== '#' ? "_blank" : "_self"}
           rel="noopener noreferrer"
           style={{
              ...styles.mapButtonExternal,
              opacity: mapsUrl === '#' ? 0.5 : 1,
              cursor: mapsUrl === '#' ? 'not-allowed' : 'pointer'
           }}
         >
           <Icons.MapPin /> Abrir en Google Maps
         </a>
      </section>

    </div>
  );
}

const styles = {
  container: { marginTop: '20px' },
  mediaButtonsContainer: { display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' },
  mediaButton: { flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#eff6ff', color: 'var(--secondary-color)', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background 0.2s' },
  section: { marginBottom: '35px' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px', color: '#1f2937' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-line' },
  addressText: { color: '#6b7280', fontSize: '0.95rem', margin: '0 0 15px 0' },
  mapButtonExternal: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '15px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', color: '#374151', fontWeight: '700', textDecoration: 'none', fontSize: '1rem', transition: 'background 0.2s' },
};