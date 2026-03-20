/**
 * @file pdfFonts.js
 * @description Cargador lazy de fuente Roboto para instancias de jsPDF.
 *
 * Problema resuelto: jsPDF incluye únicamente Helvetica/Times/Courier, que solo
 * cubren ISO-8859-1 básico. Caracteres españoles (á, é, í, ó, ú, ñ, ü) y
 * caracteres especiales no se renderizan correctamente con esas fuentes.
 *
 * Solución: Embeber la fuente Roboto (subconjunto Latin + Latin Extended)
 * descargándola lazily desde jsDelivr. Esta fuente cubre el charset
 * completo necesario para textos en español.
 *
 * Uso:
 *   const { jsPDF } = await import('jspdf');
 *   const doc = new jsPDF(...);
 *   await loadRobotoFont(doc);
 *   doc.setFont('Roboto', 'normal'); // ya disponible
 */

const FONT_BASE_URL = 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1'; // No usar - usar enfoque diferente

/**
 * Descarga y registra la fuente Roboto en la instancia de jsPDF dada.
 * Opera de forma lazy: solo se descarga la primera vez y se cachea en memoria.
 *
 * @param {import('jspdf').jsPDF} doc - Instancia activa de jsPDF.
 * @returns {Promise<boolean>} true si la fuente se cargó correctamente, false en caso de error.
 */

// Cache en módulo para no re-descargar en generaciones sucesivas
let _robotoNormalBase64  = null;
let _robotoBoldBase64    = null;

const ROBOTO_NORMAL_URL = 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2';
const ROBOTO_BOLD_URL   = 'https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2';

/**
 * Descarga un woff2 y lo convierte a base64 string.
 * @param {string} url
 * @returns {Promise<string|null>}
 */
const fetchFontAsBase64 = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer     = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        let binary       = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    } catch (err) {
        console.warn('[pdfFonts] No se pudo descargar la fuente:', url, err);
        return null;
    }
};

/**
 * Registra Roboto (Normal + Bold) en la instancia de jsPDF.
 * Si la descarga falla, el doc sigue funcionando con Helvetica como fallback.
 *
 * @param {import('jspdf').jsPDF} doc
 * @returns {Promise<boolean>} - true si Roboto está disponible, false si se usa Helvetica.
 */
export const loadRobotoFont = async (doc) => {
    try {
        // Lazy download con cache de módulo
        if (!_robotoNormalBase64) {
            _robotoNormalBase64 = await fetchFontAsBase64(ROBOTO_NORMAL_URL);
        }
        if (!_robotoBoldBase64) {
            _robotoBoldBase64 = await fetchFontAsBase64(ROBOTO_BOLD_URL);
        }

        if (!_robotoNormalBase64 || !_robotoBoldBase64) {
            console.warn('[pdfFonts] Descarga de Roboto falló, usando Helvetica como fallback.');
            return false;
        }

        // Registrar los archivos de fuente en el sistema virtual de jsPDF
        doc.addFileToVFS('Roboto-normal.woff2', _robotoNormalBase64);
        doc.addFileToVFS('Roboto-bold.woff2',   _robotoBoldBase64);

        // Vincular nombres de fuente con los archivos registrados
        doc.addFont('Roboto-normal.woff2', 'Roboto', 'normal');
        doc.addFont('Roboto-bold.woff2',   'Roboto', 'bold');

        return true;

    } catch (err) {
        console.warn('[pdfFonts] Error cargando Roboto, usando Helvetica como fallback:', err);
        return false;
    }
};
