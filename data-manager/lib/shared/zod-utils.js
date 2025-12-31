
import { Timestamp } from 'firebase-admin/firestore';

export const parseBoolean = (val) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null || val === '') return false;
    const s = String(val).trim().toLowerCase();
    return ['true', '1', 'yes', 'si', 'on', 'activo', 'active'].includes(s);
};

export const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
};

export const parseArray = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    return String(val).split('|').map(s => s.trim()).filter(s => s !== "");
};

export const parseDate = (val) => {
    if (val instanceof Timestamp) return val;
    if (!val) return null;
    try {
        const date = new Date(val);
        if (isNaN(date.getTime())) return null;
        return Timestamp.fromDate(date);
    } catch (e) {
        return null;
    }
};
