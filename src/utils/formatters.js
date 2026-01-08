// src/utils/formatters.js

export const normalizar = (texto) => {
    if (!texto) return '';
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export const formatoMoneda = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export const formatDate = (date) => {
    if (!date) return '';
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
};

export const getTiempoTranscurrido = (fecha) => {
    // Verificamos si es un Timestamp de Firestore (objeto con .toDate) 
    // o una cadena (ej. el historial antiguo).
    if (!fecha) return 'Reciente';

    let targetDate;
    if (fecha.toDate) { // Si es un Timestamp de Firestore
        targetDate = fecha.toDate();
    } else { // Si es una cadena ISO (ej. el historial)
        targetDate = new Date(fecha);
    }

    const diff = new Date() - targetDate;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${Math.floor(horas / 24)}d`;
};
