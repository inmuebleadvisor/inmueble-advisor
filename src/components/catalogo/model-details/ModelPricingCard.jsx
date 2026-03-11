import React from 'react';
import FavoriteBtn from '../../common/FavoriteBtn';
import '../../../styles/model-details/ModelPricingCard.css';

// Icono calculadora (SVG, sin dependencia externa)
const CalculatorIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="16" y1="14" x2="16" y2="18" />
        <line x1="12" y1="14" x2="12" y2="14.01" />
        <line x1="8"  y1="14" x2="8"  y2="14.01" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
        <line x1="8"  y1="18" x2="8"  y2="18.01" />
    </svg>
);

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * @component ModelPricingCard
 * @description Tarjeta de precio principal del detalle de modelo.
 *
 * Responsabilidades (SRP):
 *  - Mostrar el nombre del modelo, precio formateado y cuota de mantenimiento.
 *  - Renderizar los highlights del modelo.
 *  - Exponer el botón de favoritos.
 *  - Contener el CTA principal: "Simular Crédito".
 *
 * No formatea datos, recibe todo listo del Orquestador (ModelDetailsContent).
 *
 * @param {string}   modelName       - Nombre completo del modelo.
 * @param {string}   precioFormateado - Precio listo para mostrar (MXN string).
 * @param {string}   [mantenimientoFormateado] - Cuota mensual (string nullable).
 * @param {Array}    [highlights=[]] - Lista de highlights del modelo.
 * @param {string}   modeloId        - ID del modelo para FavoriteBtn.
 * @param {Function} onSimulate      - Callback al presionar "Simular Crédito".
 */
export default function ModelPricingCard({
    modelName,
    precioFormateado,
    mantenimientoFormateado,
    highlights = [],
    modeloId,
    onSimulate
}) {
    return (
        <div className="model-pricing-card">
            {/* Sección izquierda: Nombre, precio e highlights */}
            <div className="model-pricing-card__left">
                <h1 className="model-pricing-card__name">{modelName}</h1>

                <div className="model-pricing-card__price-box">
                    <span className="model-pricing-card__price-label">Precio de Lista</span>
                    <span className="model-pricing-card__price-val">{precioFormateado}</span>
                    {mantenimientoFormateado && (
                        <span className="model-pricing-card__price-maintenance">
                            + {mantenimientoFormateado} mant. mensual
                        </span>
                    )}
                </div>

                {highlights.length > 0 && (
                    <ul className="model-pricing-card__highlights" aria-label="Puntos destacados del modelo">
                        {highlights.map((highlight, i) => (
                            <li key={i} className="model-pricing-card__highlight-item">
                                <span className="model-pricing-card__check-icon" aria-hidden="true">
                                    <CheckIcon />
                                </span>
                                <span className="model-pricing-card__highlight-text">{highlight}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* CTA principal: abre el simulador hipotecario */}
                <button className="model-pricing-card__cta" onClick={onSimulate}>
                    <CalculatorIcon />
                    <span>Simular Crédito</span>
                </button>
            </div>

            {/* Sección derecha: Botón de favoritos */}
            <div className="model-pricing-card__fav">
                <FavoriteBtn modeloId={modeloId} />
            </div>
        </div>
    );
}
