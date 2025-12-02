// src/components/ImageLoader.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState } from 'react';

const FALLBACK_ICON = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

export default function ImageLoader({ src, alt, style, className, priority = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div 
      className={className}
      style={{ 
        ...style, 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: '#f3f4f6', // Color más suave
        isolation: 'isolate'
      }} 
    >
      {/* SKELETON: Solo visible mientras carga */}
      {!loaded && (
        <div style={styles.skeleton} />
      )}

      <img
        src={error ? FALLBACK_ICON : src}
        alt={alt}
        // ✅ OPTIMIZACIÓN CRÍTICA:
        // 'async': Permite renderizar el resto de la página mientras decodifica la imagen
        // 'lazy': Solo descarga si está cerca del viewport (a menos que sea priority)
        decoding="async" 
        loading={priority ? "eager" : "lazy"}
        
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0, 
          transition: 'opacity 0.3s ease-in-out', // Transición más rápida
          position: 'absolute',
          top: 0, left: 0,
          zIndex: 2
        }}
      />
    </div>
  );
}

const styles = {
  skeleton: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonLoading 1.5s infinite linear',
    zIndex: 1
  }
};