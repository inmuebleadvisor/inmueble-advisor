// src/screens/DetalleModelo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext'; 

// Componentes UI (Modularidad mantenida)
import Carousel from '../components/Carousel';
import CaracteristicasBox from '../components/CaracteristicasBox';
import AmenidadesList from '../components/AmenidadesList';
import FinanciamientoWidget from '../components/FinanciamientoWidget';
import DevelopmentInfoSection from '../components/DevelopmentInfoSection';
import PropertyCard from '../components/PropertyCard';
import FavoriteBtn from '../components/FavoriteBtn';

// Iconos locales para esta vista
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
};

const formatoMoneda = (val) => {
  if (!val) return 'Precio Pendiente';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function DetalleModelo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trackBehavior } = useUser();
  const { loadingCatalog, getModeloById, getDesarrolloById, modelos } = useCatalog();

  const [modelo, setModelo] = useState(null);
  const [desarrollo, setDesarrollo] = useState(null);
  const [modelosHermanos, setModelosHermanos] = useState([]);

  // 1. Carga de Datos desde el Contexto
  useEffect(() => {
    if (loadingCatalog) return;

    const encontrado = getModeloById(id);

    if (encontrado) {
      setModelo(encontrado);
      trackBehavior('view_item', { item_id: id, item_name: encontrado.nombre_modelo });

      // Buscar Desarrollo Padre
      const idDev = encontrado.id_desarrollo || encontrado.desarrollo_id;
      if (idDev) {
        const devData = getDesarrolloById(idDev);
        setDesarrollo(devData);

        // Buscar Hermanos (Cross-selling)
        const hermanos = modelos.filter(m => 
          (m.id_desarrollo === idDev || m.desarrollo_id === idDev) && 
          m.id !== id
        );
        setModelosHermanos(hermanos);
      }
    } else {
      setModelo(null);
    }
    
    window.scrollTo(0, 0);
  }, [id, loadingCatalog, getModeloById, getDesarrolloById, modelos]);

  // 2. Preparar Galería (Adaptador V2)
  const galeriaImagenes = useMemo(() => {
    if (!modelo) return [];
    
    // Si viene del script V2, 'imagenes' es un array limpio.
    // Si no, usamos 'imagen' como fallback.
    const rawImages = modelo.imagenes && modelo.imagenes.length > 0 
        ? modelo.imagenes 
        : [modelo.imagen];

    const items = rawImages.map(url => ({ url, type: 'image' }));

    if (modelo.video) {
        items.unshift({ url: modelo.video, type: 'video' });
    }
    
    return items;
  }, [modelo]);

  // --- RENDERIZADO ---

  if (loadingCatalog) {
    return (
      <div style={styles.centerContainer}>
        <p style={{color: '#666'}}>Cargando detalles...</p>
      </div>
    );
  }

  if (!modelo) {
    return (
      <div style={styles.errorContainer}>
        <h2>Modelo no encontrado</h2>
        <button onClick={() => navigate('/catalogo')} style={styles.backButtonSimple}>
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    // SIN <Layout>: El Router ya lo provee
    <div className="main-content animate-fade-in" style={styles.pageContainer}>
      
      {/* HEADER: Carrusel con Estilo Original */}
      <header style={styles.carouselWrapper}>
        <Carousel items={galeriaImagenes} />

        {/* Botón de regreso flotante (Estilo Original restaurado) */}
        <button onClick={() => navigate(-1)} style={styles.floatingBackButton} aria-label="Volver">
          <Icons.Back />
        </button>
        
        {/* Gradiente inferior para legibilidad */}
        <div style={styles.headerGradient}></div>
      </header>

      <main style={styles.contentBody}>

        {/* 1. TÍTULO Y PRECIO */}
        <div style={styles.titleSectionContainer}> 
            <div style={styles.titleSectionLeft}>
                <h1 style={styles.modelTitle}>Modelo {modelo.nombre_modelo}</h1>
                <div style={styles.priceContainer}>
                    <span style={styles.priceLabel}>Precio desde</span>
                    <span style={styles.priceValue}>{formatoMoneda(modelo.precioNumerico)}</span>
                </div>
            </div>
            
            <div style={styles.favoriteWrapper}>
                <FavoriteBtn modeloId={id} style={styles.favoriteButtonOverride} />
            </div>
        </div>

        {/* 2. CARACTERÍSTICAS (Usando componente modular) */}
        <CaracteristicasBox 
            recamaras={modelo.recamaras}
            banos={modelo.banos}
            m2={modelo.m2}
            niveles={modelo.niveles}
            terreno={modelo.terreno}
        />

        <hr style={styles.divider} />

        {/* 3. DESCRIPCIÓN */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Descripción del Modelo</h3>
          <p style={styles.descriptionText}>
            {modelo.descripcion || "Una excelente opción diseñada pensando en tu comodidad."}
          </p>
          
          <div style={{marginTop: '20px'}}>
             <h4 style={{fontSize: '0.9rem', color: '#6b7280', marginBottom:'10px'}}>Amenidades:</h4>
             {/* Usamos el componente modular para la lista */}
             <AmenidadesList amenidades={modelo.amenidadesDesarrollo || modelo.amenidades} />
          </div>
        </section>

        {/* 4. DESARROLLO PADRE (Reutilización) */}
        {desarrollo && (
            <>
                <hr style={styles.divider} />
                <DevelopmentInfoSection desarrollo={desarrollo} />
            </>
        )}

        {/* 5. FINANCIAMIENTO */}
        <div style={{marginTop: '30px'}}>
            <FinanciamientoWidget precio={modelo.precioNumerico} />
        </div>

        {/* 6. OTROS MODELOS */}
        {modelosHermanos.length > 0 && (
            <section style={styles.modelsSection}>
                <h3 style={styles.sectionTitle}>Otros modelos en este desarrollo</h3>
                <div style={styles.modelsGrid}>
                    {modelosHermanos.map((hermano) => (
                        <PropertyCard 
                            key={hermano.id} 
                            item={hermano} 
                            showDevName={false} 
                        />
                    ))}
                </div>
            </section>
        )}

      </main>
    </div>
  );
}

// --- ESTILOS ORIGINALES RESTAURADOS ---
const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '60px', fontFamily: "'Segoe UI', sans-serif" },
  
  // Header y Carrusel
  carouselWrapper: { position: 'relative', width: '100%', height: '320px', backgroundColor: '#e5e7eb' },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none', zIndex: 5 },
  floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, color: '#333' },
  
  // Cuerpo
  contentBody: { padding: '0 20px', position: 'relative', zIndex: 6, marginTop: '-20px' },
  
  // Título y Precio
  titleSectionContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  titleSectionLeft: { flex: 1 },
  modelTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0 0 5px 0', lineHeight: '1.1' },
  priceContainer: { display: 'flex', flexDirection: 'column' },
  priceLabel: { fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' },
  priceValue: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' },
  
  favoriteWrapper: { flexShrink: 0, marginLeft: '15px' },
  favoriteButtonOverride: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  
  // Secciones Generales
  divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#111' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' },
  
  // Modelos Relacionados
  modelsSection: { backgroundColor: '#f9fafb', margin: '30px -20px 0', padding: '30px 20px', borderTop: '1px solid #e5e7eb' },
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' },
  
  // Estados de carga/error
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' },
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' },
  backButtonSimple: { marginTop: '20px', padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};