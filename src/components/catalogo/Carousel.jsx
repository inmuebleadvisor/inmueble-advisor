// src/components/Carousel.jsx
// src/components/Carousel.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useRef } from 'react';
import ImageLoader from '../shared/ImageLoader';
import Delightbox from '../common/Delightbox'; // Import Delightbox

const Icons = {
  Play: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(0,0,0,0.5)" stroke="white" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
};

export default function Carousel({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  // delightbox state
  const [showDelightbox, setShowDelightbox] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      setActiveIndex(index);
    }
  };

  if (items.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <div
        ref={scrollRef}
        style={styles.scrollContainer}
        onScroll={handleScroll}
        className="hide-scrollbar"
      >
        {items.map((item, idx) => {
          // ✅ OPTIMIZACIÓN CRÍTICA: ESTRATEGIA DE RENDERIZADO
          // Solo renderizamos la imagen si es la actual, la anterior o la siguiente.
          // Para las demás, dejamos un div vacío del mismo tamaño.
          // Esto evita descargar 20 imágenes de golpe.
          const shouldRender = Math.abs(activeIndex - idx) <= 1;
          const itemType = item.type || 'image'; // Ensure type exists

          return (
            <div key={idx} style={styles.slide}>
              {shouldRender ? (
                itemType === 'video' ? (
                  <div style={styles.videoPlaceholder}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={styles.videoLink}>
                      <Icons.Play /> Ver Video
                    </a>
                  </div>
                ) : (
                  <div
                    style={{ width: '100%', height: '100%', cursor: 'zoom-in' }}
                    onClick={() => {
                      setShowDelightbox(true);
                      setInitialImageIndex(idx);
                    }}
                  >
                    <ImageLoader
                      src={item.url}
                      alt={`Slide ${idx}`}
                      style={styles.image}
                      // Solo la primera imagen es prioritaria
                      priority={idx === 0}
                    />
                  </div>
                )
              ) : null}
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div style={styles.counter}>
          {activeIndex + 1} / {items.length}
        </div>
      )}

      {/* DELIGHTBOX INTEGRATION */}
      {showDelightbox && (
        <Delightbox
          isOpen={showDelightbox}
          images={items}
          initialIndex={initialImageIndex}
          onClose={() => setShowDelightbox(false)}
        />
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', width: '100%', height: '100%' },
  scrollContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%', scrollBehavior: 'smooth' },
  slide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative', backgroundColor: '#e5e7eb' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  counter: { position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 },
  videoPlaceholder: { width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  videoLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', textDecoration: 'none', fontWeight: 'bold' }
};