import { useState } from 'react';
import { formatoMoneda } from '../utils/formatters';
import { THEME_ASSETS } from '../config/theme.config';

import { resolveImageUrl, getBase64ImageFromUrl } from '../utils/imageUtils';

/**
 * Custom Hook para generar simulación hipotecaria PDF con diseño Premium
 * Utiliza carga perezosa para bibliotecas (Lazy Load).
 */
export const useShareSimulatorPDF = () => {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [errorPDF, setErrorPDF] = useState(null);

    const generateAndSharePDF = async (dataPayload) => {
        const {
            propertyData,
            hasModifiedPrice,
            price,
            term,
            downPayment,
            result,
            promedioMensualidad,
            extraPayment,
            acceleratedResult,
            bankName = 'BANORTE',
            productName = 'Hipoteca Fuerte',
            interestRate = '10.15%',
            catValue = '12.3%'
        } = dataPayload;

        try {
            setIsGeneratingPDF(true);
            setErrorPDF(null);

            // 1. Lazy load
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            // 2. Init Document A4
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const marginX = 14;
            const logoWidth = 45; // mm
            const logoHeight = 15; // mm
            const pageWidth = 210;
            let currentY = 26;

            // Brand top decorator bar - Premium touch
            doc.setFillColor(30, 41, 59); // slate-800
            doc.rect(0, 0, 210, 8, 'F');

            // --- 0. Logotipo Institucional (Esquina Superior Derecha) ---
            try {
                // Usamos el logo institucional definido en el tema
                const logoBase64 = await getBase64ImageFromUrl(THEME_ASSETS.logoDark);
                if (logoBase64) {
                    const logoX = pageWidth - marginX - logoWidth;
                    const logoY = 11;
                    // Se usa JPEG/PNG dependiendo de la fuente, addImage detecta base64.
                    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
                    // Añadimos el enlace sobre la imagen
                    doc.link(logoX, logoY, logoWidth, logoHeight, { url: 'https://inmuebleadvisor.com' });
                }
            } catch (err) {
                console.warn("Could not add logo to PDF", err);
            }

            // Header Info
            doc.setFontSize(26);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.text('Precotización Hipotecaria', marginX, currentY);
            currentY += 8;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'normal');
            doc.text(`Generado por Inmueble Advisor en base a ${productName} de: ${bankName}`, marginX, currentY);
            currentY += 15;

            // --- Tarjeta de Propiedad ---
            if (propertyData && !hasModifiedPrice) {
                // Aumentamos la card para la fila extra de características
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(marginX, currentY, 182, 50, 3, 3, 'FD');

                let textStartX = marginX + 8;

                if (propertyData.image) {
                    const resolvedUrl = resolveImageUrl(propertyData.image);
                    const base64Img = await getBase64ImageFromUrl(resolvedUrl);
                    if (base64Img) {
                        try {
                            doc.addImage(base64Img, 'JPEG', marginX + 6, currentY + 6, 44, 38);
                            textStartX = marginX + 56;
                        } catch (e) {
                            console.warn("Fallo incrustando imagen PDF", e);
                        }
                    }
                }

                doc.setFontSize(15);
                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.text(propertyData.title || '', textStartX, currentY + 13);

                if (propertyData.developmentName) {
                    doc.setFontSize(11);
                    doc.setTextColor(71, 85, 105);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Desarrollo: ${propertyData.developmentName}`, textStartX, currentY + 21);
                }

                if (propertyData.subtitle) {
                    doc.setFontSize(10);
                    doc.setTextColor(100, 116, 139);
                    const subtypeText = propertyData.subtitle + (propertyData.deliveryStatus ? ` - ${propertyData.deliveryStatus}` : '');
                    doc.text(subtypeText, textStartX, currentY + 29);
                }

                // --- Fila de características: recámaras, baños, m² ---
                const features = [];
                if (propertyData.bedrooms) features.push(`${propertyData.bedrooms} Rec.`);
                if (propertyData.bathrooms) features.push(`${propertyData.bathrooms} Baños`);
                if (propertyData.area) features.push(`${propertyData.area} m²`);

                if (features.length > 0) {
                    doc.setFontSize(9);
                    doc.setTextColor(71, 85, 105);
                    doc.setFont('helvetica', 'normal');
                    // Separador visual
                    doc.setDrawColor(226, 232, 240);
                    doc.line(textStartX, currentY + 33, marginX + 177, currentY + 33);
                    doc.text(features.join('   |   '), textStartX, currentY + 42);

                    // Enlace a la propiedad
                    if (propertyData.url) {
                        doc.setTextColor(37, 99, 235); // blue-600
                        const safeUrl = propertyData.url.startsWith('http') ? propertyData.url : `https://${propertyData.url}`;
                        doc.textWithLink('Ver modelo en línea', marginX + 177, currentY + 42, { url: safeUrl, align: 'right' });
                    }
                }

                currentY += 58;
            } else {
                currentY += 5;
            }

            // --- Sección: Datos del Crédito ---
            const engancheEstimado = result?.desembolsoInicial || (downPayment + (price * 0.051) + 5800 + 750);
            const centerX = pageWidth / 2;

            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.text('Datos del Crédito', centerX, currentY, { align: 'center' });
            currentY += 5;

            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(marginX, currentY, 182, 22, 2, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');

            const colWidth = 182 / 4;
            // Titulos Datos Crédito - CENTRADOS
            doc.text('Valor Vivienda', marginX + (colWidth / 2), currentY + 8, { align: 'center' });
            doc.text('Enganche Total', marginX + colWidth + (colWidth / 2), currentY + 8, { align: 'center' });
            doc.text('Monto Préstamo', marginX + (colWidth * 2) + (colWidth / 2), currentY + 8, { align: 'center' });
            doc.text('Plazo', marginX + (colWidth * 3) + (colWidth / 2), currentY + 8, { align: 'center' });

            // Valores Datos Crédito - CENTRADOS
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text(formatoMoneda(price), marginX + (colWidth / 2), currentY + 16, { align: 'center' });
            doc.text(formatoMoneda(engancheEstimado), marginX + colWidth + (colWidth / 2), currentY + 16, { align: 'center' });
            doc.text(formatoMoneda(result?.montoCredito || (price - downPayment)), marginX + (colWidth * 2) + (colWidth / 2), currentY + 16, { align: 'center' });
            doc.text(`${term} años`, marginX + (colWidth * 3) + (colWidth / 2), currentY + 16, { align: 'center' });

            currentY += 32;

            // --- Sección: Condiciones Financieras ---
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text('Condiciones Financieras', centerX, currentY, { align: 'center' });
            currentY += 5;

            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(marginX, currentY, 182, 22, 2, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');

            const colWidthFin = 182 / 3;
            // Titulos Condiciones - CENTRADOS
            doc.text('Tasa Anual', marginX + (colWidthFin / 2), currentY + 8, { align: 'center' });
            doc.text('CAT Promedio', marginX + colWidthFin + (colWidthFin / 2), currentY + 8, { align: 'center' });
            doc.text('Mensualidad', marginX + (colWidthFin * 2) + (colWidthFin / 2), currentY + 8, { align: 'center' });

            // Valores Condiciones - CENTRADOS
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text(interestRate, marginX + (colWidthFin / 2), currentY + 16, { align: 'center' });
            doc.text(catValue, marginX + colWidthFin + (colWidthFin / 2), currentY + 16, { align: 'center' });

            // Mensualidad en AZUL - CENTRADA
            doc.setTextColor(37, 99, 235); // blue-600
            doc.text(formatoMoneda(promedioMensualidad), marginX + (colWidthFin * 2) + (colWidthFin / 2), currentY + 16, { align: 'center' });

            currentY += 32;


            // --- Ahorro Acelerado (Sección Condicional) ---
            if (acceleratedResult && acceleratedResult.mesesAhorrados > 0) {
                const boxHeight = 22;
                doc.setFillColor(240, 253, 244); // green-50
                doc.setDrawColor(187, 247, 208); // green-200
                doc.roundedRect(marginX, currentY, 182, boxHeight, 2, 2, 'FD');

                const centerX = pageWidth / 2;

                // Encabezado centrado
                doc.setFontSize(11);
                doc.setTextColor(21, 128, 61); // green-700
                doc.setFont('helvetica', 'bold');
                doc.text('¿Quieres pagar menos intereses?', centerX, currentY + 8, { align: 'center' });

                // Segunda línea con números en negrita y texto normal, todo centrado
                doc.setFontSize(9.5);
                doc.setTextColor(21, 128, 61);

                // Fragmentos de texto
                const p1 = "Si abonas ";
                const p2 = `${formatoMoneda(extraPayment)}`;
                const p3 = " extras cada mes. Ahorrarías ";
                const p4 = `${formatoMoneda(acceleratedResult.interesAhorrado)}`;
                const p5 = " en intereses y terminarías de pagar ";
                const p6 = `${(acceleratedResult.mesesAhorrados / 12).toFixed(1)}`;
                const p7 = " años antes.";

                // Cálculo de anchos para centrado manual
                doc.setFont('helvetica', 'normal');
                const w1 = doc.getTextWidth(p1);
                const w3 = doc.getTextWidth(p3);
                const w5 = doc.getTextWidth(p5);
                const w7 = doc.getTextWidth(p7);
                doc.setFont('helvetica', 'bold');
                const w2 = doc.getTextWidth(p2);
                const w4 = doc.getTextWidth(p4);
                const w6 = doc.getTextWidth(p6);

                const totalLineWidth = w1 + w2 + w3 + w4 + w5 + w6 + w7;
                let drawX = centerX - (totalLineWidth / 2);
                const textY = currentY + 15;

                // Renderizado por partes (Chunk rendering)
                doc.setFont('helvetica', 'normal');
                doc.text(p1, drawX, textY); drawX += w1;
                doc.setFont('helvetica', 'bold');
                doc.text(p2, drawX, textY); drawX += w2;
                doc.setFont('helvetica', 'normal');
                doc.text(p3, drawX, textY); drawX += w3;
                doc.setFont('helvetica', 'bold');
                doc.text(p4, drawX, textY); drawX += w4;
                doc.setFont('helvetica', 'normal');
                doc.text(p5, drawX, textY); drawX += w5;
                doc.setFont('helvetica', 'bold');
                doc.text(p6, drawX, textY); drawX += w6;
                doc.setFont('helvetica', 'normal');
                doc.text(p7, drawX, textY);

                currentY += boxHeight + 10;
            }

            // --- Tabla de Pagos ---
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text('Tabla de Pagos del Crédito', marginX, currentY);
            currentY += 5;

            // Nota aclaratoria cuando hay plan de ahorro activo
            if (acceleratedResult && acceleratedResult.mesesAhorrados > 0) {
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139); // slate-500
                doc.setFont('helvetica', 'italic');
                doc.text('*Pagos en base a crédito base sin considerar Plan de ahorro', marginX, currentY);
                currentY += 6;
            }

            const tableRows = result.tablaAmortizacion.map(row => [
                row.mes,
                formatoMoneda(row.saldoInicial),
                formatoMoneda(row.interes),
                formatoMoneda(row.capital),
                formatoMoneda(row.segurosComisiones),
                formatoMoneda(row.pagoMensual),
                formatoMoneda(row.saldoFinal)
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Mes', 'Saldo Inicial', 'Interés', 'Capital', 'Comis/Segs', 'Pago Total', 'Saldo Final']],
                body: tableRows.slice(0, 240), // Mostramos hasta 20 años de tabla
                theme: 'striped',
                headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5, // Más espacio entre celdas (aire visual)
                    valign: 'middle'
                },
                columnStyles: {
                    0: { halign: 'center' },
                    5: { fontStyle: 'bold' }
                },
                margin: {
                    left: marginX,
                    right: marginX,
                    bottom: 35 // Margen inferior amplio para no chocar con el pie de página
                },
                pageBreak: 'auto'
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184); // slate-400

                const footerY = 282;
                const footerLineY = 278;
                const rightMarginX = pageWidth - marginX;

                // Línea decorativa superior en el footer
                doc.setDrawColor(226, 232, 240); // slate-200
                doc.setLineWidth(0.1);
                doc.line(marginX, footerLineY, rightMarginX, footerLineY);

                const disclaimer = "La presente información es únicamente para fines ilustrativos, no representa ningún ofrecimiento formal por parte de Inmueble Advisor. El CAT es para fines informativos y de comparación exclusivamente.";
                const wrappedDisclaimer = doc.splitTextToSize(disclaimer, 150);

                // Texto legal a la izquierda
                doc.text(wrappedDisclaimer, marginX, footerY);

                // Paginación y Enlace a la derecha
                doc.text(`Página ${i} de ${pageCount}`, rightMarginX, footerY, { align: 'right' });
                doc.setTextColor(37, 99, 235); // blue-600 para el link
                doc.textWithLink('inmuebleadvisor.com', rightMarginX, footerY + 4, {
                    url: 'https://inmuebleadvisor.com',
                    align: 'right'
                });
            }

            // 3. Share or Save
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], 'Simulacion_IA.pdf', { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Simulación Inmueble Advisor',
                    text: 'Te comparto la proyección financiera de tu inversión.',
                    files: [file]
                });
            } else {
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'Simulacion_InmuebleAdvisor.pdf';
                link.click();
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            setErrorPDF('No pudimos generar el PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return { generateAndSharePDF, isGeneratingPDF, errorPDF };
};
