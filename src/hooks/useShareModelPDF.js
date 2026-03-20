import { useState } from 'react';
import { modelPresentationService } from '../services/service.provider';
import { resolveImageUrl, getBase64ImageFromUrl } from '../utils/imageUtils';
import { drawPdfBrandHeader, drawPdfFooter, shareOrDownloadPDF, PDF_COLORS } from '../utils/pdfUtils';

/**
 * Normaliza texto para compatibilidad con la fuente Helvetica de jsPDF.
 * jsPDF solo soporta ISO-8859-1 basico con Helvetica. Los caracteres con
 * tilde, n~, dieresis o simbolos especiales se reemplazan por equivalentes ASCII.
 * Se aplica UNICAMENTE en contexto PDF — no afecta el texto en pantalla.
 *
 * @param {string|number} str
 * @returns {string}
 */
const normalizePdfText = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/[áàäâã]/g, 'a').replace(/[ÁÀÄÂÃ]/g, 'A')
        .replace(/[éèëê]/g, 'e').replace(/[ÉÈËÊ]/g, 'E')
        .replace(/[íìïî]/g, 'i').replace(/[ÍÌÏÎ]/g, 'I')
        .replace(/[óòöôõ]/g, 'o').replace(/[ÓÒÖÔÕ]/g, 'O')
        .replace(/[úùüû]/g, 'u').replace(/[ÚÙÜÛ]/g, 'U')
        .replace(/[ñ]/g, 'n').replace(/[Ñ]/g, 'N')
        .replace(/[ç]/g, 'c').replace(/[Ç]/g, 'C')
        .replace(/[¿¡]/g, '')
        .replace(/[^\x00-\x7F]/g, ''); // Eliminar cualquier otro caracter no-ASCII
};

/**
 * @hook useShareModelPDF
 * @description Custom Hook para generar la ficha tecnica de un modelo de vivienda en PDF.
 *
 * Patron: Lazy Load de jsPDF para no penalizar el bundle inicial.
 * Datos: Consume EXCLUSIVAMENTE ModelPresentationService (DRY — sin duplicar logica defensiva).
 * Share: Delega el Blob + Web Share API a pdfUtils.shareOrDownloadPDF (DRY).
 * Fuente: Helvetica con normalizePdfText() — sin dependencias externas de CDN.
 *
 * @returns {{ generateModelPDF: Function, isGeneratingPDF: boolean, errorPDF: string|null }}
 */
