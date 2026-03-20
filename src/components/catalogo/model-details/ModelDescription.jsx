import React from 'react';
import '../../../styles/model-details/ModelDescription.css';
import { modelPresentationService } from '../../../services/service.provider';

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

    // DRY: la lógica de descripción fallback y amenidades vive en el servicio
    // para ser reutilizada tanto por la UI como por el generador de PDF.
    const { descripcion: descripcionTexto, amenidades } = modelPresentationService.getDescripcionYAmenidades(modelo);

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
