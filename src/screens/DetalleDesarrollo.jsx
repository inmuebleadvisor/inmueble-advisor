import React, { useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Importación de datos
import desarrollosRaw from '../data/desarrollos.json';
import modelosRaw from '../data/modelos.json';

// Imágenes por defecto
const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

/**
 * 🎨 Iconos SVG
 */
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
};

export default function DetalleDesarrollo() {
  const { id } = useParams(); // Recibimos el ID del desarrollo (ej: "2846")
  const { trackBehavior } = useUser();
  const navigate = useNavigate();

  // --- 1. LÓGICA DE DATOS (useMemo) ---
  const data = useMemo(() => {
    // A. Encontrar el Desarrollo Padre
    // Normalizamos a string y quitamos espacios para evitar errores de comparación
    const desarrolloEncontrado = desarrollosRaw.find(d => 
      String(d.id_desarrollo || d.id).trim() === String(id).trim()
    );

    if (!desarrolloEncontrado) return { desarrollo: null, modelos: [] };

    // B. Filtrar los Modelos Hijos
    // Buscamos en modelos.json todos los que coincidan con el id del desarrollo
    const modelosFiltrados = modelosRaw.map((modelo, index) => {
      // Normalizamos IDs
      const idDevModelo = String(modelo.id_desarrollo || modelo.desarrollo_id).trim();
      const idDevPadre = String(desarrolloEncontrado.id_desarrollo || desarrolloEncontrado.id).trim();

      if (idDevModelo !== idDevPadre) return null;

      // C. IMPORTANTE: Reconstruir el ID compuesto para el Link
      // Esto es vital para que el click lleve al DetalleModelo correcto
      const nombreSlug = (modelo.nombre_modelo || modelo.nombre || 'modelo').toLowerCase().replace(/\s+/g, '-');
      const uniqueId = `${idDevModelo}-${nombreSlug}-${index}`;

      return {
        ...modelo,
        _linkId: uniqueId, // ID especial para el router
        precioNumerico: Number(String(modelo.precio?.actual || modelo.precio).replace(/[^0-9.]/g, "")),
        imagen: modelo.multimedia?.galeria?.[0] || modelo.multimedia?.planta_baja || FALLBACK_IMG
      };
    }).filter(item => item !== null); // Eliminamos los nulos

    return { desarrollo: desarrolloEncontrado, modelos: modelosFiltrados };
  }, [id]);

  const { desarrollo, modelos } = data;

  // --- 2. EFECTOS (Analytics y Scroll) ---
  useEffect(() => {
    if (desarrollo) {
      trackBehavior('view_development', { 
        id: id,
        name: desarrollo.nombre 
      });
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Manejo de error 404
  if (!desarrollo) {
    return (
      <div style={styles.errorContainer}>
        <h2>Desarrollo no encontrado</h2>
        <button onClick={() => navigate('/')} style={styles.backButtonSimple}>Ir al Inicio</button>
      </div>
    );
  }

  // Helper de moneda
  const formatoMoneda = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };

  // Construir dirección legible
  const direccionCompleta = `${desarrollo.ubicacion?.calle || ''}, ${desarrollo.ubicacion?.colonia || ''}, ${desarrollo.ubicacion?.ciudad || ''}`;

  return (
    <div className="main-content" style={styles.pageContainer}>
      
      {/* HEADER: Portada del Desarrollo */}
      <header style={styles.headerImageContainer}>
        <img 
          src={desarrollo.multimedia?.portada || FALLBACK_IMG} 
          alt={desarrollo.nombre} 
          style={styles.headerImage}
          onError={(e) => e.target.src = FALLBACK_IMG} 
        />
        <button onClick={() => navigate(-1)} style={styles.floatingBackButton} aria-label="Volver">
          <Icons.Back />
        </button>
        
        {/* Badge de Status sobre la imagen */}
        <div style={styles.statusBadgeOverlay}>
          {desarrollo.status || 'En Venta'}
        </div>
        
        <div style={styles.headerGradient}></div>
      </header>

      <main style={styles.contentBody}>
        
        {/* INFO PRINCIPAL */}
        <div style={styles.titleSection}>
          <h1 style={styles.devTitle}>{desarrollo.nombre}</h1>
          <div style={styles.locationRow}>
            <Icons.MapPin />
            <span>{desarrollo.zona || desarrollo.ubicacion?.ciudad}</span>
          </div>
          <p style={styles.addressText}>{direccionCompleta}</p>
        </div>

        <hr style={styles.divider} />

        {/* DESCRIPCIÓN */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Sobre el lugar</h3>
          <p style={styles.descriptionText}>
            {desarrollo.descripcion || "Un lugar increíble para vivir con tu familia."}
          </p>
        </section>

        {/* AMENIDADES (Chips) */}
        {desarrollo.amenidades && desarrollo.amenidades.length > 0 && (
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Amenidades</h3>
            <div style={styles.amenitiesContainer}>
              {desarrollo.amenidades.map((am, idx) => (
                <div key={idx} style={styles.amenityChip}>
                  <div style={styles.checkIcon}><Icons.Check /></div>
                  {am}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LISTA DE MODELOS DISPONIBLES */}
        <section style={styles.modelsSection}>
          <div style={styles.sectionHeaderRow}>
            <h3 style={styles.sectionTitle}>Modelos Disponibles</h3>
            <span style={styles.modelCountBadge}>{modelos.length}</span>
          </div>
          
          <div style={styles.modelsGrid}>
            {modelos.map((modelo) => (
              <Link 
                key={modelo._linkId} 
                to={`/modelo/${modelo._linkId}`} 
                style={styles.modelCard}
                onClick={() => trackBehavior('select_model_from_dev', { model_name: modelo.nombre_modelo })}
              >
                <div style={styles.modelImgContainer}>
                  <img src={modelo.imagen} alt={modelo.nombre_modelo} style={styles.modelImg} loading="lazy" />
                  <span style={styles.modelTag}>Ver Detalles</span>
                </div>
                <div style={styles.modelInfo}>
                  <h4 style={styles.modelName}>{modelo.nombre_modelo}</h4>
                  <div style={styles.modelSpecs}>
                    <span>🏠 {modelo.caracteristicas?.recamaras} Rec.</span>
                    <span>🚿 {modelo.caracteristicas?.banos} Baños</span>
                  </div>
                  <div style={styles.modelPrice}>
                    {formatoMoneda(modelo.precioNumerico)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {modelos.length === 0 && (
            <p style={{color: '#6b7280', fontStyle: 'italic'}}>No hay modelos disponibles por el momento.</p>
          )}
        </section>

        {/* BOTÓN UBICACIÓN EXTERNA */}
        <div style={styles.locationActionSection}>
          <h3 style={styles.sectionTitle}>Ubicación</h3>
          {/* Este botón abre Google Maps con las coordenadas */}
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${desarrollo.ubicacion?.latitud},${desarrollo.ubicacion?.longitud}`}
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.mapButtonExternal}
          >
            <Icons.MapPin /> Abrir en Google Maps
          </a>
        </div>

      </main>
    </div>
  );
}

// --- ESTILOS CSS-IN-JS ---
const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '40px', fontFamily: "'Segoe UI', sans-serif" },
  
  // Header
  headerImageContainer: { position: 'relative', width: '100%', height: '280px', backgroundColor: '#e5e7eb' },
  headerImage: { width: '100%', height: '100%', objectFit: 'cover' },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))' },
  floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, color: '#333' },
  
  statusBadgeOverlay: { position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' },

  contentBody: { padding: '0 20px', position: 'relative', zIndex: 2, marginTop: '-30px' },
  
  // Título e Info
  titleSection: { marginBottom: '20px', textAlign: 'left' },
  devTitle: { fontSize: '2.2rem', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', lineHeight: '1' },
  locationRow: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: '600', fontSize: '1rem', marginBottom: '5px' },
  addressText: { color: '#6b7280', fontSize: '0.9rem', margin: 0 },

  divider: { border: 'none', borderTop: '1px solid #f3f4f6', margin: '25px 0' },
  
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '800', marginBottom: '15px', color: '#1f2937' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' },

  // Amenidades
  amenitiesContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  amenityChip: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', color: '#166534', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #dcfce7' },
  checkIcon: { display: 'flex', alignItems: 'center' },

  // Sección Modelos
  modelsSection: { backgroundColor: '#f9fafb', margin: '0 -20px', padding: '30px 20px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' },
  sectionHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
  modelCountBadge: { backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' },
  
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  
  // Tarjeta de Modelo (Mini)
  modelCard: { display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textDecoration: 'none', transition: 'transform 0.2s', border: '1px solid #f3f4f6' },
  modelImgContainer: { height: '160px', position: 'relative', backgroundColor: '#eee' },
  modelImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modelTag: { position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' },
  modelInfo: { padding: '15px' },
  modelName: { margin: '0 0 5px 0', color: '#111', fontSize: '1.1rem', fontWeight: '700' },
  modelSpecs: { display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#6b7280', marginBottom: '10px' },
  modelPrice: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-color)' },

  // Botón Mapa Externo
  locationActionSection: { marginTop: '30px' },
  mapButtonExternal: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '15px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', color: '#374151', fontWeight: '700', textDecoration: 'none', fontSize: '1rem', transition: 'background 0.2s' },
  
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};