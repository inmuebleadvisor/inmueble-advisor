import React from 'react';
import Delightbox from '../../common/Delightbox';
import '../../../styles/model-details/ModelFloorPlans.css';

// Ícono de lupa (SVG, sin dependencia externa)
const MagnifyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

/**
 * @component ModelFloorPlans
 * @description Cuadrícula de planos arquitectónicos del modelo.
 *
 * Responsabilidades (SRP):
 *  - Renderizar la grilla de thumbnails de planos.
 *  - Gestionar el estado del lightbox (Delightbox) de planos.
 *  - Mostrar overlay de lupa al hacer hover sobre cada plano.
 *
 * Si el modelo no tiene plantas definidas, este componente NO se monta (el
 * Orquestador lo controla con un condicional).
 *
 * @param {string[]} plantas - Arreglo de URLs de imágenes de plantas.
 * @param {string}   nombreModelo - Nombre del modelo (para texto descriptivo).
 */
export default function ModelFloorPlans({ plantas = [], nombreModelo }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);

    const handleOpen = (index) => {
        setActiveIndex(index);
        setIsOpen(true);
    };

    return (
        <section className="model-floor-plans" aria-labelledby="floor-plans-heading">
            <h3 id="floor-plans-heading" className="model-floor-plans__title">
                Distribución y Planos
            </h3>
            <p className="model-floor-plans__subtitle">
                Consulta la distribución arquitectónica de {nombreModelo}.
            </p>

            {/* Cuadrícula de thumbnails */}
            <ul className="model-floor-plans__grid" role="list">
                {plantas.map((url, index) => (
                    <li key={index} className="model-floor-plans__item">
                        <button
                            className="model-floor-plans__card"
                            onClick={() => handleOpen(index)}
                            aria-label={`Ver planta ${index + 1} en tamaño completo`}
                        >
                            <div className="model-floor-plans__img-wrapper">
                                <img
                                    src={url}
                                    alt={`Planta ${index + 1} de ${nombreModelo}`}
                                    className="model-floor-plans__img"
                                    loading="lazy"
                                />
                                {/* Overlay con lupa visible al hover (definido en CSS) */}
                                <div className="model-floor-plans__overlay" aria-hidden="true">
                                    <MagnifyIcon />
                                </div>
                            </div>
                            <span className="model-floor-plans__label">Planta {index + 1}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {/* Lightbox de planos */}
            <Delightbox
                isOpen={isOpen}
                images={plantas}
                initialIndex={activeIndex}
                onClose={() => setIsOpen(false)}
            />
        </section>
    );
}
