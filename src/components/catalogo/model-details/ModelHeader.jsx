import React from 'react';
import Carousel from '../Carousel';
import '../../../styles/model-details/ModelHeader.css';

// Icono de regreso definido localmente (SVG puro, sin dependencia de librería externa)
const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

/**
 * @component ModelHeader
 * @description Encabezado inmersivo del detalle de modelo.
 *
 * Responsabilidades (SRP):
 *  - Renderizar el carrusel de medios (fotos/video).
 *  - Mostrar el botón de regreso (sólo en vista de pantalla completa).
 *  - Mostrar el badge de estado (Pre-venta / Entrega Inmediata).
 *  - Renderizar el gradiente de transición hacia el contenido.
 *
 * No contiene lógica de negocio. Consume datos formateados del padre (Orquestador).
 *
 * @param {Array}    galeriaItems - Arreglo de {url, type} para el carrusel.
 * @param {boolean}  esPreventa   - Estado del modelo para el badge.
 * @param {boolean}  isModal      - Oculta el botón de regreso si es un modal.
 * @param {Function} onBack       - Callback al presionar el botón de regreso.
 * @param {Object}   headerRef    - Ref de React para detectar el scroll (useStickyPanel).
 */
export default function ModelHeader({ galeriaItems, esPreventa, isModal, onBack, headerRef }) {
    const badgeLabel = esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA';
    const badgeColor = esPreventa ? '#dcb23a' : '#10b981';

    return (
        <header ref={headerRef} className="model-header">
            <Carousel items={galeriaItems} />

            {/* Botón de regreso: visible solo fuera de contexto modal */}
            {!isModal && onBack && (
                <button onClick={onBack} className="model-header__back-btn" aria-label="Volver al catálogo">
                    <BackIcon />
                </button>
            )}

            {/* Badge de estado: Pre-venta o Entrega Inmediata */}
            <span
                className="model-header__status-badge"
                style={{ backgroundColor: badgeColor }}
                aria-label={`Estado del modelo: ${badgeLabel}`}
            >
                {badgeLabel}
            </span>

            {/* Gradiente de transición hacia el contenido principal */}
            <div className="model-header__gradient" aria-hidden="true" />
        </header>
    );
}
