import React from 'react';

/**
 * Icons for trust badges.
 * Centralized here for SRP, but could be moved to a shared icons file.
 */
const Icons = {
    Shield: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Check: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Lock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
};

/**
 * TrustBadges Component
 * Displays security and verification seals to build user confidence.
 * @returns {JSX.Element}
 */
export default function TrustBadges() {
    const badges = [
        { id: 'verified', icon: <Icons.Check />, label: 'Desarrollador Verificado' },
        { id: 'secure', icon: <Icons.Shield />, label: 'Inversión Protegida' },
        { id: 'data', icon: <Icons.Lock />, label: 'Datos SSL 256-bit' }
    ];

    return (
        <div className="trust-badges animate-fade-in-up">
            {badges.map(badge => (
                <div key={badge.id} className="trust-badge" title={badge.label}>
                    {badge.icon}
                    <span>{badge.label}</span>
                </div>
            ))}
        </div>
    );
}
