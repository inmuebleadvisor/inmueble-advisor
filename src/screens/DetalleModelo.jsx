// src/screens/DetalleModelo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext'; 

// Componentes UI
import Carousel from '../components/Carousel';
import CaracteristicasBox from '../components/CaracteristicasBox';
import AmenidadesList from '../components/AmenidadesList';
import FinanciamientoWidget from '../components/FinanciamientoWidget';
import DevelopmentInfoSection from '../components/DevelopmentInfoSection';
import PropertyCard from '../components/PropertyCard';
import FavoriteBtn from '../components/FavoriteBtn';

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
};

const formatoMoneda = (val) => {
  if (!val || isNaN(val)) return 'Precio Pendiente';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function DetalleModelo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trackBehavior } = useUser();
  const { loadingCatalog, getModeloById, getDesarrolloById, modelos } = useCatalog();

  // Estados de datos
  const [modelo, setModelo] = useState(null);
  const [desarrollo, setDesarrollo] = useState(null);
  const [modelosHermanos, setModelosHermanos] = useState([]);

  // -----------------------------------------------------------------------
  // 1. EFECTO PRINCIPAL: CARGA Y VINCULACIÓN DE DATOS
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (loadingCatalog) return;

    // A. Buscar el modelo actual
    const modeloEncontrado = getModeloById(id);

    if (modeloEncontrado) {
      setModelo(modeloEncontrado);
      trackBehavior('view_item', { item_id: id, item_name: modeloEncontrado.nombre_modelo });

      // B. Buscar al Desarrollo Padre (Vinculación)
      // Normalizamos: buscamos en todas las variantes posibles de nombre de campo (camelCase o snake_case)
      const idDevRaw = modeloEncontrado.idDesarrollo || modeloEncontrado.id_desarrollo || modeloEncontrado.desarrollo_id;
      
      // Convertimos a String y limpiamos espacios para asegurar match exacto en la DB
      const idPadreString = idDevRaw ? String(idDevRaw).trim() : null;

      if (idPadreString) {
        // Intentamos obtener el objeto del desarrollo
        const devData = getDesarrolloById(idPadreString);
        
        // --- GUARDIA DE SEGURIDAD (BUG FIX) ---
        // Verificamos que devData exista Y que su ID no sea igual al del modelo.
        // Esto evita que si los IDs están mal en la DB, mostremos el modelo como su propio padre.
        if (devData && String(devData.id) !== String(modeloEncontrado.id)) {
            setDesarrollo(devData);
            console.log("✅ Desarrollo Padre Vinculado:", devData.nombre);
        } else {
            setDesarrollo(null); // Aseguramos limpieza si no hay padre válido
            if(devData) console.warn("⚠️ Detectada referencia circular: El modelo se apunta a sí mismo como desarrollo.");
        }

        // C. Cross-Selling (Hermanos)
        const hermanos = modelos.filter(m => {
             const mIdDev = String(m.idDesarrollo || m.id_desarrollo || '').trim();
             // Coincide el padre Y NO es el modelo actual
             return mIdDev === idPadreString && String(m.id) !== String(id);
        });
        setModelosHermanos(hermanos);
      } else {
          // Si no hay ID de padre, limpiamos estados
          setDesarrollo(null);
          setModelosHermanos([]);
      }
    } else {
      setModelo(null);
    }
    
    window.scrollTo(0, 0);
  }, [id, loadingCatalog, getModeloById, getDesarrolloById, modelos]);

  // -----------------------------------------------------------------------
  // 2. MEMOIZACIÓN DE GALERÍA
  // -----------------------------------------------------------------------
  const galeriaImagenes = useMemo(() => {
    if (!modelo) return [];
    const items = (modelo.imagenes || []).map(url => ({ url, type: 'image' }));
    // Video tiene prioridad
    if (modelo.media?.videoPromocional || modelo.video) {
        const vid = modelo.media?.videoPromocional || modelo.video;
        items.unshift({ url: vid, type: 'video' });
    }
    return items;
  }, [modelo]);

  if (loadingCatalog) return <div style={styles.centerContainer}><p>Cargando catálogo...</p></div>;
  if (!modelo) return <div style={styles.errorContainer}><h2>Propiedad no disponible</h2></div>;
