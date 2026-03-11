import React from 'react';
import '../../../styles/model-details/ModelDescription.css';

/**
 * @component ModelDescription (Marketplace Layout)
 * @description Muestra el párrafo descriptivo de la propiedad y la cuadrícula
 * de amenidades con íconos de check verdes.
 *
 * Prioridad de texto:
 *  1. modelo.descripcion  (dato real de Firestore)
 *  2. Texto genérico de fallback (si no hay descripción cargada)
 *
 * @param {Object} modelo - Objeto del modelo con descripcion, amenidades, caracteristicas
 */
export default function ModelDescription({ modelo }) {
    if (!modelo) return null;

    // FIX BUG 4: Usar descripción real como principal, genérico solo como fallback
    const descripcionTexto = modelo.descripcion
        ? modelo.descripcion
        : `Modelo ${modelo.nombre_modelo}: Una excelente propiedad diseñada con gran aprovechamiento de sus espacios y luz natural. Ideal para quienes buscan seguridad y confort en una zona de alta plusvalía.`;

    // Construir lista de amenidades desde múltiples fuentes posibles en Firestore
    const amenidades = [];
    
    // Opción 1: Array directo de amenidades
    if (Array.isArray(modelo.amenidades) && modelo.amenidades.length > 0) {
        amenidades.push(...modelo.amenidades);
    }
    
    // Opción 2: Estacionamientos como amenidad fabricada
    const estacionamientos = modelo.estacionamientos || modelo.caracteristicas?.estacionamientos;
    if (estacionamientos > 0 && !amenidades.some(a => a.toLowerCase().includes('estacionamiento') || a.toLowerCase().includes('cochera'))) {
        amenidades.push(`Cochera para ${estacionamientos} auto${estacionamientos > 1 ? 's' : ''}`);
    }

    return (
        <div className="model-description">
            <h2 className="model-description__title">Descripción de la Propiedad</h2>
            
            <p className="model-description__text">
                {descripcionTexto}
            </p>

            {amenidades.length > 0 && (
                <div className="model-description__feature-grid">
                    {amenidades.map((amenidad, idx) => (
                        <div key={idx} className="model-description__feature-item">
                            <span className="model-description__feature-icon">✓</span>
                            {amenidad}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