export const useShareModelPDF = () => {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [errorPDF, setErrorPDF]               = useState(null);

    /**
     * Genera y descarga (o comparte) el PDF de la ficha tecnica de un modelo.
     *
     * @param {Object} modelo     - Objeto del modelo de Firestore.
     * @param {Object} desarrollo - Objeto del desarrollo al que pertenece el modelo.
     * @returns {Promise<void>}
     */
    const generateModelPDF = async (modelo, desarrollo) => {
        if (!modelo) return;

        try {
            setIsGeneratingPDF(true);
            setErrorPDF(null);

            // 1. Lazy load: jsPDF solo se descarga al primer uso
            const { jsPDF } = await import('jspdf');

            // 2. Datos a traves del servicio (Single Source of Truth, DRY)
            const precioFormateado = modelPresentationService.formatoMoneda(modelo.precioNumerico);
            const mantenimientoVal = modelo.precios?.mantenimientoMensual;
            const mantenimientoFmt = mantenimientoVal > 0 ? modelPresentationService.formatoMoneda(mantenimientoVal) : null;
            const { recamaras, banos, construccion, terreno } = modelPresentationService.getCaracteristicas(modelo);
            const { descripcion, amenidades }                 = modelPresentationService.getDescripcionYAmenidades(modelo);

            // 3. Inicializar documento A4 Portrait
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Helvetica: fuente incluida en jsPDF, sin dependencias externas de CDN.
            // normalizePdfText() se aplica a todo texto de Firestore para evitar caracteres garbled.
            const FONT_NAME  = 'helvetica';
            const MARGIN_X   = 14;
            const PAGE_WIDTH = 210;
            const MAX_IMG_H  = 100; // mm — tope de altura para fotos muy verticales
            let   currentY   = 26;

            // 4. Encabezado de marca (barra + logo)
            await drawPdfBrandHeader(doc);

            // 5. Titulo del modelo y ubicacion
            const nombreModelo = normalizePdfText(modelo.nombre_modelo || 'Modelo de Vivienda');
            const ubicacion    = normalizePdfText(
                desarrollo
                    ? (desarrollo.ciudad ? `${desarrollo.nombre}, ${desarrollo.ciudad}` : desarrollo.nombre)
                    : ''
            );
            const statusLabel = typeof modelo.esPreventa === 'boolean'
                ? (modelo.esPreventa ? 'Preventa' : 'Entrega Inmediata')
                : '';

            doc.setFontSize(24);
            doc.setTextColor(...PDF_COLORS.slate900);
            doc.setFont(FONT_NAME, 'bold');
            doc.text(nombreModelo, MARGIN_X, currentY);
            currentY += 8;

            if (ubicacion) {
                doc.setFontSize(10);
                doc.setTextColor(...PDF_COLORS.slate500);
                doc.setFont(FONT_NAME, 'normal');
                const ubicacionTxt = ubicacion + (statusLabel ? `  -  ${statusLabel}` : '');
                doc.text(ubicacionTxt, MARGIN_X, currentY);
                currentY += 6;
            }

            // 6. Linea divisoria
            doc.setDrawColor(...PDF_COLORS.slate200);
            doc.setLineWidth(0.2);
            doc.line(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X, currentY);
            currentY += 8;

            // 7. Imagen principal del modelo (con aspect ratio real)
            const imagenUrl = modelo.imagenes?.[0];
            if (imagenUrl) {
                const resolvedUrl = resolveImageUrl(imagenUrl);
                const { dataUrl: base64Img, width: naturalW, height: naturalH } = await getBase64ImageFromUrl(resolvedUrl);
                if (base64Img && naturalW > 0 && naturalH > 0) {
                    try {
                        const availableW = PAGE_WIDTH - MARGIN_X * 2; // 182mm
                        let imgW = availableW;
                        let imgH = imgW * (naturalH / naturalW); // ratio real de la imagen

                        // Cap de altura: si la imagen es muy vertical, reducimos el ancho proporcionalmente
                        if (imgH > MAX_IMG_H) {
                            imgH = MAX_IMG_H;
                            imgW = imgH * (naturalW / naturalH);
                        }

                        // Centrar horizontalmente
                        const imgX = MARGIN_X + (availableW - imgW) / 2;
                        doc.addImage(base64Img, 'PNG', imgX, currentY, imgW, imgH);
                        currentY += imgH + 8;
                    } catch (e) {
                        console.warn('[PDF] Error incrustando imagen del modelo:', e);
                    }
                }
            }

            // 8. Tarjeta de Precio (fondo tenue)
            doc.setFillColor(...PDF_COLORS.slate50);
            doc.setDrawColor(...PDF_COLORS.slate200);
            doc.roundedRect(MARGIN_X, currentY, PAGE_WIDTH - MARGIN_X * 2, mantenimientoFmt ? 22 : 16, 2, 2, 'FD');

            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.slate500);
            doc.setFont(FONT_NAME, 'normal');
            doc.text('Precio especial', MARGIN_X + 6, currentY + 8);

            doc.setFontSize(16);
            doc.setTextColor(...PDF_COLORS.slate900);
            doc.setFont(FONT_NAME, 'bold');
            doc.text(normalizePdfText(precioFormateado), MARGIN_X + 6, currentY + 14);

            if (mantenimientoFmt) {
                doc.setFontSize(8.5);
                doc.setTextColor(...PDF_COLORS.slate500);
                doc.setFont(FONT_NAME, 'normal');
                doc.text(
                    `+ ${normalizePdfText(mantenimientoFmt)}/mes mantenimiento`,
                    PAGE_WIDTH - MARGIN_X - 6, currentY + 14, { align: 'right' }
                );
            }
            currentY += (mantenimientoFmt ? 22 : 16) + 8;

            // 9. Cuadricula de caracteristicas (4 celdas)
            const colW     = (PAGE_WIDTH - MARGIN_X * 2) / 4;
            const cardH    = 20;
            const cardData = [
                { label: 'Recamaras',    value: `${recamaras} Rec.`  },
                { label: 'Banos',        value: `${banos} Banos`     },
                { label: 'Construccion', value: `${construccion} m2` },
                { label: 'Terreno',      value: `${terreno} m2`      },
            ];

            cardData.forEach((card, i) => {
                const xCard = MARGIN_X + i * colW;
                doc.setFillColor(...PDF_COLORS.slate50);
                doc.setDrawColor(...PDF_COLORS.slate200);
                doc.roundedRect(xCard, currentY, colW - 2, cardH, 1, 1, 'FD');

                doc.setFontSize(11);
                doc.setTextColor(...PDF_COLORS.slate900);
                doc.setFont(FONT_NAME, 'bold');
                doc.text(card.value, xCard + colW / 2 - 1, currentY + 8, { align: 'center' });

                doc.setFontSize(7.5);
                doc.setTextColor(...PDF_COLORS.slate500);
                doc.setFont(FONT_NAME, 'normal');
                doc.text(card.label, xCard + colW / 2 - 1, currentY + 14, { align: 'center' });
            });
            currentY += cardH + 10;

            // 10. Descripcion de la Propiedad
            doc.setFontSize(11);
            doc.setTextColor(...PDF_COLORS.slate900);
            doc.setFont(FONT_NAME, 'bold');
            doc.text('Descripcion de la Propiedad', MARGIN_X, currentY);
            currentY += 6;

            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.slate500);
            doc.setFont(FONT_NAME, 'normal');
            const textWidth    = PAGE_WIDTH - MARGIN_X * 2;
            const descSafe     = normalizePdfText(descripcion);
            const descLines    = doc.splitTextToSize(descSafe, textWidth);
            const maxDescLines = 8;
            doc.text(descLines.slice(0, maxDescLines), MARGIN_X, currentY);
            currentY += descLines.slice(0, maxDescLines).length * 4.5 + 8;

            // 11. Amenidades (condicional)
            if (amenidades.length > 0) {
                doc.setFontSize(11);
                doc.setTextColor(...PDF_COLORS.slate900);
                doc.setFont(FONT_NAME, 'bold');
                doc.text('Caracteristicas Incluidas', MARGIN_X, currentY);
                currentY += 6;

                const colAmen = 3;
                const amenW   = (PAGE_WIDTH - MARGIN_X * 2) / colAmen;
                amenidades.forEach((amenidad, i) => {
                    const col = i % colAmen;
                    const row = Math.floor(i / colAmen);
                    const xAm = MARGIN_X + col * amenW;
                    const yAm = currentY + row * 6;

                    doc.setFontSize(8.5);
                    doc.setTextColor(...PDF_COLORS.slate500);
                    doc.setFont(FONT_NAME, 'normal');
                    doc.text(`- ${normalizePdfText(amenidad)}`, xAm, yAm);
                });
                const amenRows = Math.ceil(amenidades.length / colAmen);
                currentY += amenRows * 6 + 8;
            }

            // 12. CTA: Enlace a la pagina en linea del modelo
            const modelUrl = window?.location?.href || 'https://inmuebleadvisor.com';
            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.blue600);
            doc.setFont(FONT_NAME, 'normal');
            doc.textWithLink('Ver modelo en linea: ' + modelUrl, MARGIN_X, currentY, { url: modelUrl });

            // 13. Pie de pagina (todas las paginas)
            drawPdfFooter(doc);

            // 14. Compartir o descargar (centralizado en pdfUtils)
            const filenameSafe = (modelo.nombre_modelo || 'Modelo').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            await shareOrDownloadPDF(
                doc,
                `Ficha_${filenameSafe}.pdf`,
                `Ficha Tecnica - ${modelo.nombre_modelo}`,
                `Te comparto la ficha tecnica del modelo ${modelo.nombre_modelo} en Inmueble Advisor.`
            );

        } catch (error) {
            console.error('[PDF] Error generando ficha del modelo:', error);
            setErrorPDF('No pudimos generar el PDF. Intentalo de nuevo.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return { generateModelPDF, isGeneratingPDF, errorPDF };
};
