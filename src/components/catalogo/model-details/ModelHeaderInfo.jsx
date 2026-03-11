import React from 'react';
import '../../../styles/model-details/ModelHeaderInfo.css';

/**
 * @component ModelHeaderInfo (Marketplace Layout)
 * @description Muestra el H1 principal, subtítulo (ubicación) y la grilla
 * de 4 atributos principales (Recámaras, Baños, Construcción, Terreno).
 *
 * FIX BUG 5: Usa accessors defensivos para los campos de datos. El esquema
 * de Firestore puede tener los campos en la raíz del objeto (modelo.recamaras)
 * O anidados (modelo.caracteristicas.recamaras). Soportamos ambos.
 *
 * @param {Object} modelo     - Objeto del modelo de Firestore
 * @param {Object} desarrollo - Objeto del desarrollo para mostrar ubicación
 */
export default function ModelHeaderInfo({ modelo, desarrollo }) {
    if (!modelo) return null;

    // FIX BUG 5: Lectura defensiva — campo raíz primero (como usa buildSimulatorPayload),
    // luego caracteristicas.* como fallback secundario
    const recamaras    = modelo.recamaras    ?? modelo.caracteristicas?.recamaras    ?? 0;
    const banos        = modelo.banos        ?? modelo.caracteristicas?.banos        ?? 0;
    const construccion = modelo.m2
                      || modelo.superficieConstruccion
                      || modelo.caracteristicas?.metrosConstruccion
                      || 0;
    const terreno      = modelo.superficieTotal
                      || modelo.terreno
                      || modelo.caracteristicas?.metrosTerreno
                      || 0;

    // Formateamos baños: si tiene .5, lo mostramos como "1.5"
    const banosDisplay = banos % 1 !== 0
        ? `${Math.floor(banos)}.5`
        : banos;

    return (
        <div className="model-header-info">
            
            {/* 1. Encabezado: Título + Ubicación */}
            <header className="model-header-info__header">
                <div className="model-header-info__title-wrapper">
                    <h1 className="model-header-info__title">
                        {modelo.nombre_modelo}
                    </h1>
                    
                    {desarrollo && (
                        <p className="model-header-info__location">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {desarrollo.ciudad
                                ? `${desarrollo.nombre}, ${desarrollo.ciudad}`
                                : desarrollo.nombre
                            }
                        </p>
                    )}
                </div>
            </header>

            {/* 2. Grilla de Atributos Clave (4 Cards) */}
            <div className="model-header-info__grid">
                
                <div className="model-header-info__card">
                    <span className="model-header-info__icon" aria-hidden="true">🛏️</span>
                    <span className="model-header-info__value">{recamaras} Rec.</span>
                    <span className="model-header-info__label">Habitaciones</span>
                </div>
                
                <div className="model-header-info__card">
                    <span className="model-header-info__icon" aria-hidden="true">🚿</span>
                    <span className="model-header-info__value">{banosDisplay} Baños</span>
                    <span className="model-header-info__label">Servicios</span>
                </div>
                
                <div className="model-header-info__card">
                    <span className="model-header-info__icon" aria-hidden="true">📐</span>
                    <span className="model-header-info__value">{construccion} m²</span>
                    <span className="model-header-info__label">Construcción</span>
                </div>
                
                <div className="model-header-info__card">
                    <span className="model-header-info__icon" aria-hidden="true">🌳</span>
                    <span className="model-header-info__value">{terreno} m²</span>
                    <span className="model-header-info__label">Terreno</span>
                </div>

            </div>

        </div>
    );
}
