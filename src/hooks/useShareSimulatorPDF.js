import { useState } from 'react';
import { formatoMoneda } from '../utils/formatters';

// Helper local para convertir imágenes URL (Firebase, Web) en Base64 compatible con jsPDF
const getBase64ImageFromUrl = async (imageUrl) => {
    try {
        const res = await fetch(imageUrl, {
            mode: 'cors',
            cache: 'no-cache'
        });
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.warn("Could not load image for PDF (CORS/Network Error)", err);
        return null;
    }
};

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
            acceleratedResult
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
            let currentY = 20;

            // Brand top decorator bar - Premium touch
            doc.setFillColor(30, 41, 59); // slate-800
            doc.rect(0, 0, 210, 8, 'F');

            // Header Info
            doc.setFontSize(24);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.text('Cotización Hipotecaria', marginX, currentY);
            currentY += 8;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'normal');
            doc.text('Generado por Inmueble Advisor (Métricas de Referencia)', marginX, currentY);
            currentY += 12;

            // --- Tarjeta de Propiedad ---
            if (propertyData && !hasModifiedPrice) {
                // Dibujar "Card" redondeada
                doc.setFillColor(248, 250, 252); // slate-50
                doc.setDrawColor(226, 232, 240); // slate-200
                doc.roundedRect(marginX, currentY, 182, 35, 3, 3, 'FD');

                let textStartX = marginX + 6;

                if (propertyData.image) {
                    const base64Img = await getBase64ImageFromUrl(propertyData.image);
                    if (base64Img) {
                        try {
                            doc.addImage(base64Img, 'JPEG', marginX + 5, currentY + 5, 35, 25);
                            textStartX = marginX + 45;
                        } catch (e) {
                            console.warn("Fallo incrustando imagen PDF", e);
                        }
                    }
                }

                doc.setFontSize(13);
                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.text(propertyData.title || '', textStartX, currentY + 12);

                if (propertyData.developmentName) {
                    doc.setFontSize(10);
                    doc.setTextColor(71, 85, 105);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Desarrollo: ${propertyData.developmentName}`, textStartX, currentY + 19);
                }

                if (propertyData.subtitle) {
                    doc.setFontSize(9);
                    doc.setTextColor(100, 116, 139);
                    const subtypeText = propertyData.subtitle + (propertyData.deliveryStatus ? ` - ${propertyData.deliveryStatus}` : '');
                    doc.text(subtypeText, textStartX, currentY + 25);
                }

                currentY += 42;
            } else {
                currentY += 5;
            }

            // --- Tarjeta de Resumen Rápido (Top Data Bar) ---
            const engancheEstimado = result?.desembolsoInicial || (downPayment + (price * 0.051) + 5800 + 750);

            doc.setFillColor(241, 245, 249); // slate-100 banner
            doc.roundedRect(marginX, currentY, 182, 22, 2, 2, 'F');

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');

            const sectionWidth = 182 / 4;
            // Titulos
            doc.text('Valor Propiedad', marginX + 5, currentY + 8);
            doc.text('Enganche Total', marginX + 5 + sectionWidth, currentY + 8);
            doc.text('Plazo', marginX + 5 + sectionWidth * 2, currentY + 8);
            doc.text('Mensualidad', marginX + 5 + sectionWidth * 3, currentY + 8);

            // Valores corporativos
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text(formatoMoneda(price), marginX + 5, currentY + 16);
            doc.text(formatoMoneda(engancheEstimado), marginX + 5 + sectionWidth, currentY + 16);
            doc.text(`${term} años`, marginX + 5 + sectionWidth * 2, currentY + 16);

            doc.setTextColor(37, 99, 235); // blue-600 para mensualidad destacada
            doc.text(formatoMoneda(promedioMensualidad), marginX + 5 + sectionWidth * 3, currentY + 16);

            currentY += 32;

            // --- Gráfico de Barras Apiladas (Distribución de Pago) ---
            if (result && result.tablaAmortizacion) {
                let sumCapital = 0, sumInteres = 0, sumSeguros = 0;
                result.tablaAmortizacion.forEach(r => {
                    sumCapital += r.capital;
                    sumInteres += r.interes;
                    sumSeguros += r.segurosComisiones;
                });

                const activeCapital = (acceleratedResult && extraPayment > 0) ? acceleratedResult.capitalTotal : sumCapital;
                const activeInteres = (acceleratedResult && extraPayment > 0) ? acceleratedResult.interesNuevo : sumInteres;
                const activeSeguros = (acceleratedResult && extraPayment > 0) ? acceleratedResult.segurosNuevo : sumSeguros;
                const totalDesembolso = activeCapital + activeInteres + activeSeguros;

                if (totalDesembolso > 0) {
                    doc.setFontSize(12);
                    doc.setTextColor(15, 23, 42);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Distribución Estimada del Crédito', marginX, currentY);
                    currentY += 8;

                    const wCapital = (activeCapital / totalDesembolso) * 182;
                    const wInteres = (activeInteres / totalDesembolso) * 182;
                    const wSeguros = (activeSeguros / totalDesembolso) * 182;

                    const barY = currentY;
                    const barH = 6;

                    // Cap Verde
                    doc.setFillColor(16, 185, 129); // emerald-500
                    doc.rect(marginX, barY, wCapital, barH, 'F');

                    // Int Naranja
                    let curX = marginX + wCapital;
                    doc.setFillColor(245, 158, 11); // amber-500
                    doc.rect(curX, barY, wInteres, barH, 'F');

                    // Seg Gris
                    curX += wInteres;
                    doc.setFillColor(148, 163, 184); // slate-400
                    doc.rect(curX, barY, wSeguros, barH, 'F');

                    currentY += 12;

                    // Leyenda (Puntitos vectoriales)
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');

                    const percCap = ((activeCapital / totalDesembolso) * 100).toFixed(0);
                    const percInt = ((activeInteres / totalDesembolso) * 100).toFixed(0);
                    const percSeg = ((activeSeguros / totalDesembolso) * 100).toFixed(0);

                    let lx = marginX;
                    doc.setFillColor(16, 185, 129); doc.circle(lx + 2, currentY - 1, 2, 'F');
                    doc.setTextColor(71, 85, 105); doc.text(`Capital (${percCap}%) ${formatoMoneda(activeCapital)}`, lx + 6, currentY);

                    lx += 60;
                    doc.setFillColor(245, 158, 11); doc.circle(lx + 2, currentY - 1, 2, 'F');
                    doc.text(`Intereses (${percInt}%) ${formatoMoneda(activeInteres)}`, lx + 6, currentY);

                    lx += 65;
                    doc.setFillColor(148, 163, 184); doc.circle(lx + 2, currentY - 1, 2, 'F');
                    doc.text(`Seguros (${percSeg}%)`, lx + 6, currentY);

                    currentY += 15;
                }
            }

            // --- Opción de Ahorro por Pago Extra ---
            if (acceleratedResult && acceleratedResult.mesesAhorrados > 0) {
                doc.setFillColor(254, 242, 242); // red-50
                doc.setDrawColor(254, 202, 202); // red-200
                doc.roundedRect(marginX, currentY, 182, 20, 2, 2, 'FD');

                doc.setFontSize(10);
                doc.setTextColor(220, 38, 38); // red-600
                doc.setFont('helvetica', 'bold');
                doc.text(`Con ${formatoMoneda(extraPayment)} extra a capital cada mes:`, marginX + 5, currentY + 7);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(153, 27, 27); // red-800
                const agnosAhorrados = (acceleratedResult.mesesAhorrados / 12).toFixed(1);
                doc.text(`Terminas ${agnosAhorrados} años antes de pagar tu hipoteca | Ahorras ${formatoMoneda(acceleratedResult.interesAhorrado)} en intereses puros.`, marginX + 5, currentY + 14);

                currentY += 28;
            }

            // --- AutoTable Clean & Premium ---
            if (result && result.tablaAmortizacion) {
                // Table title margin
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42); // slate-900
                doc.setFont('helvetica', 'bold');
                doc.text('Tabla de Pagos del Crédito', marginX, currentY);
                currentY += 6;

                autoTable(doc, {
                    startY: currentY,
                    head: [['Mes', 'Saldo Inicial', 'Interés', 'Capital', 'Comis/Segs', 'Pago Total', 'Saldo Final']],
                    body: result.tablaAmortizacion.map(row => [
                        row.mes,
                        formatoMoneda(row.saldoInicial),
                        formatoMoneda(row.interes),
                        formatoMoneda(row.capital),
                        formatoMoneda(row.segurosComisiones),
                        formatoMoneda(row.pagoMensual),
                        formatoMoneda(row.saldoFinal)
                    ]),
                    theme: 'plain',
                    headStyles: {
                        fillColor: [241, 245, 249],
                        textColor: [71, 85, 105],
                        fontStyle: 'bold',
                        halign: 'right',
                        lineWidth: { bottom: 0.5 },
                        lineColor: [203, 213, 225]
                    },
                    bodyStyles: {
                        textColor: [51, 65, 85],
                        halign: 'right',
                        lineWidth: { bottom: 0.1 },
                        lineColor: [226, 232, 240]
                    },
                    columnStyles: {
                        0: { halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] },
                        5: { fontStyle: 'bold', textColor: [15, 23, 42] } // Highlight pagoMensual
                    },
                    margin: { left: marginX, right: marginX },
                    didDrawPage: (data) => {
                        // Header deco bar repetida
                        doc.setFillColor(30, 41, 59);
                        doc.rect(0, 0, 210, 8, 'F');

                        // Pie de pagina
                        const str = 'Página ' + doc.internal.getNumberOfPages();
                        doc.setFontSize(8);
                        doc.setTextColor(148, 163, 184);
                        doc.text(
                            str,
                            data.settings.margin.left,
                            doc.internal.pageSize.height - 10
                        );
                    }
                });
            }

            // 4. Salida del Blob
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], 'Simulacion_Credito_InmuebleAdvisor.pdf', { type: 'application/pdf' });

            // 5. Estrategia Nativa y Descarga
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Simulación Hipotecaria',
                    text: 'Te comparto el detalle extendido del cálculo hipotecario.',
                    files: [file]
                });
            } else {
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Simulacion_Hipotecaria_InmuebleAdvisor.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error('Error generando PDF Premium:', error);
            if (error.name !== 'AbortError') {
                setErrorPDF('Hubo un problema procesando el archivo PDF.');
                alert('No pudimos generar el PDF.\n\nDetalle técnico: ' + error.message);
            }
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return { generateAndSharePDF, isGeneratingPDF, errorPDF };
};

