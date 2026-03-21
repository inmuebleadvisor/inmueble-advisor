import { useState } from 'react';
import { modelPresentationService } from '../services/service.provider';
import { resolveImageUrl, getBase64ImageFromUrl } from '../utils/imageUtils';
import { drawPdfBrandHeader, drawPdfFooter, shareOrDownloadPDF, PDF_COLORS } from '../utils/pdfUtils';

/**
 * Sanitiza texto para compatibilidad con la fuente Helvetica nativa de jsPDF.
 * jsPDF usa ISO-8859-1 (Latin-1). Los caracteres como á, é, í, ó, ú, ñ, ¿, ¡, m²
 * son soportados de forma nativa. Solo se eliminan emojis y caracteres Unicode fuera
 * de este rango que causan artefactos visuales ("Ø=ÜÍ").
 *
 * @param {string|number} str
 * @returns {string}
 */
const sanitizePdfText = (str) => {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[^\x00-\xFF]/g, '').trim();
};

/**
 * @hook useShareModelPDF
 * @description Custom Hook para generar la ficha técnica de un modelo de vivienda en PDF.
 *
 * Patrón: Lazy Load de jsPDF para no penalizar el bundle inicial.
 * Datos: Consume EXCLUSIVAMENTE ModelPresentationService (DRY — sin duplicar lógica defensiva).
 * Share: Delega el Blob + Web Share API a pdfUtils.shareOrDownloadPDF (DRY).
 * Fuente: Helvetica con sanitizePdfText() — sin dependencias externas de CDN.
 * Layout: 2 columnas en la cabecera (imagen izquierda / tarjeta precio derecha).
 *
 * @returns {{ generateModelPDF: Function, isGeneratingPDF: boolean, errorPDF: string|null }}
 */
