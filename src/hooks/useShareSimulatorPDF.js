import { useState } from 'react';
import { formatoMoneda } from '../utils/formatters';
import logoInmuebleAdvisor from '../assets/logo-inmueble-advisor.png';

// En desarrollo (localhost), redirige las imágenes de Firebase Storage a través del proxy de Vite
// para evitar bloqueos CORS. En producción, usa la URL directa (CORS del bucket ya configurado).
const resolveImageUrl = (url) => {
    if (!url) return null;
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isDev) return url;

    // storage.googleapis.com → /img-proxy/...
    if (url.includes('storage.googleapis.com')) {
        return url.replace('https://storage.googleapis.com', '/img-proxy/storage.googleapis.com');
    }
    // firebasestorage.googleapis.com → /img-proxy-firebase/...
    if (url.includes('firebasestorage.googleapis.com')) {
        return url.replace('https://firebasestorage.googleapis.com', '/img-proxy-firebase/firebasestorage.googleapis.com');
    }
    return url;
};

// Helper local para convertir imágenes URL en Base64 compatible con jsPDF
// Se utiliza Canvas para sortear limitaciones de Fetch y asegurar compatibilidad de formato.
const getBase64ImageFromUrl = (imageUrl) => {
    // Timeout de 5 segundos para no bloquear el PDF
    const timeout = new Promise((resolve) => setTimeout(() => {
        console.warn('[PDF] ⏱ Timeout cargando imagen:', imageUrl?.substring(0, 80));
        resolve(null);
    }, 5000));

    const loadImage = new Promise((resolve) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                console.log('[PDF] ✅ Imagen OK:', imageUrl?.substring(0, 80));
                resolve(dataURL);
            } catch (securityErr) {
                console.warn('[PDF] ❌ Canvas tainted (CORS pendiente):', imageUrl?.substring(0, 80), securityErr.message);
                resolve(null);
            }
        };

        img.onerror = (err) => {
            console.warn('[PDF] ❌ Error cargando imagen:', imageUrl?.substring(0, 80), err);
            resolve(null);
        };

        img.src = imageUrl;
    });

    return Promise.race([loadImage, timeout]);
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
            const logoWidth = 45; // mm
            const logoHeight = 15; // mm
            const pageWidth = 210;
            let currentY = 26;

            // Brand top decorator bar - Premium touch
            doc.setFillColor(30, 41, 59); // slate-800
            doc.rect(0, 0, 210, 8, 'F');

            // --- 0. Logotipo Institucional (Esquina Superior Derecha) ---
            const LOGO_IA_URL = "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20Inmueble%20Advisor%20PNG.png?alt=media&token=d123edd6-31b1-4087-bcb3-afddb58b4d0f";

            try {
                // El logo es un import local (no tiene CORS). Se usa directamente.
                doc.addImage(logoInmuebleAdvisor, 'PNG', pageWidth - marginX - logoWidth, 11, logoWidth, logoHeight);
            } catch (err) {
                console.warn("Could not add logo to PDF", err);
            }

            // Header Info
            doc.setFontSize(26);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.text('Cotización Hipotecaria', marginX, currentY);
            currentY += 8;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'normal');
            doc.text('Generado por Inmueble Advisor (Métricas de Referencia)', marginX, currentY);
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
                }

                currentY += 58;
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
            doc.text('Plazo', marginX + 5 + (sectionWidth * 2), currentY + 8);
            doc.text('Mensualidad', marginX + 5 + (sectionWidth * 3), currentY + 8);

            // Valores con color azul para métricas clave
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text(formatoMoneda(price), marginX + 5, currentY + 16);
            doc.text(formatoMoneda(engancheEstimado), marginX + 5 + sectionWidth, currentY + 16);
            doc.text(`${term} años`, marginX + 5 + (sectionWidth * 2), currentY + 16);

            // Mensualidad en AZUL
            doc.setTextColor(37, 99, 235); // blue-600
            doc.text(formatoMoneda(promedioMensualidad), marginX + 5 + (sectionWidth * 3), currentY + 16);

            currentY += 30;


            // --- Ahorro Acelerado (Sección Condicional) ---
            if (acceleratedResult && acceleratedResult.mesesAhorrados > 0) {
                doc.setFillColor(240, 253, 244); // green-50
                doc.setDrawColor(187, 247, 208); // green-200
                doc.roundedRect(marginX, currentY, 182, 18, 2, 2, 'FD');

                doc.setFontSize(10);
                doc.setTextColor(21, 128, 61); // green-700
                doc.setFont('helvetica', 'bold');
                doc.text(`¡Posible Plan de Ahorro! Pago Extra Mensual: ${formatoMoneda(extraPayment)}`, marginX + 5, currentY + 7);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const savingText = `Ahorrarías ${formatoMoneda(acceleratedResult.interesAhorrado)} en intereses y terminarías ${(acceleratedResult.mesesAhorrados / 12).toFixed(1)} años antes.`;
                doc.text(savingText, marginX + 5, currentY + 13);
                currentY += 28;
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
                body: tableRows.slice(0, 180), // Limitar a un par de hojas para evitar PDF pesado
                theme: 'striped',
                headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { halign: 'center' },
                    5: { fontStyle: 'bold' }
                },
                margin: { left: marginX, right: marginX }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`Cotización sujeta a aprobación de crédito. Valores informativos. | Página ${i} de ${pageCount}`, marginX, 285);
                doc.text('inmuebleadvisor.com', 170, 285);
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
