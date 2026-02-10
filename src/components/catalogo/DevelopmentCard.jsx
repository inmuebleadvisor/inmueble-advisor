import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageLoader from '../common/ImageLoader';
import { IMAGES } from '../../config/constants';
import { getAmenityIcon } from '../../utils/amenityIconMapper.jsx';
import './DevelopmentCard.css';

// --- ICONS ---
const Icons = {
    Pin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
};

// --- HELPERS ---
const formatoMoneda = (val) => {
    if (!val || isNaN(val)) return "$0";
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function DevelopmentCard({ development }) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (!development) return null;

    // Determine Image: Use development cover, or fallback to first matching model image
    const coverImage = development.imagen ||
        (development.multimedia?.portada) ||
        (development.matchingModels?.[0]?.imagen) ||
        IMAGES.FALLBACK_PROPERTY;

    // Price Logic: prefer "visiblePrice" (calculated from matches), fallback to "precioDesde"
    const priceToShow = development.visiblePrice || development.precioDesde || 0;

    // Tag Logic
    const matchCount = development.matchCount || 0;
    const amenityCount = development.amenidades?.length || 0;

    // Preview Models (Limit to 3)
    const previewModels = useMemo(() => {
        return (development.matchingModels || []).slice(0, 3);
    }, [development.matchingModels]);

    // Status Tag Logic (Restoring original tags pattern)
    const statusTag = useMemo(() => {
        let hasPreventa = false;
        let hasInmediata = false;

        const checkValue = (val) => {
            if (!val) return;
            const s = String(val).toUpperCase().trim();
            if (s.includes('PRE-VENTA') || s.includes('PREVENTA')) hasPreventa = true;
            if (s.includes('INMEDIATA') || s.includes('IMMEDIATE')) hasInmediata = true;
        };

        // Check each matching model's status
        development.matchingModels?.forEach(m => {
            if (Array.isArray(m.status)) m.status.forEach(checkValue);
            else checkValue(m.status);
            if (m.esPreventa) hasPreventa = true;
        });

        // Also check development status if available
        if (development.status) {
            if (Array.isArray(development.status)) development.status.forEach(checkValue);
            else checkValue(development.status);
        }

        if (hasInmediata && hasPreventa) return { label: 'Inmediato/Preventa', class: 'property-card__status-tag--info' };
        if (hasInmediata) return { label: 'ENTREGA INMEDIATA', class: 'property-card__status-tag--success' };
        if (hasPreventa) return { label: 'PRE-VENTA', class: 'property-card__status-tag--warning' };
        return null;
    }, [development.matchingModels, development.status]);

    return (
        <article className="development-card">
            <Link to={`/desarrollo/${development.id}`} className="development-card__image-container">
                <ImageLoader
                    src={coverImage}
                    alt={development.nombre}
                    className="development-card__image"
                />

                {/* STATUS TAG (Restored from existing system) */}
                {statusTag && (
                    <span className={`property-card__status-tag ${statusTag.class}`} style={{ zIndex: 20 }}>
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
                        <div className="development-card__price-label">Amenidades</div>
                        <div className="development-card__amenities-badge">
                            <Icons.Sparkles />
                            <span>{amenityCount} Disponibles</span>
                        </div>

                        {/* FLOATING TOOLTIP */}
                        {showTooltip && amenityCount > 0 && (
                            <div className="development-card__tooltip" onClick={(e) => e.stopPropagation()}>
                                <div className="development-card__tooltip-content">
                                    {development.amenidades.slice(0, 6).map((am, idx) => {
                                        const Icon = getAmenityIcon(am);
                                        return (
                                            <div key={idx} className="development-card__tooltip-item">
                                                <Icon />
                                                <span>{am}</span>
                                            </div>
                                        );
                                    })}
                                    {amenityCount > 6 && (
                                        <div className="development-card__tooltip-more">+{amenityCount - 6} más...</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODELS PREVIEW */}
                {previewModels.length > 0 && (
                    <div className="development-card__models-preview">
                        <span className="development-card__preview-title">Modelos</span>
                        <div className="development-card__model-chips">
                            {previewModels.map(m => (
                                <Link
                                    key={m.id}
                                    to={`/modelo/${m.id}`}
                                    className="development-card__model-chip development-card__model-chip--active"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {m.nombre_modelo}
                                </Link>
                            ))}
                            {matchCount > 3 && (
                                <Link
                                    to={`/desarrollo/${development.id}`}
                                    className="development-card__model-chip"
                                >
                                    +{matchCount - 3} más
                                </Link>
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
