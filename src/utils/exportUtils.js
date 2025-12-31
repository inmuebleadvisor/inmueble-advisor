/**
 * Utility functions for Data Export (CSV)
 * Standardizes formatters matching DATOSESTRUCTURA.md constraints.
 */

/**
 * Prepara un campo para formato CSV.
 * - Convierte null/undefined a string vacío.
 * - Escapa las comillas dobles (") duplicándolas ("").
 * - Envuelve el texto en comillas para respetar espacios y comas internas.
 */
export const cleanField = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Reemplaza saltos de línea por espacios para no romper la fila del CSV
    const noNewLines = stringValue.replace(/(\r\n|\n|\r)/gm, " ");
    return `"${noNewLines.replace(/"/g, '""')}"`;
};

/**
 * Resuelve la inconsistencia del Schema (Latitud/Longitud String vs Number).
 */
export const parseCoordinate = (coord) => {
    if (!coord) return '';
    const num = parseFloat(coord);
    return isNaN(num) ? coord : num;
};

/**
 * Convierte un Timestamp de Firebase a fecha legible (YYYY-MM-DD).
 */
export const parseDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toISOString().split('T')[0];
    }
    return ''; // Return empty string for null dates
};

/**
 * Generates a downloadable CSV file in the browser.
 * @param {string[]} headers 
 * @param {string[]} rows 
 * @param {string} fileName 
 */
export const downloadCSV = (headers, rows, fileName) => {
    const csvContent = [headers.join(','), ...rows].join('\n');
    // BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
