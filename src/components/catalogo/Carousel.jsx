// src/components/Carousel.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useRef } from 'react';
import ImageLoader from '../ui/ImageLoader';
import Delightbox from '../ui/Delightbox'; // Import Delightbox
import './Carousel.css';

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
    <div className="carousel">
      <div
        ref={scrollRef}
        className="carousel__scroll-container hide-scrollbar"
        onScroll={handleScroll}
      >
        {items.map((item, idx) => {
          // ✅ OPTIMIZACIÓN CRÍTICA: ESTRATEGIA DE RENDERIZADO
          // Solo renderizamos la imagen si es la actual, la anterior o la siguiente.
          // Para las demás, dejamos un div vacío del mismo tamaño.
          // Esto evita descargar 20 imágenes de golpe.
          const shouldRender = Math.abs(activeIndex - idx) <= 1;
          const itemType = item.type || 'image'; // Ensure type exists

          return (
            <div key={idx} className="carousel__slide">
              {shouldRender ? (
                itemType === 'video' ? (
                  <div className="carousel__video-placeholder">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="carousel__video-link">
                      <Icons.Play /> Ver Video
                    </a>
                  </div>
                ) : (
                  <div
                    className="carousel__slide-content"
                    onClick={() => {
                      setShowDelightbox(true);
                      setInitialImageIndex(idx);
                    }}
                  >
                    <ImageLoader
                      src={item.url}
                      alt={`Slide ${idx}`}
                      className="carousel__image"
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
        <div className="carousel__counter">
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
