// src/utils/formatters.js

export const normalizar = (texto) => {
    if (!texto) return '';
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export const formatoMoneda = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};
