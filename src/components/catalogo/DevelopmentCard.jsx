import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageLoader from '../common/ImageLoader';
import { IMAGES } from '../../config/constants';
import { getAmenityIcon } from '../../utils/amenityIconMapper.jsx';
import { getDevelopmentStatusTag, getDevelopmentCoverImage } from '../../services/developmentService';
import { formatoMoneda, formatoMillones } from '../../utils/formatters';
import './DevelopmentCard.css';

// --- ICONS ---
const Icons = {
    Pin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>,
    Bed: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>,
    Bath: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 7 3" /><path d="M22 12a10 10 0 0 1-20 0Z" /><path d="M7 12V8" /><path d="M11 12V8" /><path d="M15 12V8" /><path d="M19 12V8" /></svg>,
    ChevronLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>,
    ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
};

// --- CONFIGURATION ---
const SCROLL_CONFIG = {
    AMOUNT: 300,
    THRESHOLD_START: 20,
    THRESHOLD_END: 15,
    RESIZE_BUFFER: 5,
    INITIAL_CHECK_TIMERS: [100, 300, 600, 1200],
    ANIMATION_CHECK_TIMERS: [100, 200, 400, 600],
    MAX_VISIBLE_AMENITIES: 6
};

/**
 * Tarjeta de presentación de un Desarrollo en el catálogo.
 * Muestra imagen, precio, amenidades y modelos disponibles.
 * 
 * @param {Object} props
 * @param {Object} props.development - Datos del desarrollo
 * @param {string} props.development.id - ID único
 * @param {string} props.development.nombre - Nombre del desarrollo
 * @param {string} props.development.imagen - URL de imagen principal (opcional)
 * @param {Object} props.development.ubicacion - Objeto con datos de ubicación
 * @param {Array} props.development.amenidades - Lista de strings de amenidades
 * @param {Array} props.development.matchingModels - Lista de modelos que coinciden con filtros
 */