export const useShareModelPDF = () => {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [errorPDF, setErrorPDF]               = useState(null);

    /**
     * Genera y descarga (o comparte) el PDF de la ficha técnica de un modelo.
     *
     * @param {Object} modelo      - Objeto del modelo de Firestore.
     * @param {Object} desarrollo  - Objeto del desarrollo al que pertenece el modelo.
     * @param {string} whatsappUrl - URL de contacto de WhatsApp (extraída en el componente padre
     *                               vía useWhatsAppContact para respetar las Rules of Hooks).
     * @returns {Promise<void>}
     */
    const generateModelPDF = async (modelo, desarrollo, whatsappUrl) => {
        if (!modelo) return;

        try {
            setIsGeneratingPDF(true);
            setErrorPDF(null);

            // 1. Lazy load: jsPDF solo se descarga al primer uso
            const { jsPDF } = await import('jspdf');

            // 2. Datos a través del servicio (Single Source of Truth, DRY)
            const precioFormateado = modelPresentationService.formatoMoneda(modelo.precioNumerico);
            const mantenimientoVal = modelo.precios?.mantenimientoMensual;
            const mantenimientoFmt = mantenimientoVal > 0 ? modelPresentationService.formatoMoneda(mantenimientoVal) : null;
            const { recamaras, banos, construccion, terreno } = modelPresentationService.getCaracteristicas(modelo);
            const { descripcion, amenidades }                 = modelPresentationService.getDescripcionYAmenidades(modelo);

            // 3. Inicializar documento A4 Portrait
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Helvetica: fuente incluida en jsPDF, sin dependencias externas de CDN.
            // sanitizePdfText() se aplica a todo texto de Firestore para evitar emojis que rompen jsPDF.
            const FONT_NAME  = 'helvetica';

            // ── Constantes de Layout ──────────────────────────────────────────────
            // Ancho disponible = 210 - (14*2) = 182mm
            const MARGIN_X    = 14;
            const PAGE_WIDTH  = 210;
            const AVAILABLE_W = PAGE_WIDTH - MARGIN_X * 2;  // 182mm
            const COL_GAP     = 5;                           // espacio entre columnas
            const IMG_COL_W   = 110;                         // columna imagen (izquierda)
            const CARD_COL_W  = AVAILABLE_W - IMG_COL_W - COL_GAP; // 67mm (columna precio derecha)
            const MAX_IMG_H   = 95;  // tope altura imagen (mm)

            let currentY = 26;

            // ── 3B. Preparar datos para el encabezado persistente ────────────
            const headerInfo = {
                nombre: sanitizePdfText(modelo.nombre_modelo || 'Modelo'),
                desarrollo: sanitizePdfText(desarrollo?.nombre || ''),
                entrega: typeof modelo.esPreventa === 'boolean'
                    ? (modelo.esPreventa ? 'Preventa' : 'Entrega Inmediata')
                    : ''
            };

            // 4. Encabezado de marca (barra + logo + info modelo)
            await drawPdfBrandHeader(doc, headerInfo);

            // 5. Espacio dinámico del header (Margen amplio para evitar colisión)
            currentY = 45;

            // ══════════════════════════════════════════════════════════════════════
            // 6. HERO: Columna Izquierda (Imagen) + Columna Derecha (Tarjeta Precio)
            //    Se dibuja en paralelo a la misma Y de inicio. Al final se avanza
            //    al Y mas grande de las dos columnas.
            // ══════════════════════════════════════════════════════════════════════
            const heroStartY   = currentY;
            let   endYImg      = heroStartY;  // Y final de la columna de imagen
            let   endYCard     = heroStartY;  // Y final de la tarjeta de precio

            // ── 6A. IMAGEN (Izquierda, X = MARGIN_X) ──────────────────────────
            const imagenUrl = modelo.imagenes?.[0];
            if (imagenUrl) {
                const resolvedUrl = resolveImageUrl(imagenUrl);
                const { dataUrl: base64Img, width: naturalW, height: naturalH } = await getBase64ImageFromUrl(resolvedUrl);
                if (base64Img && naturalW > 0 && naturalH > 0) {
                    try {
                        let imgW = IMG_COL_W;
                        let imgH = imgW * (naturalH / naturalW); // ratio real

                        // Cap de altura para fotos muy verticales
                        if (imgH > MAX_IMG_H) {
                            imgH = MAX_IMG_H;
                            imgW = imgH * (naturalW / naturalH);
                        }

                        // Centrar horizontalmente dentro de la columna izquierda
                        const imgX = MARGIN_X + (IMG_COL_W - imgW) / 2;
                        doc.addImage(base64Img, 'PNG', imgX, heroStartY, imgW, imgH);
                        endYImg = heroStartY + imgH;
                    } catch (e) {
                        console.warn('[PDF] Error incrustando imagen del modelo:', e);
                    }
                }
            }

            // ── 6B. TARJETA DE PRECIO (Derecha, X = MARGIN_X + IMG_COL_W + COL_GAP) ──
            const cardX = MARGIN_X + IMG_COL_W + COL_GAP;

            // ── Pre-calcular la altura total de la tarjeta ──────────────────────
            // Para dibujar el fondo ANTES que el texto (evita que el rect tape el contenido).
            const CARD_PADDING_TOP    = 6;
            const ROW_LABEL           = 6;   // "PRECIO ESPECIAL"
            const ROW_PRECIO          = 8;   // precio grande (font 18, linea alta)
            const ROW_MONEDA          = 5;   // "MONEDA NACIONAL MXN"
            const ROW_MANT            = mantenimientoFmt ? 4 : 0;
            const ROW_GAP             = 4;   // padding antes de botones
            const BTN_H               = 9;
            const BTN_GAP             = 3;
            const ROW_DISCLAIMER      = 6;
            const CARD_PADDING_BOTTOM = 4;

            const totalCardH = CARD_PADDING_TOP + ROW_LABEL + ROW_PRECIO + ROW_MONEDA
                             + ROW_MANT + ROW_GAP + BTN_H + BTN_GAP + BTN_H
                             + ROW_DISCLAIMER + CARD_PADDING_BOTTOM;

            // 1. Dibujar fondo PRIMERO para que el texto quede encima
            doc.setFillColor(...PDF_COLORS.slate50);
            doc.setDrawColor(...PDF_COLORS.slate200);
            doc.setLineWidth(0.3);
            doc.roundedRect(cardX, heroStartY, CARD_COL_W, totalCardH, 2, 2, 'FD');

            // 2. Dibujar contenido ENCIMA del fondo
            let cardY = heroStartY + CARD_PADDING_TOP;

            // Label "PRECIO ESPECIAL"
            doc.setFontSize(7.5);
            doc.setTextColor(...PDF_COLORS.slate500);
            doc.setFont(FONT_NAME, 'normal');
            doc.text('PRECIO ESPECIAL', cardX + 4, cardY);
            cardY += ROW_LABEL;

            // Precio grande
            doc.setFontSize(18);
            doc.setTextColor(...PDF_COLORS.slate900);
            doc.setFont(FONT_NAME, 'bold');
            doc.text(sanitizePdfText(precioFormateado), cardX + 4, cardY);
            cardY += ROW_PRECIO;

            // "MONEDA NACIONAL MXN"
            doc.setFontSize(7);
            doc.setTextColor(...PDF_COLORS.slate500);
            doc.setFont(FONT_NAME, 'normal');
            doc.text('MONEDA NACIONAL MXN', cardX + 4, cardY);
            cardY += ROW_MONEDA;

            // Mantenimiento (condicional)
            if (mantenimientoFmt) {
                doc.setFontSize(7.5);
                doc.setTextColor(...PDF_COLORS.slate500);
                doc.setFont(FONT_NAME, 'normal');
                doc.text(`+ ${sanitizePdfText(mantenimientoFmt)}/mes mantenimiento`, cardX + 4, cardY);
                cardY += ROW_MANT;
            }

            cardY += ROW_GAP;

            // ── Botón WhatsApp (verde relleno, hipervínculo real) ─────────────
            const btnW = CARD_COL_W - 8;
            const btnX = cardX + 4;

            doc.setFillColor(...PDF_COLORS.green500);
            doc.setDrawColor(...PDF_COLORS.green500);
            doc.setLineWidth(0);
            doc.roundedRect(btnX, cardY, btnW, BTN_H, 2, 2, 'FD');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFont(FONT_NAME, 'bold');
            doc.text('Contactar por WhatsApp', btnX + btnW / 2, cardY + 6, { align: 'center' });
            if (whatsappUrl) {
                doc.link(btnX, cardY, btnW, BTN_H, { url: whatsappUrl });
            }
            cardY += BTN_H + BTN_GAP;

            // ── Botón Agendar (borde azul outline, hipervínculo a /agendar/:id) ─
            const scheduleUrl = `${window.location.origin}/agendar/${modelo.id}`;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...PDF_COLORS.blue600);
            doc.setLineWidth(0.5);
            doc.roundedRect(btnX, cardY, btnW, BTN_H, 2, 2, 'FD');
            doc.setFontSize(8);
            doc.setTextColor(...PDF_COLORS.blue600);
            doc.setFont(FONT_NAME, 'bold');
            doc.text('Agenda tu Recorrido', btnX + btnW / 2, cardY + 6, { align: 'center' });
            doc.link(btnX, cardY, btnW, BTN_H, { url: scheduleUrl });
            cardY += BTN_H + 2;

            // Disclaimer
            doc.setFontSize(6.5);
            doc.setTextColor(...PDF_COLORS.slate400);
            doc.setFont(FONT_NAME, 'normal');
            doc.text('* Sujeto a disponibilidad', cardX + 4, cardY);

            endYCard = heroStartY + totalCardH;

            // ══════════════════════════════════════════════════════════════════════
            // 7. TARJETA "PLAN HIPOTECARIO" - Apilada en la columna derecha
            //    Se coloca justo debajo del cuadro de precio, dentro de la misma
            //    columna derecha (cardX, CARD_COL_W). La imagen sigue a la izquierda.
            //    DRY: mismas fórmulas que FinanciamientoWidget.jsx
            // ══════════════════════════════════════════════════════════════════════
            if (modelo.precioNumerico > 0) {
                const PORCENTAJE_ENGANCHE = 0.10;   // FINANZAS.PORCENTAJE_ENGANCHE_MINIMO
                const FACTOR_MENSUALIDAD  = 11000;  // FINANZAS.FACTOR_MENSUALIDAD_POR_MILLON
                const enganche    = modelo.precioNumerico * PORCENTAJE_ENGANCHE;
                const mensualidad = (modelo.precioNumerico * 0.9) / 1000000 * FACTOR_MENSUALIDAD;

                const fmtEnganche    = modelPresentationService.formatoMoneda(enganche);
                const fmtMensualidad = modelPresentationService.formatoMoneda(mensualidad);

                const AMBER      = [245, 158, 11];
                const AMBER_DARK = [180, 115, 0];
                const GAP_CARDS  = 3;  // espacio entre los dos cuadros de la columna derecha

                // ── Posición: justo debajo del pricing card, misma columna ──────
                const planStartY   = endYCard + GAP_CARDS;
                const PLAN_CARD_H  = 47;  // altura pre-calculada: padding + título + 2 filas + disc + btn

                // 1. Fondo PRIMERO (rect antes del texto, misma lección del pricing card)
                doc.setFillColor(...PDF_COLORS.slate50);
                doc.setDrawColor(...PDF_COLORS.slate200);
                doc.setLineWidth(0.3);
                doc.roundedRect(cardX, planStartY, CARD_COL_W, PLAN_CARD_H, 2, 2, 'FD');

                let planY = planStartY + 6;

                // 2. Título
                doc.setFontSize(8.5);
                doc.setTextColor(...PDF_COLORS.slate900);
                doc.setFont(FONT_NAME, 'bold');
                doc.text('PLAN HIPOTECARÍO', cardX + 4, planY);
                planY += 6;

                // 3. Fila Enganche
                doc.setFontSize(7.5);
                doc.setTextColor(...PDF_COLORS.slate500);
                doc.setFont(FONT_NAME, 'normal');
                doc.text('Enganche (10%):', cardX + 4, planY);
                doc.setFont(FONT_NAME, 'bold');
                doc.setTextColor(...PDF_COLORS.slate900);
                // Precio alineado a la derecha dentro de la columna
                doc.text(sanitizePdfText(fmtEnganche), cardX + CARD_COL_W - 4, planY, { align: 'right' });
                planY += 6;

                // 4. Fila Mensualidad
                doc.setFont(FONT_NAME, 'normal');
                doc.setTextColor(...PDF_COLORS.slate500);
                doc.text('Mensualidad Aprox:', cardX + 4, planY);
                doc.setFont(FONT_NAME, 'bold');
                doc.setTextColor(...AMBER);
                doc.text(sanitizePdfText(fmtMensualidad), cardX + CARD_COL_W - 4, planY, { align: 'right' });
                planY += 5;

                // 5. Disclaimer
                doc.setFontSize(5.5);
                doc.setTextColor(...PDF_COLORS.slate400);
                doc.setFont(FONT_NAME, 'normal');
                const disclaimerLines = doc.splitTextToSize(
                    '*Estimacion bancaria a 20 anos. Sujeto a historial crediticio.',
                    CARD_COL_W - 8
                );
                doc.text(disclaimerLines, cardX + 4, planY);
                planY += disclaimerLines.length * 3.5 + 2;

                // 6. Botón CTA amber (mismo ancho que los botones del pricing card)
                const simUrl  = `${window.location.origin}/simular/${modelo.id}`;
                const amrBtnW = CARD_COL_W - 8;
                const amrBtnH = 9;
                doc.setFillColor(...AMBER);
                doc.setDrawColor(...AMBER);
                doc.setLineWidth(0);
                doc.roundedRect(cardX + 4, planY, amrBtnW, amrBtnH, 2, 2, 'FD');
                doc.setFontSize(7.5);
                doc.setTextColor(...AMBER_DARK);
                doc.setFont(FONT_NAME, 'bold');
                doc.text('Pre-Calificar Credito', cardX + 4 + amrBtnW / 2, planY + 6, { align: 'center' });
                doc.link(cardX + 4, planY, amrBtnW, amrBtnH, { url: simUrl });

                // endYCard engloba AMBOS cuadros de la columna derecha
                endYCard = planStartY + PLAN_CARD_H;
            }

            // ── Avanzar al Y mayor entre las dos columnas del hero ───────────
            // endYCard engloba pricing card + plan hipotecario (ambos en columna derecha)
            currentY = Math.max(endYImg, endYCard) + 8;

            // 8. Cuadrícula de características (4 celdas, fila completa)
            const colW     = AVAILABLE_W / 4;
            const cardH    = 20;
            const cardData = [
                { label: 'Recámaras',    value: `${recamaras} Rec.`     },
                { label: 'Baños',        value: `${banos} Baños`        },
                { label: 'Construcción', value: `${construccion} m²`    },
                { label: 'Terreno',      value: `${terreno} m²`         },
            ];

            cardData.forEach((card, i) => {
                const xCard = MARGIN_X + i * colW;
                doc.setFillColor(...PDF_COLORS.slate50);
                doc.setDrawColor(...PDF_COLORS.slate200);
                doc.setLineWidth(0.2);
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

            // 8. Descripción de la Propiedad
            doc.setFontSize(11);
            doc.setTextColor(...PDF_COLORS.slate900);
            doc.setFont(FONT_NAME, 'bold');
            doc.text('Descripción de la Propiedad', MARGIN_X, currentY);
            currentY += 6;

            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.slate500);
            doc.setFont(FONT_NAME, 'normal');
            const descSafe     = sanitizePdfText(descripcion);
            const descLines    = doc.splitTextToSize(descSafe, AVAILABLE_W);
            const maxDescLines = 8;
            doc.text(descLines.slice(0, maxDescLines), MARGIN_X, currentY);
            currentY += descLines.slice(0, maxDescLines).length * 4.5 + 8;

            // 9. Características Incluidas (Amenidades en verde bold — KISS, sin Flow-wrap)
            if (amenidades.length > 0) {
                doc.setFontSize(11);
                doc.setTextColor(...PDF_COLORS.slate900);
                doc.setFont(FONT_NAME, 'bold');
                doc.text('Características Incluidas', MARGIN_X, currentY);
                currentY += 6;

                const colAmen = 3;
                const amenW   = AVAILABLE_W / colAmen;
                amenidades.forEach((amenidad, i) => {
                    const col = i % colAmen;
                    const row = Math.floor(i / colAmen);
                    const xAm = MARGIN_X + col * amenW;
                    const yAm = currentY + row * 6;

                    // Verde + negrita para imitar visualmente las "pills" de la web (KISS)
                    doc.setFontSize(8.5);
                    doc.setTextColor(...PDF_COLORS.green600);
                    doc.setFont(FONT_NAME, 'bold');
                    doc.text(`+ ${sanitizePdfText(amenidad)}`, xAm, yAm);
                });
                const amenRows = Math.ceil(amenidades.length / colAmen);
                currentY += amenRows * 6 + 8;
            }

            // 10. CTA: Enlace a la página en línea del modelo
            const modelUrl = window?.location?.href || 'https://inmuebleadvisor.com';
            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.blue600);
            doc.setFont(FONT_NAME, 'normal');
            doc.textWithLink('Ver modelo en línea: ' + modelUrl, MARGIN_X, currentY, { url: modelUrl });

            // Footer se dibuja al final una sola vez (ver llamada unificada al cierre de todas las páginas)

            // ══════════════════════════════════════════════════════════════════════
            // 11b. PÁGINA DE PLANOS ARQUITECTÓNICOS
            //      Se agrega solo si el modelo tiene plantas con URL válida.
            //      DRY: reutiliza getBase64ImageFromUrl y resolveImageUrl igual que
            //      la foto principal. Descarga en paralelo con Promise.all.
            // ══════════════════════════════════════════════════════════════════════
            // modelo.plantas = string[] (URLs directas) según Modelo.js::data.media.plantasArquitectonicas
            const validPlantas = (modelo.plantas || [])
                .filter(url => typeof url === 'string' && url.trim() !== '')
                .slice(0, 4);

            console.log('[PDF] plantas en modelo:', modelo.plantas?.length ?? 'undefined',
                '| validas con URL:', validPlantas.length);

            if (validPlantas.length > 0) {
                const plantaResults = await Promise.all(
                    validPlantas.map(async (url, i) => {
                        try {
                            const resolved = resolveImageUrl(url);
                            const result   = await getBase64ImageFromUrl(resolved);
                            return { ...result, nombre: `Plano ${i + 1}` };
                        } catch {
                            return { dataUrl: null, width: 0, height: 0, nombre: `Plano ${i + 1}` };
                        }
                    })
                );

                const validResults = plantaResults.filter(r => r.dataUrl && r.width > 0);
                console.log('[PDF] plantas descargadas OK:', validResults.length, '| fallidas:', plantaResults.length - validResults.length);

                if (validResults.length > 0) {
                    doc.addPage();
                    await drawPdfBrandHeader(doc, headerInfo);

                    let plantasY = 45; // Margen amplio para evitar pelea con el encabezado dinámico

                    // ── Título dinámico ────────────────────────────────────────────
                    const tituloPlantas = validResults.length === 1 ? 'Plano Arquitectónico' : 'Planos Arquitectónicos';
                    const subtituloPlantas = `Distribución del modelo ${sanitizePdfText(modelo.nombre_modelo || '')}`;

                    doc.setFontSize(16);
                    doc.setTextColor(...PDF_COLORS.slate900);
                    doc.setFont(FONT_NAME, 'bold');
                    doc.text(tituloPlantas, MARGIN_X, plantasY);
                    plantasY += 6;

                    doc.setFontSize(9);
                    doc.setTextColor(...PDF_COLORS.slate500);
                    doc.setFont(FONT_NAME, 'normal');
                    doc.text(subtituloPlantas, MARGIN_X, plantasY);
                    plantasY += 4;

                    doc.setDrawColor(...PDF_COLORS.slate200);
                    doc.setLineWidth(0.2);
                    doc.line(MARGIN_X, plantasY, PAGE_WIDTH - MARGIN_X, plantasY);
                    plantasY += 6;

                    // ── Cuadrícula 2×2 ────────────────────────────────────────────
                    // 182mm disponibles / 2 columnas = 91mm, menos gap de 4mm → 87mm por celda
                    const GRID_COLS    = 2;
                    const GRID_GAP     = 5;
                    const CELL_W       = (AVAILABLE_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS; // ~88.5mm
                    const MAX_CELL_H   = 100; // tope de alto en mm para respetar proporciones
                    const LABEL_H      = 7;   // espacio reservado para la etiqueta de texto

                    validResults.forEach((planta, i) => {
                        const col  = i % GRID_COLS;
                        const row  = Math.floor(i / GRID_COLS);
                        const cellX = MARGIN_X + col * (CELL_W + GRID_GAP);

                        // Calcular la Y del inicio de esta fila
                        // (Se avanza cuando cambia la fila, al final del bloque)
                        const cellStartY = plantasY + row * (MAX_CELL_H + LABEL_H + GRID_GAP);

                        // ── Calcular dimensiones respetando el ratio natural ─────
                        let imgW = CELL_W;
                        let imgH = CELL_W * (planta.height / planta.width);

                        if (imgH > MAX_CELL_H) {
                            imgH = MAX_CELL_H;
                            imgW = MAX_CELL_H * (planta.width / planta.height);
                        }

                        // Centrar horizontalmente dentro de la celda
                        const imgX = cellX + (CELL_W - imgW) / 2;

                        try {
                            doc.addImage(planta.dataUrl, 'PNG', imgX, cellStartY, imgW, imgH);
                        } catch (e) {
                            console.warn(`[PDF] Error incrustando planta ${i}:`, e);
                        }

                        // ── Etiqueta debajo de la imagen ─────────────────────────
                        const labelText = sanitizePdfText(
                            planta.nombre || `Planta ${i + 1}`
                        );
                        doc.setFontSize(8);
                        doc.setTextColor(...PDF_COLORS.slate500);
                        doc.setFont(FONT_NAME, 'normal');
                        doc.text(labelText, cellX + CELL_W / 2, cellStartY + imgH + 5, { align: 'center' });
                    });

                    // El footer unificado se llama al final del hook, después de addPage()
                }
            }

            // 12. Footer UNIFICADO — Se llama una sola vez DESPUÉS de que todas
            //     las páginas existen. drawPdfFooter itera todas ellas internamente
            //     y escribe "Página N de TOTAL" con el total correcto.
            drawPdfFooter(doc);

            // 12. Compartir o descargar (centralizado en pdfUtils)
            const filenameSafe = (modelo.nombre_modelo || 'Modelo').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            await shareOrDownloadPDF(
                doc,
                `Ficha_${filenameSafe}.pdf`,
                `Ficha Técnica - ${modelo.nombre_modelo}`,
                `Te comparto la ficha técnica del modelo ${modelo.nombre_modelo} en Inmueble Advisor.`
            );

        } catch (error) {
            console.error('[PDF] Error generando ficha del modelo:', error);
            setErrorPDF('No pudimos generar el PDF. Inténtalo de nuevo.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return { generateModelPDF, isGeneratingPDF, errorPDF };
};
