export const cleanStr = (val) => {
    if (!val) return undefined;
    const s = String(val).trim();
    return s.length > 0 ? s : undefined;
};

export const cleanNum = (val) => {
    if (!val) return undefined;
    // Remove currency symbols, commas, and whitespace
    const s = String(val).replace(/[$,\s]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? undefined : n;
};

export const cleanPhone = (val) => {
    if (!val) return undefined;
    // Remove everything that isn't a digit
    const s = String(val).replace(/\D/g, '');
    return s.length > 0 ? s : undefined;
};

export const cleanEmail = (val) => {
    if (!val) return undefined;
    const s = String(val).trim().toLowerCase();
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(s) ? s : undefined;
};
