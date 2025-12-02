// src/screens/DetalleDesarrollo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerInformacionDesarrollo } from '../services/catalog.service'; 
import { useCatalog } from '../context/CatalogContext'; 

// Componentes UI
import ImageLoader from '../components/ImageLoader';
import PropertyCard from '../components/PropertyCard';
import DevelopmentInfoSection from '../components/DevelopmentInfoSection'; // ✅ NUEVO COMPONENTE

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- ICONOS (Solo los necesarios para el Header/Título) ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
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

  // --- ESTADOS ---
  const [desarrollo, setDesarrollo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. CARGA DE DATOS
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

  // 2. GALERÍA HEADER
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

  return (
    <div className="main-content animate-fade-in" style={styles.pageContainer}>
      
      {/* HEADER: Carrusel Principal */}
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
        
        {/* TÍTULO Y UBICACIÓN RÁPIDA */}
        <div style={styles.titleSection}>
          <h1 style={styles.devTitle}>{desarrollo.nombre}</h1>
          <div style={styles.locationRow}>
            <Icons.MapPin />
            <span>{desarrollo.zona || desarrollo.ubicacion?.ciudad}</span>
          </div>
          <p style={styles.addressText}>{direccionCompleta}</p>
        </div>

        <hr style={styles.divider} />

        {/* ✅ BLOQUE UNIFICADO DE INFORMACIÓN (Video, Texto, Amenidades, Mapa) */}
        <DevelopmentInfoSection desarrollo={desarrollo} />

        {/* LISTA DE MODELOS DISPONIBLES */}
        <section style={styles.modelsSection}>
           <div style={styles.sectionHeaderRow}>
             <h3 style={styles.sectionTitle}>Modelos Disponibles</h3>
             <span style={styles.modelCountBadge}>{modelos.length}</span>
           </div>

           <div style={styles.modelsGrid}>
             {modelos.map((modelo) => (
               <PropertyCard 
                 key={modelo.id}
                 item={modelo}
                 showDevName={false} 
               />
             ))}
           </div>

           {modelos.length === 0 && (
             <p style={{color: '#6b7280', fontStyle: 'italic'}}>No hay modelos disponibles por el momento.</p>
           )}
        </section>

      </main>
    </div>
  );
}

// --- ESTILOS LIMPIOS ---
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
  
  divider: { border: 'none', borderTop: '1px solid #f3f4f6', margin: '25px 0' },
  
  // Estilos de la sección de modelos
  modelsSection: { backgroundColor: '#f9fafb', margin: '20px -20px 0', padding: '30px 20px', borderTop: '1px solid #e5e7eb' },
  sectionHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#1f2937' },
  modelCountBadge: { backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' },
  modelsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: '20px'
  },
  
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};