export default function DevelopmentCard({ development }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const sliderRef = useRef(null);

    // Early data derivation to avoid breaking hooks
    const matchingModels = development?.matchingModels || [];
    const matchCount = development?.matchCount || 0;
    const amenityCount = development?.amenidades?.length || 0;
    const previewModels = matchingModels;

    const checkScroll = () => {
        const slider = sliderRef.current;
        if (!slider) return;

        const { scrollLeft, scrollWidth, clientWidth } = slider;

        // Use an even more aggressive threshold for start detection (20px)
        // to handle any browser-specific offsets or internal spacings
        const isAtStart = scrollLeft <= SCROLL_CONFIG.THRESHOLD_START;
        const isAtEnd = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - SCROLL_CONFIG.THRESHOLD_END;

        setCanScrollLeft(!isAtStart);
        setCanScrollRight(!isAtEnd && scrollWidth > clientWidth + SCROLL_CONFIG.RESIZE_BUFFER);
    };

    useEffect(() => {
        // Ensure we check on mount and after layout shifts
        const handleInitialCheck = () => {
            if (sliderRef.current) checkScroll();
        };

        handleInitialCheck();

        handleInitialCheck();

        const timers = SCROLL_CONFIG.INITIAL_CHECK_TIMERS.map(ms => setTimeout(handleInitialCheck, ms));
        window.addEventListener('resize', checkScroll);

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', checkScroll);
        };
    }, [previewModels.length]);

    if (!development) return null;

    const handleScroll = (dir) => {
        const slider = sliderRef.current;
        if (!slider) return;

        const scrollAmount = SCROLL_CONFIG.AMOUNT;
        slider.scrollBy({
            left: dir === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });

        // Re-check visibility multiple times during/after smooth scroll animation
        const checkTimers = SCROLL_CONFIG.ANIMATION_CHECK_TIMERS.map(ms => setTimeout(checkScroll, ms));
        return () => checkTimers.forEach(clearTimeout);
    };

    // Determine Image: Use service logic
    const coverImage = getDevelopmentCoverImage(development, IMAGES.FALLBACK_PROPERTY);

    // Price Logic: prefer "visiblePrice" (calculated from matches), fallback to "precioDesde"
    const priceToShow = development.visiblePrice || development.precioDesde || 0;

    // STATUS TAG (Desacoplado via Service)
    const statusTag = useMemo(() => getDevelopmentStatusTag(development), [development]);

    return (
        <article className="development-card">
            <Link to={`/desarrollo/${development.id}`} className="development-card__image-container">
                <ImageLoader
                    src={coverImage}
                    alt={development.nombre}
                    className="development-card__image"
                />

                {/* STATUS TAG (Normalizado a BEM development-card) */}
                {statusTag && (
                    <span className={`development-card__status-tag ${statusTag.class}`} style={{ zIndex: 20 }}>
                        {statusTag.label}
                    </span>
                )}

                <div className="development-card__overlay">
                    <h3 className="development-card__title">{development.nombre}</h3>
                    <div className="development-card__location">
                        <Icons.Pin />
                        {development.ubicacion?.zona || development.zona || "Ubicación pendiente"}
                    </div>
                </div>
            </Link>

            <div className="development-card__body">

                {/* PRICE & AMENITIES ROW */}
                <div className="development-card__info-row">
                    <div>
                        <div className="development-card__price-label">Desde</div>
                        <div className="development-card__price-value">{formatoMoneda(priceToShow)}</div>
                    </div>
                    <div
                        className="development-card__amenities-trigger"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTooltip(!showTooltip);
                        }}
                    >
                        {/* Hidden-visible label to maintain vertical height consistency with Price column */}
                        <div className="development-card__price-label" style={{ opacity: 0, pointerEvents: 'none' }}>Amenidades</div>
                        <div className="development-card__amenities-badge">
                            <Icons.Sparkles />
                            <span>{amenityCount} Amenidades</span>
                        </div>

                        {/* FLOATING TOOLTIP */}
                        {showTooltip && amenityCount > 0 && (
                            <div className="development-card__tooltip" onClick={(e) => e.stopPropagation()}>
                                <div className="development-card__tooltip-content">
                                    {development.amenidades.slice(0, SCROLL_CONFIG.MAX_VISIBLE_AMENITIES).map((am, idx) => {
                                        const Icon = getAmenityIcon(am);
                                        return (
                                            <div key={idx} className="development-card__tooltip-item">
                                                <Icon />
                                                <span>{am}</span>
                                            </div>
                                        );
                                    })}
                                    {amenityCount > SCROLL_CONFIG.MAX_VISIBLE_AMENITIES && (
                                        <div className="development-card__tooltip-more">+{amenityCount - SCROLL_CONFIG.MAX_VISIBLE_AMENITIES} más...</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODELS PREVIEW */}
                {previewModels.length > 0 && (
                    <div className="development-card__models-preview">
                        <span className="development-card__preview-title">{matchCount} Modelos:</span>
                        <div className="development-card__slider-wrapper">
                            {previewModels.length > 2 && canScrollLeft && (
                                <button
                                    className="development-card__nav-btn development-card__nav-btn--left"
                                    onClick={(e) => { e.stopPropagation(); handleScroll('left'); }}
                                    aria-label="Anterior"
                                >
                                    <Icons.ChevronLeft />
                                </button>
                            )}

                            <div
                                className={`development-card__model-chips hide-scrollbar ${previewModels.length <= 2 ? 'development-card__model-chips--centered' : ''}`}
                                ref={sliderRef}
                                onScroll={checkScroll}
                            >
                                {previewModels.map(m => (
                                    <Link
                                        key={m.id}
                                        to={`/modelo/${m.id}`}
                                        className="development-card__model-chip development-card__model-chip--active"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="development-card__model-info">
                                            <span className="development-card__model-name">{m.nombre_modelo}</span>
                                            <span className="development-card__model-price">
                                                {formatoMillones(m.precioNumerico || m.precios?.base || 0)}
                                            </span>
                                            <div className="development-card__model-features">
                                                <span className="development-card__feature">
                                                    <Icons.Bed /> {m.recamaras || 0}
                                                </span>
                                                <span className="development-card__feature">
                                                    <Icons.Bath /> {m.banos || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {previewModels.length > 2 && canScrollRight && (
                                <>
                                    <button
                                        className="development-card__nav-btn development-card__nav-btn--right"
                                        onClick={(e) => { e.stopPropagation(); handleScroll('right'); }}
                                        aria-label="Siguiente"
                                    >
                                        <Icons.ChevronRight />
                                    </button>
                                    <div className="development-card__slider-gradient"></div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <Link to={`/desarrollo/${development.id}`} className="development-card__cta">
                    Ver Desarrollo
                </Link>
            </div>
        </article>
    );
}
