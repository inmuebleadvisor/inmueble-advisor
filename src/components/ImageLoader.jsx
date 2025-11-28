import React, { useState } from 'react';

const FALLBACK_ICON = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

export default function ImageLoader({ src, alt, style, className }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div 
      className={className}
      style={{ 
        ...style, 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: '#e5e7eb', // Gris base del skeleton
        isolation: 'isolate' // Crea un nuevo contexto de apilamiento
      }} 
    >
      
      {/* SKELETON: Animación de carga (Solo visible mientras no ha cargado) */}
      {!loaded && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeletonLoading 1.5s infinite linear',
          zIndex: 1
        }}>
           {/* Inyectamos los keyframes aquí para que el componente sea autónomo */}
           <style>{`
             @keyframes skeletonLoading {
               0% { background-position: 200% 0; }
               100% { background-position: -200% 0; }
             }
           `}</style>
        </div>
      )}

      {/* IMAGEN REAL */}
      <img
        src={error ? FALLBACK_ICON : src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Truco de UX: Opacidad 0 al inicio, 1 al cargar. Transition suave.
          opacity: loaded ? 1 : 0, 
          transition: 'opacity 0.5s ease-in-out',
          position: 'absolute',
          top: 0, left: 0,
          zIndex: 2
        }}
        loading="lazy"
      />
    </div>
  );
}