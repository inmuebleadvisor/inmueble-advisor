// src/components/PropertyCard.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import ImageLoader from './ImageLoader';
import FavoriteBtn from './FavoriteBtn';
import { FINANZAS } from '../config/constants';

// --- ICONOS LOCALES ---
const Icons = {
  Pin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
};

// --- HELPERS ---
const formatoMoneda = (val) => {
  if (!val) return "$0";
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

const calcularEscrituracion = (precio) => formatoMoneda(precio * FINANZAS.PORCENTAJE_GASTOS_NOTARIALES);

export default function PropertyCard({ item, showDevName = true, style }) {
  const { trackBehavior } = useUser();

  // Validación básica para evitar errores si el objeto viene incompleto
  if (!item) return null;

  // ✅ CAMBIO V2: Las imágenes ya vienen listas del servicio (media.gallery)
  // item.imagenes ahora es el array de galería. item.imagen es la portada.
  const imagenes = item.imagenes && item.imagenes.length > 0 ? item.imagenes : [item.imagen];

  // Didáctica: Si el array 'imagenes' está vacío (por si catalog.service.js falló), 
  // aseguramos que al menos se use la portada para mostrar algo.
  // ¡El servicio ahora garantiza que esto funcione con la nueva estructura 'media'!

  return (
    <article style={{...styles.card, ...style}}>
      
      {/* 1. HEADER & CARRUSEL */}
      <div style={styles.carouselContainer} className="hide-scrollbar">
         {imagenes.map((imgSrc, idx) => (
           <div key={idx} style={styles.carouselSlide}>
              <ImageLoader 
                src={imgSrc} 
                alt={`${item.nombre_modelo || item.nombre} - vista ${idx}`} 
                style={styles.image} 
              />
              {/* Hint de "más fotos" solo en la primera */}
              {idx === 0 && imagenes.length > 1 && (
                 <div style={styles.swipeHint}>+{imagenes.length - 1}</div>
              )}
           </div>
         ))}

         {/* Etiquetas Flotantes */}
         <span style={{
           ...styles.statusTag,
           backgroundColor: item.esPreventa ? '#f59e0b' : '#10b981'
         }}>
           {item.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
         </span>
         
         {/* ⭐ BOTÓN DE FAVORITOS INTEGRADO */}
         <div style={styles.favoriteBtnWrapper}>
            <FavoriteBtn modeloId={item.id} />
         </div>

         {/* Overlay Informativo (Solo si showDevName es true) */}
         {showDevName && (
           <div style={styles.imageOverlay}>
             <h3 style={styles.overlayDevName}>{item.nombreDesarrollo}</h3>
             <p style={styles.overlayModelName}>
                {item.constructora ? `${item.constructora} • ` : ''} {item.nombre_modelo || item.nombre}
             </p>
           </div>
         )}
      </div>

      {/* 2. CUERPO DE LA TARJETA */}
      <div style={styles.cardBody}>
         
         {/* Título Principal (Si no mostramos DevName arriba, mostramos el modelo aquí con más fuerza) */}
         {!showDevName && (
            <h3 style={styles.inlineTitle}>{item.nombre_modelo}</h3>
         )}

         {/* Ubicación */}
         <div style={styles.locationRow}>
           <span style={{marginRight: '4px', display:'flex'}}><Icons.Pin /></span> 
           {item.colonia ? `${item.colonia}, ` : ''}{item.zona || item.ciudad}
         </div>

         {/* Características */}
         <div style={styles.featuresRow}>
           <span style={styles.featureItem}>🛏 {item.recamaras || 0} Rec.</span>
           <span style={styles.separator}>|</span>
           <span style={styles.featureItem}>🚿 {item.banos || 0} Baños</span>
           <span style={styles.separator}>|</span>
           <span style={styles.featureItem}>📐 {item.m2 || 0} m²</span>
         </div>

         {/* Precio */}
         <div style={styles.priceBox}>
           <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={styles.priceLabel}>PRECIO DE LISTA</span>
           </div>
           <div style={{
              ...styles.priceValue,
              color: item.precioNumerico > 0 ? '#1e293b' : '#64748b',
              fontSize: item.precioNumerico > 0 ? '1.5rem' : '1.2rem'
           }}>
             {item.precioNumerico > 0 ? formatoMoneda(item.precioNumerico) : "Pendiente"}
           </div>
           {item.precioNumerico > 0 && (
             <div style={styles.priceNote}>
               *Escrituración aprox: {calcularEscrituracion(item.precioNumerico)}
             </div>
           )}
         </div>

         {/* Botón de Acción */}
         <Link 
           to={`/modelo/${item.id}`} 
           style={styles.detailsButton}
           onClick={() => trackBehavior('select_property', { id: item.id, origin: 'card' })}
         >
           Ver Detalles Completos
         </Link>
      </div>
    </article>
  );
}

// --- ESTILOS DE LA TARJETA (Self-contained) ---
const styles = {
  card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #f1f5f9', transition: 'transform 0.2s', height: '100%' }, 
  
  // Didáctica: ScrollSnap en el contenedor permite el carrusel horizontal con el ratón/dedo
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '220px', position: 'relative', backgroundColor: '#e5e7eb' },
  carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  swipeHint: { position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10 },

  statusTag: { position: 'absolute', top: '12px', right: '12px', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 10 },
  favoriteBtnWrapper: { position: 'absolute', top: '50px', right: '12px', zIndex: 11 },
  
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '40px 16px 12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 10 }, 
  overlayDevName: { color: 'white', fontSize: '1.2rem', fontWeight: '700', margin: 0, lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  overlayModelName: { color: '#e5e7eb', fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: '500' },
  
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  inlineTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' },
  locationRow: { color: '#6b7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center' },
  featuresRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '500', marginTop: 'auto' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  separator: { color: '#d1d5db', fontSize: '1.2rem', fontWeight: '300' },
  
  priceBox: { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '12px', marginTop: '5px', border: '1px solid #dbeafe' },
  priceLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' },
  priceValue: { fontWeight: '800', margin: '2px 0' },
  priceNote: { fontSize: '0.75rem', color: '#64748b', marginTop: '2px' },
  
  detailsButton: { backgroundColor: '#0f172a', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '5px' },
};