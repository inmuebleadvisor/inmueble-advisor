// src/components/catalogo/FilterModal.jsx
import React, { useEffect } from 'react';
import { Icons } from '../Icons';
import { formatoMoneda } from '../../utils/formatters';
import { UI_OPCIONES } from '../../config/constants';
import '../../styles/Catalogo.css';

export default function FilterModal({
    isOpen,
    onClose,
    filtros,
    setFiltros,
    limpiarTodo,
    topAmenidades,
    resultadosCount
}) {

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFilterChange = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <h2 className="modal__title">Filtros</h2>
                    <button onClick={onClose} className="modal__close">
                        <Icons.Close />
                    </button>
                </div>

                <div className="modal__body">

                    <div className="filter-section">
                        <label className="filter-section__label">Presupuesto Máximo</label>
                        <div className="filter-section__value">{formatoMoneda(filtros.precioMax)}</div>
                        <input
                            type="range"
                            min="500000"
                            max={UI_OPCIONES.FILTRO_PRECIO_MAX}
                            step={UI_OPCIONES.FILTRO_PRECIO_STEP}
                            value={filtros.precioMax}
                            onChange={(e) => handleFilterChange('precioMax', Number(e.target.value))}
                            className="filter-section__slider"
                        />
                    </div>

                    <div className="filter-section">
                        <label className="filter-section__label">Recámaras</label>
                        <div className="pill-group">
                            {[0, 1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleFilterChange('habitaciones', num)}
                                    className={`pill ${filtros.habitaciones === num ? 'pill--active' : ''}`}
                                >
                                    {num === 0 ? 'Todas' : `${num}+`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <label className="filter-section__label">Etapa</label>
                        <div className="pill-group">
                            {[
                                { val: 'all', label: 'Cualq.' },
                                { val: 'inmediata', label: 'Inmediata' },
                                { val: 'preventa', label: 'Preventa' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => handleFilterChange('status', opt.val)}
                                    className={`pill ${filtros.status === opt.val ? 'pill--active' : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <label className="filter-section__label">Amenidades</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <button
                                onClick={() => handleFilterChange('amenidad', '')}
                                className={`amenity-chip ${filtros.amenidad === '' ? 'amenity-chip--active' : ''}`}
                            >
                                Todas
                            </button>
                            {topAmenidades.map((am, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleFilterChange('amenidad', filtros.amenidad === am ? '' : am)}
                                    className={`amenity-chip ${filtros.amenidad === am ? 'amenity-chip--active' : ''}`}
                                >
                                    {am}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal__footer">
                    <button className="modal__clear-btn" onClick={limpiarTodo}>Limpiar</button>
                    <button className="modal__apply-btn" onClick={onClose}>
                        Ver {resultadosCount} resultados
                    </button>
                </div>
            </div>
        </div>
    );
}
