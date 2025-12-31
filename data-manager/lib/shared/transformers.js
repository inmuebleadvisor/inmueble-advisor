
export const parsePipes = (val) => val ? String(val).split('|').map(s => s.trim()).filter(s => s) : [];

export const parseHitos = (val) => {
    if (!val) return [];
    return String(val).split('|')
        .map(v => parseFloat(v.trim()))
        .filter(n => !isNaN(n));
};
