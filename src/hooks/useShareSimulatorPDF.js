import { useState } from 'react';
import { formatoMoneda } from '../utils/formatters';

/**
 * Custom Hook para generar simulación hipotecaria en PDF
 * Utiliza carga perezosa (Lazy Load) para jsPDF y autoTable
 * preservando la velocidad inicial del framework web (Metric: TTI).
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

            // 1. Lazy load dependencias pesadas
            const { jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            // 2. Init Default Document A4 Vertical
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // 3. Diseño Estructurado del PDF (Vectorizado)

            // Margins and Styling variables
            const marginX = 14;
            let currentY = 20;

            // Header Title
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('Simulación de Crédito', marginX, currentY);
            currentY += 8;

            // Brand/Disclaimer subtitle
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text('Generado por Inmueble Advisor (Cálculo estimado referencial)', marginX, currentY);
            currentY += 15;

            // Data Property Section
            if (propertyData && !hasModifiedPrice) {
                doc.setFontSize(14);
                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.text(propertyData.title, marginX, currentY);
                currentY += 6;

                if (propertyData.developmentName) {
                    doc.setFontSize(11);
                    doc.setTextColor(71, 85, 105); // slate-600
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Desarrollo: ${propertyData.developmentName}`, marginX, currentY);
                    currentY += 6;
                }
                currentY += 4; // Extra margin after property block
            } else {
                doc.setFontSize(14);
                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.text('Cotización Personalizada', marginX, currentY);
                currentY += 10;
            }

            // Summary Table Top (High-level data)
            const engancheEstimado = result?.desembolsoInicial || (downPayment + (price * 0.051) + 5800 + 750);

            doc.autoTable({
                startY: currentY,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // blue-500
                head: [['Valor Inmueble', 'Enganche Total Aprox.', 'Plazo', 'Mensualidad Promedio']],
                body: [
                    [
                        formatoMoneda(price),
                        formatoMoneda(engancheEstimado),
                        `${term} años`,
                        formatoMoneda(promedioMensualidad)
                    ],
                ],
                margin: { left: marginX, right: marginX }
            });

            currentY = doc.lastAutoTable.finalY + 15;

            // Optional: Accelerated payments block
            if (acceleratedResult && acceleratedResult.mesesAhorrados > 0) {
                doc.setFontSize(12);
                doc.setTextColor(220, 38, 38); // red-600 (To highlight saving impact)
                doc.setFont('helvetica', 'bold');
                doc.text('Ahorro por Pagos a Capital (Aceleración)', marginX, currentY);
                currentY += 6;

                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                doc.setFont('helvetica', 'normal');
                doc.text(`Abonando ${formatoMoneda(extraPayment)} extra al mes a capital:`, marginX, currentY);
                currentY += 5;

                const agnosAhorrados = (acceleratedResult.mesesAhorrados / 12).toFixed(1);

                doc.autoTable({
                    startY: currentY,
                    theme: 'plain',
                    styles: { cellPadding: 2, fontSize: 10, textColor: [34, 197, 94] }, // green-500
                    body: [
                        ['Tiempo ahorrado:', `${agnosAhorrados} años menos pagando hipoteca`],
                        ['Intereses ahorrados:', formatoMoneda(acceleratedResult.interesAhorrado)]
                    ],
                    margin: { left: marginX, right: marginX }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            // Amortization Table
            if (result && result.tablaAmortizacion) {
                // Check if page break needed
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.text('Tabla de Amortización Mensual', marginX, currentY);
                currentY += 6;

                const tableBody = result.tablaAmortizacion.map(row => [
                    row.mes,
                    formatoMoneda(row.saldoInicial),
                    formatoMoneda(row.mensualidadTotal),
                    formatoMoneda(row.interes),
                    formatoMoneda(row.abonoCapital),
                    formatoMoneda(row.saldoFinal)
                ]);

                doc.autoTable({
                    startY: currentY,
                    head: [['Mes', 'Saldo Inicial', 'Pago Mensual', 'Interés', 'Capital', 'Saldo Final']],
                    body: tableBody,
                    theme: 'striped',
                    headStyles: { fillColor: [71, 85, 105] }, // slate-600
                    styles: { fontSize: 8, cellPadding: 2, halign: 'right' },
                    columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } },
                    margin: { left: marginX, right: marginX },
                    didDrawPage: (data) => {
                        // Footer function on every amortization table page
                        const str = 'Página ' + doc.internal.getNumberOfPages();
                        doc.setFontSize(8);
                        doc.text(
                            str,
                            data.settings.margin.left,
                            doc.internal.pageSize.height - 10
                        );
                    }
                });
            }

            // 4. Exportación y Generación (Blob/File)
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], 'Simulacion_Credito_InmuebleAdvisor.pdf', { type: 'application/pdf' });

            // 5. Estrategia de Entrega: Share API o Download.
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                // Celulares / Sistemas que soportan mandar archivos (WhatsApp directo)
                await navigator.share({
                    title: 'Simulación de Crédito - Inmueble Advisor',
                    text: 'Te comparto el detalle en PDF de la simulación.',
                    files: [file]
                });
            } else {
                // Fallback clásico: Auto-Descargar el archivo silenciosamente (Escritorio OS)
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Simulacion_Credito_InmuebleAdvisor.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error('Error generando PDF:', error);
            if (error.name !== 'AbortError') {
                setErrorPDF('Hubo un problema procesando el archivo PDF.');
                alert('No pudimos generar el PDF. Por favor, revisa tu conexión e intenta de nuevo.');
            }
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return { generateAndSharePDF, isGeneratingPDF, errorPDF };
};
