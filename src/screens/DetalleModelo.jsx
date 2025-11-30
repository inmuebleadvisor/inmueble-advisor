// src/screens/DetalleModelo.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerDatosUnificados } from '../services/catalog.service'; // ✅ Importamos el servicio asíncrono
import ImageLoader from '../components/ImageLoader';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Bed: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>,
  Bath: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-3 0C4 4 4 4.5 9 6Zm0 0c5 0 8 4 12 6v4a8 8 0 0 1-16 0v-4c0-2 3-6 8-6Z"/><line x1="9" y1="6" x2="9" y2="2"/></svg>,
  Ruler: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>,
  Building: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line></svg>,
  Map: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
};

export default function DetalleModelo() {
  const { id } = useParams();
  const { trackBehavior } = useUser();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // --- ESTADOS ---
  const [modelo, setModelo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. Carga de Datos (Efecto Asíncrono)
  useEffect(() => {
    const cargarModelo = async () => {
      setLoading(true);
      try {
        // Obtenemos todos los modelos (usando caché del servicio)
        const todosLosModelos = await obtenerDatosUnificados();
        const encontrado = todosLosModelos.find(m => m.id === id);
        
        setModelo(encontrado || null);
        
        if (encontrado) {
          trackBehavior('view_item', { item_id: id, item_name: encontrado.nombre_modelo });
        }
      } catch (error) {
        console.error("Error al cargar modelo:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarModelo();
    window.scrollTo(0, 0);
  }, [id]); // trackBehavior omitido de dependencias por ser estable

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
  if (loading) {
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
        <p>Es posible que la propiedad ya no esté disponible.</p>
        <button onClick={() => navigate(-1)} style={styles.backButtonSimple}>Volver</button>
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---
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

        <div style={styles.titleSection}>
          <h1 style={styles.modelTitle}>Modelo {modelo.nombre_modelo}</h1>
          <div style={styles.priceContainer}>
            <span style={styles.priceLabel}>Precio desde</span>
            <span style={styles.priceValue}>{formatoMoneda(modelo.precioNumerico)}</span>
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

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Descripción</h3>
          <p style={styles.descriptionText}>
            {modelo.descripcion || "Una excelente opción para tu familia."}
          </p>
          {modelo.extras?.amenidades_modelo && (
            <div style={styles.amenitiesTagContainer}>
              {modelo.extras.amenidades_modelo.split(',').map((am, i) => (
                <span key={i} style={styles.amenityTag}>✨ {am.trim()}</span>
              ))}
            </div>
          )}
        </section>

        {modelo.nombreDesarrollo && (
          <div style={styles.developmentCard}>
            <div style={styles.devCardHeader}>
               <div style={styles.devThumbnailWrapper}><Icons.Building /></div>
               <div style={{flex: 1}}>
                 <span style={styles.devCardLabel}>Ubicado en:</span>
                 <h3 style={styles.devCardTitle}>{modelo.nombreDesarrollo}</h3>
                 <span style={styles.devStatusBadge}>{modelo.esPreventa ? 'Pre-Venta' : 'Entrega Inmediata'}</span>
               </div>
            </div>
            <p style={styles.devDescription}>Ubicado en la zona {modelo.zona}.</p>
            <div style={styles.devLinkContainer}>
              <span style={styles.devLinkText}>Ver desarrollo completo &rarr;</span>
            </div>
            <Link to={`/desarrollo/${String(modelo.id_desarrollo || modelo.desarrollo_id).trim()}`} style={styles.cardLinkOverlay} />
          </div>
        )}

      </main>

      <footer style={styles.stickyFooter}>
        <div style={styles.footerButtonGrid}>
          <Link to="/mapa" style={styles.btnSecondary}><Icons.Map /> Mapa</Link>
          <Link to={`/desarrollo/${String(modelo.id_desarrollo || modelo.desarrollo_id).trim()}`} style={styles.btnPrimary}>Ver Desarrollo</Link>
        </div>
      </footer>
    </div>
  );
}

// --- ESTILOS ---
const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '100px', fontFamily: "'Segoe UI', sans-serif" },
  carouselWrapper: { position: 'relative', width: '100%', height: '320px', backgroundColor: '#e5e7eb' },
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%', scrollBehavior: 'smooth' },
  carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
  headerImage: { width: '100%', height: '100%', objectFit: 'cover' },
  imageCounter: { position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none' },
  floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, color: '#333' },
  contentBody: { padding: '0 20px', position: 'relative', zIndex: 2, marginTop: '-20px' },
  titleSection: { marginBottom: '15px' }, 
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
  divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '25px 0' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#111' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' },
  amenitiesTagContainer: { marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' },
  amenityTag: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  developmentCard: { position: 'relative', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '15px', marginTop: '10px', transition: 'transform 0.2s' },
  devCardHeader: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' },
  devThumbnailWrapper: { width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', flexShrink: 0, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' },
  devCardLabel: { fontSize: '0.7rem', color: '#64748b', fontWeight: '600', display: 'block' },
  devCardTitle: { margin: '0 0 2px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' },
  devStatusBadge: { display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '700' },
  devDescription: { fontSize: '0.85rem', color: '#475569', marginBottom: '12px', lineHeight: '1.4' },
  devLinkContainer: { textAlign: 'right' },
  devLinkText: { fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-color)' },
  cardLinkOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 },
  stickyFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '15px 20px', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)', zIndex: 100 },
  footerButtonGrid: { display: 'flex', gap: '12px', maxWidth: '800px', margin: '0 auto' },
  btnSecondary: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '12px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' },
  btnPrimary: { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};