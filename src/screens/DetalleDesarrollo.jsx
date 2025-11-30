// src/screens/DetalleDesarrollo.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerInformacionDesarrollo } from '../services/catalog.service'; 
import { useCatalog } from '../context/CatalogContext'; 
import ImageLoader from '../components/ImageLoader';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- ICONOS ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Play: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
};

// Helper para validar si es imagen
const esImagen = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('image');
};

export default function DetalleDesarrollo() {
  const { id } = useParams();
  const { trackBehavior } = useUser();
  const { loadingCatalog } = useCatalog(); 
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // --- ESTADOS (Async) ---
  const [desarrollo, setDesarrollo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. CARGA DE DATOS ASÍNCRONA
  useEffect(() => {
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

  // 2. CONSTRUCCIÓN DE GALERÍA
  const galeriaImagenes = useMemo(() => {
    if (!desarrollo) return [];
    
    let imgs = [];
    if (desarrollo.multimedia?.portada && esImagen(desarrollo.multimedia.portada)) {
      imgs.push(desarrollo.multimedia.portada);
    }
    if (Array.isArray(desarrollo.multimedia?.galeria)) {
      const fotosLimpias = desarrollo.multimedia.galeria.filter(url => esImagen(url));
      imgs.push(...fotosLimpias);
    }
    if (imgs.length === 0) imgs.push(FALLBACK_IMG);
    
    return [...new Set(imgs)];
  }, [desarrollo]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      setActiveIndex(index);
    }
  };

  const formatoMoneda = (val) => {
    if (!val || val === 0) return 'Pendiente';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };

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
        <button onClick={() => navigate('/')} style={styles.backButtonSimple}>Ir al Inicio</button>
      </div>
    );
  }

  const modelos = desarrollo.modelos || [];
  const direccionCompleta = `${desarrollo.ubicacion?.calle || ''}, ${desarrollo.ubicacion?.colonia || ''}, ${desarrollo.ubicacion?.ciudad || ''}`;
  
  // ✅ CORRECCIÓN FASE 3.1: URL válida de Google Maps con interpolación correcta
  const mapsUrl = `https://www.google.com/maps?q=${desarrollo.ubicacion?.latitud},${desarrollo.ubicacion?.longitud}&z=15`;

  return (
    <div className="main-content animate-fade-in" style={styles.pageContainer}>
      
      {/* HEADER: Carrusel */}
      <header style={styles.carouselWrapper}>
        <div 
          ref={scrollRef}
          style={styles.carouselContainer} 
          className="hide-scrollbar"
          onScroll={handleScroll}
        >
          {galeriaImagenes.map((img, idx) => (
            <div key={idx} style={styles.carouselSlide}>
              <ImageLoader 
                src={img} 
                alt={`Desarrollo ${idx}`} 
                style={styles.headerImage} 
              />
            </div>
          ))}
        </div>

        <button onClick={() => navigate(-1)} style={styles.floatingBackButton} aria-label="Volver">
          <Icons.Back />
        </button>
        
        <div style={styles.statusBadgeOverlay}>
          {desarrollo.status || 'En Venta'}
        </div>

        {galeriaImagenes.length > 1 && (
          <div style={styles.imageCounter}>
            {activeIndex + 1} / {galeriaImagenes.length}
          </div>
        )}

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

        {/* BOTONES MULTIMEDIA */}
        {(desarrollo.multimedia?.video || desarrollo.multimedia?.brochure) && (
          <div style={styles.mediaButtonsContainer}>
            {desarrollo.multimedia?.video && (
              <a href={desarrollo.multimedia.video} target="_blank" rel="noopener noreferrer" style={styles.mediaButton}>
                <Icons.Play /> Ver Video
              </a>
            )}
            {desarrollo.multimedia?.brochure && (
              <a href={desarrollo.multimedia.brochure} target="_blank" rel="noopener noreferrer" style={{...styles.mediaButton, backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb'}}>
                <Icons.Download /> Brochure
              </a>
            )}
          </div>
        )}

        <hr style={styles.divider} />

        {/* DESCRIPCIÓN */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Sobre el lugar</h3>
          <p style={styles.descriptionText}>
            {desarrollo.descripcion || "Un lugar increíble para vivir con tu familia."}
          </p>
        </section>

        {/* AMENIDADES */}
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
                 key={modelo.id}
                 to={`/modelo/${modelo.id}`}
                 style={styles.modelCard}
                 onClick={() => trackBehavior('select_model_from_dev', { model_name: modelo.nombre_modelo })}
               >
                 <div style={styles.modelImgContainer}>
                    <ImageLoader 
                      src={modelo.imagen} 
                      alt={modelo.nombre_modelo} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <span style={styles.modelTag}>Ver Detalles</span>
                 </div>
                 
                 <div style={styles.modelInfo}>
                   <h4 style={styles.modelName}>{modelo.nombre_modelo}</h4>
                   <div style={styles.modelSpecs}>
                      <span>🛏 {modelo.recamaras} Rec.</span>
                      <span>🚿 {modelo.banos} Baños</span>
                   </div>
                   <div style={{
                     ...styles.modelPrice,
                     color: modelo.precioNumerico > 0 ? 'var(--primary-color)' : '#6b7280',
                     fontSize: modelo.precioNumerico > 0 ? '1.2rem' : '1rem'
                   }}>
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

        {/* BOTÓN UBICACIÓN CORREGIDO */}
        <div style={styles.locationActionSection}>
           <h3 style={styles.sectionTitle}>Ubicación</h3>
           <a 
             href={mapsUrl}
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

// --- ESTILOS ---
const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '40px', fontFamily: "'Segoe UI', sans-serif" },
  carouselWrapper: { position: 'relative', width: '100%', height: '280px', backgroundColor: '#e5e7eb' },
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%', scrollBehavior: 'smooth' },
  carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
  headerImage: { width: '100%', height: '100%', objectFit: 'cover' },
  floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, color: '#333' },
  statusBadgeOverlay: { position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' },
  imageCounter: { position: 'absolute', bottom: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none' },
  contentBody: { padding: '0 20px', position: 'relative', zIndex: 2, marginTop: '-30px' },
  titleSection: { marginBottom: '15px' },
  devTitle: { fontSize: '2.2rem', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', lineHeight: '1' },
  locationRow: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: '600', fontSize: '1rem', marginBottom: '5px' },
  addressText: { color: '#6b7280', fontSize: '0.9rem', margin: 0 },
  mediaButtonsContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  mediaButton: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#eff6ff', color: 'var(--secondary-color)', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background 0.2s' },
  divider: { border: 'none', borderTop: '1px solid #f3f4f6', margin: '25px 0' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '800', marginBottom: '15px', color: '#1f2937' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' },
  amenitiesContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  amenityChip: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', color: '#166534', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #dcfce7' },
  checkIcon: { display: 'flex', alignItems: 'center' },
  modelsSection: { backgroundColor: '#f9fafb', margin: '0 -20px', padding: '30px 20px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' },
  sectionHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
  modelCountBadge: { backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' },
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  modelCard: { display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textDecoration: 'none', transition: 'transform 0.2s', border: '1px solid #f3f4f6' },
  modelImgContainer: { height: '160px', width: '100%', position: 'relative', backgroundColor: '#eee' },
  modelTag: { position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: '600', zIndex: 10 },
  modelInfo: { padding: '15px' },
  modelName: { margin: '0 0 5px 0', color: '#111', fontSize: '1.1rem', fontWeight: '700' },
  modelSpecs: { display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#6b7280', marginBottom: '10px' },
  modelPrice: { fontSize: '1.2rem', fontWeight: '800' },
  locationActionSection: { marginTop: '30px' },
  mapButtonExternal: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '15px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', color: '#374151', fontWeight: '700', textDecoration: 'none', fontSize: '1rem', transition: 'background 0.2s' },
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};