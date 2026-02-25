// src/components/catalogo/FilterBar.jsx
import React from 'react';
import { Icons } from '../common/Icons';
import { formatoMoneda } from '../../utils/formatters';
import { UI_OPCIONES } from '../../config/constants';
import '../../styles/Catalogo.css';

/**
 * @file FilterBar.jsx
 * @description Barra de filtros rápidos que se muestra encima del catálogo.
 * Permite abrir el modal completo o limpiar los filtros activos rápidamente.
 *
 * @param {Object} props
 * @param {Function} props.setIsFilterOpen - Setter para abrir el modal
 * @param {boolean} props.hayFiltrosActivos - Indica si hay algún filtro en uso
 * @param {Function} props.limpiarTodo - Resetea todos los filtros
 * @param {Object} props.filtros - Estado actual de los filtros
 */
export default function FilterBar({
    setIsFilterOpen,
    hayFiltrosActivos,
    limpiarTodo,
    filtros
}) {
    return (
        <div className="filter-bar">
            <button onClick={() => setIsFilterOpen(true)} className="filter-bar__trigger">
                <Icons.Filter /> Filtros
            </button>

            {hayFiltrosActivos && (
                <button onClick={limpiarTodo} className="filter-bar__clear-all" title="Limpiar filtros">
                    <Icons.Trash />
                </button>
            )}

            <div className="filter-bar__chips">
                {hayFiltrosActivos && (filtros.precioMin > 0 || filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX) &&
                    <span className="chip chip--primary">
                        {filtros.precioMin > 0 && filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX
                            ? `${formatoMoneda(filtros.precioMin)} - ${formatoMoneda(filtros.precioMax)}`
                            : filtros.precioMin > 0
                                ? `Min ${formatoMoneda(filtros.precioMin)}`
                                : `Max ${formatoMoneda(filtros.precioMax)}`
                        }
                    </span>
                }
                {filtros.habitaciones > 0 && (
                    <span className="chip">
                        {filtros.habitaciones}+ Rec.
                    </span>
                )}
                {filtros.tipo !== 'all' && (
                    <span className="chip chip--primary">
                        {filtros.tipo === 'casa' ? 'Casas' : 'Deptos'}
                    </span>
                )}
                {filtros.status !== 'all' && (
                    <span className={`chip ${filtros.status === 'preventa' ? 'chip--warning' : 'chip--success'}`}>
                        {filtros.status === 'preventa' ? 'Pre-Venta' : 'Inmediata'}
                    </span>
                )}
                {filtros.amenidad && <span className="chip">{filtros.amenidad}</span>}
            </div>
        </div>
    );
}
