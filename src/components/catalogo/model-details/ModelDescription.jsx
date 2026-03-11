import React from 'react';
import CaracteristicasBox from '../../common/CaracteristicasBox';
import AmenidadesList from '../AmenidadesList';
import '../../../styles/model-details/ModelDescription.css';

/**
 * @component ModelDescription
 * @description Sección descriptiva del modelo.
 *
 * Responsabilidades (SRP):
 *  - Mostrar el resumen de características físicas (recámaras, baños, m²).
 *  - Renderizar la descripción textual del modelo.
 *  - Listar amenidades exclusivas si existen.
 *
 * No contiene lógica de negocio ni llamadas a servicios.
 *
 * @param {Object} modelo - Objeto completo del modelo con propiedades de características.
 */
export default function ModelDescription({ modelo }) {
    if (!modelo) return null;

    const descripcionFallback = `Conoce el modelo ${modelo.nombre_modelo}, diseñado para tu comodidad.`;

    return (
        <section className="model-description" aria-labelledby="model-description-heading">
            {/* Cuadro de características (recámaras, baños, m², niveles) */}
            <CaracteristicasBox
                recamaras={modelo.recamaras}
                banos={modelo.banos}
                m2={modelo.m2}
                niveles={modelo.niveles}
                terreno={modelo.terreno}
            />

            <hr className="model-description__divider" />

            <h3 id="model-description-heading" className="model-description__title">
                Descripción del Modelo
            </h3>
            <p className="model-description__text">
                {modelo.descripcion || descripcionFallback}
            </p>

            {/* Lista de amenidades (condicional) */}
            {modelo.amenidades?.length > 0 && (
                <div className="model-description__amenidades">
                    <h4 className="model-description__amenidades-label">Amenidades Exclusivas:</h4>
                    <AmenidadesList amenidades={modelo.amenidades} />
                </div>
            )}
        </section>
    );
}
