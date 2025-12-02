// src/screens/DetalleModelo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
// Importamos el hook del catálogo para obtener datos relacionales (Modelo -> Desarrollo)
import { useCatalog } from '../context/CatalogContext'; 

// Componentes UI
import ImageLoader from '../components/ImageLoader';
import FavoriteBtn from '../components/FavoriteBtn'; // Botón grande para el header
import PropertyCard from '../components/PropertyCard'; // Para la lista de hermanos
import DevelopmentInfoSection from '../components/DevelopmentInfoSection'; // Info del desarrollo

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Bed: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>,
  Bath: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-3 0C4 4 4 4.5 9 6Zm0 0c5 0 8 4 12 6v4a8 8 0 0 1-16 0v-4c0-2 3-6 8-6Z"/><line x1="9" y1="6" x2="9" y2="2"/></svg>,
  Ruler: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
};

export default function DetalleModelo() {
  const { id } = useParams();
  const { trackBehavior } = useUser();
  // Obtenemos helpers del contexto para armar la relación de datos
  const { loadingCatalog, getModeloById, getDesarrolloById, modelos } = useCatalog();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // --- ESTADOS ---
  const [modelo, setModelo] = useState(null);
  const [desarrolloPadre, setDesarrolloPadre] = useState(null);
  const [modelosHermanos, setModelosHermanos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. Carga de Datos Relacionales
  useEffect(() => {
    if (!loadingCatalog) {
        // A. Buscar el modelo actual
        const encontrado = getModeloById(id);
        
        if (encontrado) {
          setModelo(encontrado);
          trackBehavior('view_item', { item_id: id, item_name: encontrado.nombre_modelo });

          // B. Buscar el desarrollo al que pertenece
          const idDev = encontrado.id_desarrollo || encontrado.desarrollo_id;
          if (idDev) {
            const devData = getDesarrolloById(idDev);
            setDesarrolloPadre(devData);

            // C. Buscar "hermanos" (otros modelos del mismo desarrollo)
            const hermanos = modelos.filter(m => 
                (m.id_desarrollo === idDev || m.desarrollo_id === idDev) && 
                m.id !== id // Excluir el actual
            );
            setModelosHermanos(hermanos);
          }
        } else {
          setModelo(null);
        }
    }
    
    window.scrollTo(0, 0);

  // ✅ CORRECCIÓN AQUÍ: Cambiamos 'models' por 'modelos'
  }, [id, loadingCatalog, getModeloById, getDesarrolloById, modelos]); 

  // Helpers de Galería
  const galeriaImagenes = modelo?.imagenes || [];

  const scrollToImage = (index) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      setActiveIndex(index);
    }
  };

  const formatoMoneda = (val) => {
    if (!val) return 'Pendiente';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };

  // --- RENDERIZADO DE CARGA ---
  if (loadingCatalog) {
    return (
      <div className="main-content" style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando detalles...</p>
      </div>
    );
  }

  // --- RENDERIZADO DE ERROR ---
  if (!modelo) {
    return (
      <div style={styles.errorContainer}>
        <h2>Modelo no encontrado</h2>
        <button onClick={() => navigate(-1)} style={styles.backButtonSimple}>Volver</button>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in" style={styles.pageContainer}>
      
      {/* HEADER: Carrusel del Modelo */}
      <header style={styles.carouselWrapper}>
        <div 
          ref={scrollRef}
          style={styles.carouselContainer} 
          className="hide-scrollbar"
          onScroll={handleScroll}
        >
          {galeriaImagenes.map((img, idx) => (
            <div key={idx} style={styles.carouselSlide}>
              <ImageLoader src={img} alt={`Vista ${idx}`} style={styles.headerImage} />
            </div>
          ))}
        </div>

        <button onClick={() => navigate(-1)} style={styles.floatingBackButton} aria-label="Volver">
          <Icons.Back />
        </button>
        
        <div style={styles.imageCounter}>
          {activeIndex + 1} / {galeriaImagenes.length}
        </div>

        <div style={styles.headerGradient}></div>
      </header>

      <main style={styles.contentBody}>

        {/* 1. INFORMACIÓN PRINCIPAL DEL MODELO */}
        <div style={styles.titleSectionContainer}> 
            <div style={styles.titleSectionLeft}>
                <h1 style={styles.modelTitle}>Modelo {modelo.nombre_modelo}</h1>
                <div style={styles.priceContainer}>
                    <span style={styles.priceLabel}>Precio desde</span>
                    <span style={styles.priceValue}>{formatoMoneda(modelo.precioNumerico)}</span>
                </div>
            </div>
            
            <div style={styles.favoriteWrapper}>
                {/* Usamos el botón grande específico para el header */}
                <FavoriteBtn modeloId={id} style={styles.favoriteButtonOverride} />
            </div>
        </div>

        {/* Tira de Miniaturas */}
        {galeriaImagenes.length > 1 && (
          <div style={styles.galleryStrip}>
            {galeriaImagenes.map((img, index) => (
              <button 
                key={index} 
                onClick={() => scrollToImage(index)}
                style={{
                  ...styles.galleryThumbBtn,
                  borderColor: activeIndex === index ? 'var(--primary-color)' : 'transparent',
                  opacity: activeIndex === index ? 1 : 0.6,
                  transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <ImageLoader src={img} alt={`Thumb ${index}`} style={styles.galleryThumbImg} />
              </button>
            ))}
          </div>
        )}

        {/* Especificaciones Técnicas */}
        <div style={styles.techSpecsGrid}>
          <div style={styles.specItem}>
            <div style={styles.iconBox}><Icons.Bed /></div>
            <span style={styles.specValue}>{modelo.recamaras}</span>
            <span style={styles.specLabel}>Rec.</span>
          </div>
          <div style={styles.specItem}>
            <div style={styles.iconBox}><Icons.Bath /></div>
            <span style={styles.specValue}>{modelo.banos}</span>
            <span style={styles.specLabel}>Baños</span>
          </div>
          <div style={styles.specItem}>
            <div style={styles.iconBox}><Icons.Ruler /></div>
            <span style={styles.specValue}>{modelo.m2} m²</span>
            <span style={styles.specLabel}>Const.</span>
          </div>
        </div>

        <hr style={styles.divider} />

        {/* Descripción del Modelo Específico */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Descripción del Modelo</h3>
          <p style={styles.descriptionText}>
            {modelo.descripcion || "Una excelente opción diseñada pensando en tu comodidad."}
          </p>
          {/* Amenidades propias del modelo (si las tiene) */}
          {Array.isArray(modelo.amenidades) && modelo.amenidades.length > 0 && (
            <div style={styles.amenitiesTagContainer}>
              {modelo.amenidades.map((am, i) => (
                <span key={i} style={styles.amenityTag}>✨ {am.trim()}</span> 
              ))}
            </div>
          )}
        </section>

        {/* 2. CONTEXTO DEL DESARROLLO (Unificado) */}
        {desarrolloPadre && (
            <>
                <hr style={styles.divider} />
                {/* Inyectamos el componente compartido */}
                <DevelopmentInfoSection desarrollo={desarrolloPadre} />
            </>
        )}

        {/* 3. OTROS MODELOS (Cross-Selling) */}
        {modelosHermanos.length > 0 && (
            <section style={styles.modelsSection}>
                <h3 style={styles.sectionTitle}>Otros modelos en este desarrollo</h3>
                <div style={styles.modelsGrid}>
                    {modelosHermanos.map((hermano) => (
                        <PropertyCard 
                            key={hermano.id} 
                            item={hermano} 
                            showDevName={false} // Ya sabemos dónde estamos
                        />
                    ))}
                </div>
            </section>
        )}

      </main>
    </div>
  );
}

// --- ESTILOS ---
const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '60px', fontFamily: "'Segoe UI', sans-serif" },
  carouselWrapper: { position: 'relative', width: '100%', height: '320px', backgroundColor: '#e5e7eb' },
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%', scrollBehavior: 'smooth' },
  carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
  headerImage: { width: '100%', height: '100%', objectFit: 'cover' },
  imageCounter: { position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none' },
  floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, color: '#333' },
  
  titleSectionContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  titleSectionLeft: { flex: 1 },
  favoriteWrapper: { flexShrink: 0, marginLeft: '15px' },
  favoriteButtonOverride: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  
  contentBody: { padding: '0 20px', position: 'relative', zIndex: 2, marginTop: '-20px' },
  modelTitle: { fontSize: '2rem', fontWeight: '800', color: '#111827', margin: '0 0 5px 0', lineHeight: '1.1' },
  priceContainer: { display: 'flex', flexDirection: 'column' },
  priceLabel: { fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' },
  priceValue: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-color)' },
  
  galleryStrip: { display: 'flex', gap: '10px', overflowX: 'auto', padding: '5px 0 15px 0', scrollbarWidth: 'none', marginBottom: '20px' },
  galleryThumbBtn: { flexShrink: 0, width: '70px', height: '70px', borderRadius: '12px', border: '2px solid', padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#eee' },
  galleryThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  
  techSpecsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' },
  specItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '12px' },
  iconBox: { color: '#6b7280', marginBottom: '5px' },
  specValue: { fontWeight: '700', color: '#1f2937', fontSize: '1.1rem' },
  specLabel: { fontSize: '0.75rem', color: '#6b7280' },
  
  divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#111' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' },
  
  amenitiesTagContainer: { marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' },
  amenityTag: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },

  // Estilos para la sección de hermanos (similar a DetalleDesarrollo)
  modelsSection: { backgroundColor: '#f9fafb', margin: '30px -20px 0', padding: '30px 20px', borderTop: '1px solid #e5e7eb' },
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' },
  
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};