/**
 * @file pdfUtils.js
 * @description Utilidades genéricas y reutilizables para la generación de PDFs con jsPDF.
 * Centraliza la lógica de compartir/descargar, así como los elementos de marca
 * (header, logo, footer) para mantener el Principio DRY entre todos los generadores de PDF.
 *
 * Exportaciones principales:
 *  - `shareOrDownloadPDF`  → Maneja Blob, Web Share API y descarga directa.
 *  - `drawPdfBrandHeader`  → Dibuja la barra decorativa, logo y línea decorativa del footer.
 *  - `drawPdfFooter`       → Añade pie de página con aviso legal, paginación y enlace.
 */

import { THEME_ASSETS } from '../config/theme.config';
import { getBase64ImageFromUrl } from './imageUtils';

// ── Constantes de Marca (Single Source of Truth para el PDF) ────────────────
const BRAND_URL    = 'https://inmuebleadvisor.com';
const BRAND_DOMAIN = 'inmuebleadvisor.com';
const DISCLAIMER   = 'La presente información es únicamente para fines ilustrativos, no representa ningún ofrecimiento formal por parte de Inmueble Advisor.';
const PAGE_WIDTH   = 210; // A4 portrait en mm
const MARGIN_X     = 14;
const LOGO_WIDTH   = 45;
const LOGO_HEIGHT  = 15;

// ── Paleta de Colores de Marca ───────────────────────────────────────────────
export const PDF_COLORS = {
    slate900: [15, 23, 42],
    slate800: [30, 41, 59],
    slate500: [100, 116, 139],
    slate400: [148, 163, 184],
    slate200: [226, 232, 240],
    slate50:  [248, 250, 252],
    blue600:  [37, 99, 235],
};

/**
 * Dibuja la barra de marca superior y el logo institucional en la parte superior del documento.
 * Siempre debe llamarse al inicio de la construcción del primer bloque.
 *
 * @param {import('jspdf').jsPDF} doc - Instancia activa de jsPDF.
 * @returns {Promise<void>}
 */
export const drawPdfBrandHeader = async (doc) => {
    // Barra decorativa superior
    doc.setFillColor(...PDF_COLORS.slate800);
    doc.rect(0, 0, PAGE_WIDTH, 8, 'F');

    // Logo institucional (esquina superior derecha)
    try {
        const { dataUrl: logoBase64 } = await getBase64ImageFromUrl(THEME_ASSETS.logoDark);
        if (logoBase64) {
            const logoX = PAGE_WIDTH - MARGIN_X - LOGO_WIDTH;
            const logoY = 11;
            doc.addImage(logoBase64, 'PNG', logoX, logoY, LOGO_WIDTH, LOGO_HEIGHT);
            doc.link(logoX, logoY, LOGO_WIDTH, LOGO_HEIGHT, { url: BRAND_URL });
        }
    } catch (err) {
        console.warn('[PDF] Could not add brand logo:', err);
    }
};

/**
 * Dibuja el pie de página con aviso legal, número de página y enlace a la marca
 * en TODAS las páginas del documento.
 *
 * @param {import('jspdf').jsPDF} doc - Instancia activa de jsPDF.
 */
export const drawPdfFooter = (doc) => {
    const pageCount   = doc.internal.getNumberOfPages();
    const rightX      = PAGE_WIDTH - MARGIN_X;
    const footerLineY = 278;
    const footerY     = 282;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...PDF_COLORS.slate400);

        // Línea decorativa
        doc.setDrawColor(...PDF_COLORS.slate200);
        doc.setLineWidth(0.1);
        doc.line(MARGIN_X, footerLineY, rightX, footerLineY);

        // Aviso legal (izquierda)
        const wrapped = doc.splitTextToSize(DISCLAIMER, 150);
        doc.text(wrapped, MARGIN_X, footerY);

        // Paginación (derecha)
        doc.text(`Página ${i} de ${pageCount}`, rightX, footerY, { align: 'right' });

        // Enlace de marca (derecha)
        doc.setTextColor(...PDF_COLORS.blue600);
        doc.textWithLink(BRAND_DOMAIN, rightX, footerY + 4, { url: BRAND_URL, align: 'right' });
    }
};

/**
 * Comparte o descarga un documento jsPDF como archivo.
 * Usa la Web Share API si el dispositivo lo soporta (móvil), de lo contrario
 * fuerza la descarga directa mediante un enlace temporal.
 *
 * @param {import('jspdf').jsPDF} doc           - Instancia de jsPDF ya construida.
 * @param {string}                filename       - Nombre del archivo (ej. 'Ficha_Modelo.pdf').
 * @param {string}                shareTitle     - Título para el diálogo nativo de Share.
 * @param {string}                shareText      - Texto descriptivo para el diálogo nativo de Share.
 * @returns {Promise<void>}
 */
export const shareOrDownloadPDF = async (doc, filename, shareTitle, shareText) => {
    const pdfBlob = doc.output('blob');
    const file    = new File([pdfBlob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: shareTitle, text: shareText, files: [file] });
    } else {
        const url  = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
};
