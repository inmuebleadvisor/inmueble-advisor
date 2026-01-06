import React from 'react';

/**
 * Icons defined locally to avoid dependency bloat.
 */
const Icons = {
    Calendar: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Credit: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    )
};

/**
 * StickyActionPanel Component
 * A generic sticky footer designed for high conversion.
 * Used in DevelopmentDetails and ModelDetails.
 * 
 * @param {Object} props
 * @param {string} props.price - Pre-formatted price string
 * @param {string} props.label - Label above/next to price (e.g., "Precios desde")
 * @param {Function} props.onMainAction - Callback for primary action (Schedule Visit)
 * @param {Function} props.onSecondaryAction - Callback for secondary action (Credit)
 */
export default function StickyActionPanel({
    price,
    label = 'Precio de Lista',
    onMainAction,
    onSecondaryAction
}) {
    return (
        <div className="dev-action-panel animate-fade-in-up">
            <div className="dev-action-panel__info">
                <span className="dev-action-panel__label">{label}</span>
                <span className="dev-action-panel__price">{price || 'Consulte precio'}</span>
            </div>

            <div className="dev-action-panel__btns">
                {/* Primary action: Schedule Visit */}
                <button
                    className="btn-cta btn-cta--primary"
                    onClick={onMainAction}
                    style={{ width: '100%' }}
                >
                    <Icons.Calendar />
                    <span>Agendar Cita</span>
                </button>
            </div>
        </div>
    );
}