// DEBUG TEMPORAL: Pega esto antes del return de DetalleModelo
console.group("🕵️‍♂️ DIAGNÓSTICO INMUEBLE ADVISOR");
console.log("ID Modelo Actual:", id);
console.log("ID Padre en el objeto (Raw):", modelo?.idDesarrollo || modelo?.id_desarrollo);
console.log("Objeto Desarrollo encontrado:", desarrollo);
if (desarrollo && modelo && desarrollo.id === modelo.id) {
    console.error("🚨 ERROR CRÍTICO: El Desarrollo y el Modelo son EL MISMO OBJETO. getDesarrolloById está fallando.");
}
console.groupEnd();
  return (
    <div className="main-content" style={styles.pageContainer}>
      
      {/* --- HEADER: CARRUSEL --- */}
      <header style={styles.carouselWrapper}>
        <Carousel items={galeriaImagenes} />
        <button onClick={() => navigate(-1)} style={styles.floatingBackButton} aria-label="Volver">
          <Icons.Back />
        </button>
        <span style={{...styles.statusBadge, backgroundColor: modelo.esPreventa ? '#f59e0b' : '#10b981'}}>
            {modelo.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
        </span>
        <div style={styles.headerGradient}></div>
      </header>

      <main style={styles.contentBody}>

        {/* ================================================================== */}
        {/* SECCIÓN 1: DATOS DEL MODELO (Lo que estás comprando)               */}
        {/* ================================================================== */}
        <section style={styles.sectionBlock}>
            <div style={styles.titleSectionContainer}> 
                <div style={styles.titleSectionLeft}>
                    <h1 style={styles.modelTitle}>
                        {modelo.tipoVivienda ? `${modelo.tipoVivienda} ` : ''} 
                        {modelo.nombre_modelo}
                    </h1>
                    <div style={styles.priceContainer}>
                        <span style={styles.priceLabel}>Precio de Lista</span>
                        <span style={styles.priceValue}>{formatoMoneda(modelo.precioNumerico)}</span>
                        {modelo.precios?.mantenimientoMensual > 0 && (
                            <span style={styles.maintenanceLabel}>+ {formatoMoneda(modelo.precios.mantenimientoMensual)} mant. mensual</span>
                        )}
                    </div>
                </div>
                <div style={styles.favoriteWrapper}>
                    <FavoriteBtn modeloId={id} style={styles.favoriteButtonOverride} />
                </div>
            </div>

            <CaracteristicasBox 
                recamaras={modelo.recamaras}
                banos={modelo.banos}
                m2={modelo.m2}
                niveles={modelo.niveles}
                terreno={modelo.terreno}
            />

            <hr style={styles.divider} />

            <h3 style={styles.sectionTitle}>Descripción del Modelo</h3>
            <p style={styles.descriptionText}>
                {modelo.descripcion || `Conoce el modelo ${modelo.nombre_modelo}, diseñado para tu comodidad.`}
            </p>
            {modelo.amenidades && modelo.amenidades.length > 0 && (
                <div style={{marginTop: '20px'}}>
                    <h4 style={{fontSize: '0.9rem', color: '#6b7280', marginBottom:'10px'}}>Amenidades Exclusivas:</h4>
                    <AmenidadesList amenidades={modelo.amenidades} />
                </div>
            )}
        </section>

        {/* ================================================================== */}
        {/* SECCIÓN 2: FINANCIAMIENTO (Separado explícitamente)                */}
        {/* ================================================================== */}
        {/* FIX: Usamos un bloque dedicado con margen top para separarlo visualmente */}
        <section style={{ ...styles.sectionBlock, marginTop: '40px' }}>
            <h3 style={styles.sectionTitle}>Calcula tu Hipoteca</h3>
            <p style={{marginBottom: '15px', color: '#64748b', fontSize: '0.9rem'}}>
                Estimación de mensualidad para <strong>{modelo.nombre_modelo}</strong>:
            </p>
            {/* Renderizado incondicional del widget */}
            <FinanciamientoWidget precio={modelo.precioNumerico} />
        </section>

        {/* ================================================================== */}
        {/* SECCIÓN 3: CONTEXTO DEL DESARROLLO (El Entorno)                    */}
        {/* ================================================================== */}
        {/* FIX: Solo renderizamos si tenemos un objeto 'desarrollo' VÁLIDO (distinto al modelo) */}
        {desarrollo && (
            <section style={{ ...styles.sectionBlock, marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '30px' }}>
                <div style={styles.contextHeader}>
                    <span style={styles.contextLabel}>Ubicado en el desarrollo:</span>
                    <h2 style={styles.contextTitle}>{desarrollo.nombre}</h2>
                </div>
                
                {/* DIDÁCTICO: Aquí pasamos el objeto 'desarrollo' limpio al componente hijo.
                   Como ya validamos arriba que desarrollo.id !== modelo.id, 
                   DevelopmentInfoSection mostrará la info correcta.
                */}
                <DevelopmentInfoSection desarrollo={desarrollo} />
            </section>
        )}

        {/* ================================================================== */}
        {/* SECCIÓN 4: CROSS-SELLING (Otros modelos)                           */}
        {/* ================================================================== */}
        {modelosHermanos.length > 0 && (
            <section style={styles.modelsSection}>
                <h3 style={styles.sectionTitle}>Otras opciones en {desarrollo ? desarrollo.nombre : 'este desarrollo'}</h3>
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

// Estilos
const styles = {
  pageContainer: { backgroundColor: 'white', minHeight: '100vh', paddingBottom: '60px', fontFamily: "'Segoe UI', sans-serif" },
  carouselWrapper: { position: 'relative', width: '100%', height: '320px', backgroundColor: '#e5e7eb' },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none', zIndex: 5 },
  floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, color: '#333' },
  statusBadge: { position: 'absolute', top: '20px', right: '20px', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  contentBody: { padding: '0 20px', position: 'relative', zIndex: 6, marginTop: '-20px' },
  
  // Nuevo: Bloque de sección genérico para mantener orden vertical estricto
  sectionBlock: { marginBottom: '20px', display: 'block' },

  titleSectionContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  titleSectionLeft: { flex: 1 },
  modelTitle: { fontSize: '1.6rem', fontWeight: '800', color: '#111827', margin: '0 0 5px 0', lineHeight: '1.2' },
  priceContainer: { display: 'flex', flexDirection: 'column' },
  priceLabel: { fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' },
  priceValue: { fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' },
  maintenanceLabel: { fontSize: '0.8rem', color: '#64748b', marginTop: '2px' },
  favoriteWrapper: { flexShrink: 0, marginLeft: '15px', marginTop: '5px' },
  favoriteButtonOverride: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#111' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' },
  contextHeader: { marginBottom: '15px', paddingLeft: '10px', borderLeft: '4px solid #0f172a' },
  contextLabel: { fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  contextTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: 0 },
  modelsSection: { backgroundColor: '#f9fafb', margin: '30px -20px 0', padding: '30px 20px', borderTop: '1px solid #e5e7eb' },
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' },
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' },
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151' }
};