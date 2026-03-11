import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import '../../../styles/model-details/ModelHeader.css';

/**
 * @component ModelHeader (ahora fungiendo como ModelGallery)
 * @description Componente visual para la galería de imágenes del modelo (Estilo Marketplace).
 * Presenta un contenedor principal (Hero) con aspect ratio, insignias, y miniaturas en desktop.
 * 
 * RESPONSABILIDAD: Mostrar las imágenes provistas. NO maneja resolución de
 * qué imagen mostrar, eso lo hace el ModelPresentationService.
 *
 * @param {Array}    galeriaItems - Arreglo de URLs de imágenes o videos
 * @param {boolean}  esPreventa   - Determina si se muestra insignia de preventa
 * @param {boolean}  isModal      - Modifica si mostramos botón de regresar
 * @param {Function} onBack       - Callback para regresar en navegación
 */
export default function ModelHeader({ galeriaItems = [], esPreventa, isModal, onBack }) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!galeriaItems || galeriaItems.length === 0) return null;

    const mainMedia = galeriaItems[activeIndex];
    
    // Helper preventivo para extraer URL ya sea de string o objeto Firestore
    const getMediaUrl = (media) => {
        if (!media) return '';
        if (typeof media === 'string') return media;
        return media.url || media.src || media.downloadURL || media.fileUrl || '';
    };
    
    const mainMediaUrl = getMediaUrl(mainMedia);

    // Mostramos máximo 4 miniaturas, la 4ta podría ser "+X fotos"
    const maxThumbnails = 4;
    const arrayCount = galeriaItems.length;
    const showMoreThumb = arrayCount > maxThumbnails;
    const visibleThumbs = showMoreThumb ? galeriaItems.slice(0, 3) : galeriaItems;
    const remainingCount = arrayCount - 3;

    return (
        <div className={`model-gallery ${(!isModal && onBack) ? 'model-gallery--with-backbtn' : ''}`}>
            
            {/* ── BOTÓN VOLVER (Condicional) ── */}
            {(!isModal && onBack) && (
                <button
                    onClick={onBack}
                    className="model-gallery__back-btn"
                    aria-label="Volver atrás"
                >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
            )}

            {/* ── STAGE (Visor Principal) ── */}
            <div className="model-gallery__stage">
                
                {/* 1. Imagen Actual */}
                {mainMediaUrl.includes('.mp4') ? (
                    <video
                        src={mainMediaUrl}
                        className="model-gallery__image"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                ) : (
                    <img
                        src={mainMediaUrl}
                        alt="Vista de la propiedad"
                        className="model-gallery__image"
                    />
                )}

                {/* 2. Degradado Inferior (Solo móvil p/ no chocar con textos si hubiera) */}
                <div className="model-gallery__overlay" />

                {/* 3. Badges Superiores */}
                <div className="model-gallery__badges-layer">
                    <span className="model-gallery__badge">Disponible</span>
                    {esPreventa && (
                        <span className="model-gallery__badge model-gallery__badge--preventa">Preventa</span>
                    )}
                </div>

                {/* 4. Contador de Fotos */}
                <div className="model-gallery__counter">
                    {activeIndex + 1} / {arrayCount} FOTOS
                </div>
            </div>

            {/* ── MINIATURAS (Visibles en Desktop) ── */}
            {arrayCount > 1 && (
                <div className="model-gallery__thumbnails">
                    {visibleThumbs.map((item, index) => (
                        <div 
                            key={`thumb-${index}`}
                            className={`model-gallery__thumb ${index === activeIndex ? 'model-gallery__thumb--active' : ''}`}
                            onClick={() => setActiveIndex(index)}
                        >
                            {/* Simplificación: mostramos img miniatura. Si es vd, mostramos poster o ignora */}
                            {getMediaUrl(item).includes('.mp4') ? (
                                <video src={getMediaUrl(item)} className="model-gallery__thumb-img" muted />
                            ) : (
                                <img src={getMediaUrl(item)} alt={`Thumbnail ${index + 1}`} className="model-gallery__thumb-img" />
                            )}
                        </div>
                    ))}
                    
                    {/* Botón de "Ver Más" */}
                    {showMoreThumb && (
                        <div 
                            className="model-gallery__thumb-more"
                            onClick={() => setActiveIndex(3)} /* Demo: pasa a la 4ta img */
                        >
                            +{remainingCount}
                        </div>
                    )}
                </div>
            )}
            
        </div>
    );
}
