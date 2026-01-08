// src/components/catalogo/FilterModal.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
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
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            const savedScroll = window.scrollY || document.documentElement.scrollTop;
            // console.log(`[SCROLL DEBUG] Open Filters. Saving position: ${savedScroll}px`);
            window.__tempFilterScroll = savedScroll;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            // If we are closing (and strictly if we have a saved position)
            if (window.__tempFilterScroll !== undefined) {
                const target = window.__tempFilterScroll;
                // console.log(`[SCROLL DEBUG] Close Filters. Restoring to: ${target}px`);
                window.scrollTo(0, target);

                setTimeout(() => window.scrollTo(0, target), 50);
            }
        }

        return () => {
            document.body.style.overflow = '';
        };
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
                        <label className="filter-section__label">Rango de Precio</label>

                        {/* Dual Inputs */}
                        <div className="price-inputs-container">
                            <div className="price-input-group">
                                <span className="price-currency">$</span>
                                <input
                                    type="text"
                                    value={new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(filtros.precioMin)}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                        const numValue = Number(rawValue);
                                        const val = Math.min(numValue, filtros.precioMax - 10000);
                                        handleFilterChange('precioMin', val);
                                    }}
                                    className="price-input"
                                    placeholder="Min"
                                />
                            </div>
                            <span className="price-separator">-</span>
                            <div className="price-input-group">
                                <span className="price-currency">$</span>
                                <input
                                    type="text"
                                    value={new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(filtros.precioMax)}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                        const numValue = Number(rawValue);
                                        const val = Math.max(numValue, filtros.precioMin + 10000);
                                        handleFilterChange('precioMax', val);
                                    }}
                                    className="price-input"
                                    placeholder="Max"
                                />
                            </div>
                        </div>



                        {/* Dual Range Slider */}
                        < div className="range-slider" >
                            <input
                                type="range"
                                min="0"
                                max={UI_OPCIONES.FILTRO_PRECIO_MAX}
                                step={UI_OPCIONES.FILTRO_PRECIO_STEP}
                                value={filtros.precioMin}
                                onChange={(e) => {
                                    const val = Math.min(Number(e.target.value), filtros.precioMax - 10000);
                                    handleFilterChange('precioMin', val);
                                }}
                                className="range-slider__thumb range-slider__thumb--min"
                            />
                            <input
                                type="range"
                                min="0"
                                max={UI_OPCIONES.FILTRO_PRECIO_MAX}
                                step={UI_OPCIONES.FILTRO_PRECIO_STEP}
                                value={filtros.precioMax}
                                onChange={(e) => {
                                    const val = Math.max(Number(e.target.value), filtros.precioMin + 10000);
                                    handleFilterChange('precioMax', val);
                                }}
                                className="range-slider__thumb range-slider__thumb--max"
                            />
                            <div className="range-slider__track"></div>
                            <div
                                className="range-slider__range"
                                style={{
                                    left: `${(filtros.precioMin / UI_OPCIONES.FILTRO_PRECIO_MAX) * 100}%`,
                                    right: `${100 - (filtros.precioMax / UI_OPCIONES.FILTRO_PRECIO_MAX) * 100}%`
                                }}
                            ></div>
                        </div >
                    </div >

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
                        <label className="filter-section__label">Tipo de Propiedad</label>
                        <div className="pill-group">
                            {[
                                { val: 'all', label: 'Todo' },
                                { val: 'casa', label: 'Casas' },
                                { val: 'duplex', label: 'Duplex' },
                                { val: 'departamento', label: 'Deptos' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => handleFilterChange('tipo', opt.val)}
                                    className={`pill ${filtros.tipo === opt.val ? 'pill--active' : ''}`}
                                >
                                    {opt.label}
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



                <div className="modal__footer" style={{ flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}>
                        <button className="modal__clear-btn" onClick={limpiarTodo}>Limpiar</button>
                        <button className="modal__apply-btn" onClick={onClose}>
                            Ver {resultadosCount} resultados
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            navigate('/onboarding-cliente');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color)',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            textDecoration: 'none',
                            width: '100%',
                            textAlign: 'center',
                            marginTop: '5px'
                        }}
                    >
                        Calcular mi monto máximo
                    </button>
                </div>
            </div >
        </div >
    );
}
