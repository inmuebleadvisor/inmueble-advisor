import React, { useState } from 'react';
import '../../../styles/model-details/ModelFloorPlans.css';
import Delightbox from '../../common/Delightbox';

/**
 * @component ModelFloorPlans (Marketplace Layout)
 * @description Muestra los planos arquitectónicos en una cuadrícula (grid)
 * con tarjetas interactivas de fondo blanco y esquinas redondeadas.
 *
 * @param {Array}  plantas      - Array de objetos { planta_url, nombre_planta }
 * @param {string} nombreModelo - Nombre del modelo para el subtítulo
 */
export default function ModelFloorPlans({ plantas = [], nombreModelo }) {
    // -1 = cerrado; >= 0 = índice activo en Delightbox
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    if (!plantas || plantas.length === 0) return null;

    // FIX BUG 1 & 7: Formateamos los items en el formato que Delightbox espera
    // Delightbox API: { isOpen, images: [{url, type}], initialIndex, onClose }
    const validPlantas = plantas
        .filter(p => p && p.planta_url)
        .map(p => ({
            url: p.planta_url,
            caption: p.nombre_planta || 'Planta arquitectónica',
            type: 'image'
        }));

    if (validPlantas.length === 0) return null;

    const handleOpenLightbox  = (index) => setLightboxIndex(index);
    const handleCloseLightbox = ()      => setLightboxIndex(-1);

    return (
        <div className="model-floor-plans">
            
            <header>
                <h2 className="model-floor-plans__title">Planos Arquitectónicos</h2>
                <p className="model-floor-plans__subtitle">
                    Conoce a detalle la distribución del modelo {nombreModelo}
                </p>
            </header>

            {/* FIX BUG 7: Delightbox fuera del <ul> para que el HTML sea válido */}
            <ul className="model-floor-plans__grid">
                {validPlantas.map((planta, i) => (
                    <li key={`planta-${i}`} className="model-floor-plans__item">
                        
                        <div 
                            className="model-floor-plans__card"
                            onClick={() => handleOpenLightbox(i)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Ver ${planta.caption}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpenLightbox(i);
                                }
                            }}
                        >
                            <div className="model-floor-plans__img-wrapper">
                                <img
                                    src={planta.url}
                                    alt={planta.caption}
                                    className="model-floor-plans__img"
                                    loading="lazy"
                                />
                                <div className="model-floor-plans__overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00396a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        <line x1="11" y1="8" x2="11" y2="14" />
                                        <line x1="8" y1="11" x2="14" y2="11" />
                                    </svg>
                                </div>
                            </div>
                            
                            <span className="model-floor-plans__label">{planta.caption}</span>
                        </div>
                    </li>
                ))}
            </ul>

            {/* FIX BUG 1: Props correctas para Delightbox — isOpen, images, initialIndex */}
            <Delightbox
                isOpen={lightboxIndex >= 0}
                images={validPlantas}
                initialIndex={lightboxIndex >= 0 ? lightboxIndex : 0}
                onClose={handleCloseLightbox}
            />
            
        </div>
    );
}
