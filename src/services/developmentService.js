/**
 * @file developmentService.js
 * @description Servicio para manejar la lógica de negocio relacionada con los Desarrollos.
 * Sigue el MANUALDEARQUITECTURA.md para desacoplar la lógica de la capa de presentación.
 */

/**
 * Determina la etiqueta de estado (Status Tag) para un desarrollobasado en sus modelos y status general.
 * 
 * @param {Object} development - El objeto del desarrollo.
 * @returns {Object|null} Objeto con la etiqueta (label) y la clase CSS (class), o null si no aplica.
 */
export const getDevelopmentStatusTag = (development) => {
    if (!development) return null;

    let hasPreventa = false;
    let hasInmediata = false;

    const checkValue = (val) => {
        if (!val) return;
        const s = String(val).toUpperCase().trim();
        if (s.includes('PRE-VENTA') || s.includes('PREVENTA')) hasPreventa = true;
        if (s.includes('INMEDIATA') || s.includes('IMMEDIATE')) hasInmediata = true;
    };

    // Revisar status de los modelos que coinciden
    development.matchingModels?.forEach(m => {
        if (Array.isArray(m.status)) m.status.forEach(checkValue);
        else checkValue(m.status);
        if (m.esPreventa) hasPreventa = true;
    });

    // Revisar status general del desarrollo
    if (development.status) {
        if (Array.isArray(development.status)) development.status.forEach(checkValue);
        else checkValue(development.status);
    }

    // Retornar metadata del tag según la prioridad del negocio
    if (hasInmediata && hasPreventa) {
        return {
            label: 'Inmediato/Preventa',
            class: 'development-card__status-tag--info'
        };
    }

    if (hasInmediata) {
        return {
            label: 'ENTREGA INMEDIATA',
            class: 'development-card__status-tag--success'
        };
    }

    if (hasPreventa) {
        return {
            label: 'PRE-VENTA',
            class: 'development-card__status-tag--warning'
        };
    }

    return null;
};

/**
 * Determina la imagen de portada de una tarjeta basado en la jerarquia de negocio.
 * @param {Object} development - Objeto desarrollo
 * @param {String} fallbackImage - Imagen por defecto
 * @returns {String} URL de la imagen
 */
export const getDevelopmentCoverImage = (development, fallbackImage) => {
    if (!development) return fallbackImage;

    return development.imagen ||
        (development.multimedia?.portada) ||
        (development.matchingModels?.[0]?.imagen) ||
        fallbackImage;
};
