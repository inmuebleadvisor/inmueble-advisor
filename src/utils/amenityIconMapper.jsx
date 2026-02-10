import React from 'react';

/**
 * Mapping of keywords to Lucide-like SVG icons
 */
const ICON_MAP = {
    gym: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11" /><path d="m11.8 5.8 5.4 5.4" /><path d="m5.8 11.8 5.4 5.4" /><path d="m20.1 3.9-3 3" /><path d="m7.1 16.9-3 3" /><path d="m3.9 20.1 3-3" /><path d="m16.9 7.1 3-3" /></svg>,
    alberca: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C5.8 7 6.5 6 8 6s2.2 1 3.5 1c1.3 0 2-1 3.5-1s2.2 1 3.5 1c1.3 0 2.5-.5 2.5-1" /><path d="M2 12c.6.5 1.2 1 2.5 1 1.3 0 2-1 3.5-1s2.2 1 3.5 1c1.3 0 2-1 3.5-1s2.2 1 3.5 1c1.3 0 2.5-.5 2.5-1" /><path d="M2 18c.6.5 1.2 1 2.5 1 1.3 0 2-1 3.5-1s2.2 1 3.5 1c1.3 0 2-1 3.5-1s2.2 1 3.5 1c1.3 0 2.5-.5 2.5-1" /></svg>,
    seguridad: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    salon: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="18" height="20" rx="2" /><path d="M9 14v-4h6v4" /><path d="M3 7h18" /></svg>,
    jardin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 10-2 2v4h4l2-2" /><path d="M14 6c.6.5 1.2 1 2.5 1 1.3 0 2-1 3.5-1s2.2 1 3.5 1c1.3 0 2.5-.5 2.5-1" /><path d="m3 21 3-3" /></svg>,
    asador: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11V3" /><path d="M12 11V3" /><path d="M16 11V3" /><path d="M4 11v2a8 8 0 0 0 16 0v-2H4Z" /><path d="M6 19v2" /><path d="M18 19v2" /></svg>,
    ludoteca: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="8" r="5" /><path d="M16 12a5 5 0 1 0 5 5 5 5 0 0 0-5-5Z" /></svg>,
    cancha: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11V6" /><path d="m7 11 5-5 5 5" /></svg>,
    default: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
};

/**
 * Normalizes string and finds the best icon.
 */
export const getAmenityIcon = (name) => {
    const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (n.includes('gym') || n.includes('gimnasio')) return ICON_MAP.gym;
    if (n.includes('alberca') || n.includes('piscina') || n.includes('swim')) return ICON_MAP.alberca;
    if (n.includes('seguridad') || n.includes('vigilancia') || n.includes('caseta')) return ICON_MAP.seguridad;
    if (n.includes('salon') || n.includes('usos multiples') || n.includes('eventos')) return ICON_MAP.salon;
    if (n.includes('jardin') || n.includes('areas verdes') || n.includes('parque')) return ICON_MAP.jardin;
    if (n.includes('asador') || n.includes('grill')) return ICON_MAP.asador;
    if (n.includes('ludoteca') || n.includes('kids') || n.includes('ninos')) return ICON_MAP.ludoteca;
    if (n.includes('cancha') || n.includes('padel') || n.includes('tenis')) return ICON_MAP.cancha;

    return ICON_MAP.default;
};
