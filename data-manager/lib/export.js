import fs from 'fs';
import path from 'path';
import { Parser } from 'json2csv';
import colors from 'colors';
import { initializeFirebase } from './utils.js';

export const exportCollection = async (collectionName, format = 'json') => {
    const db = initializeFirebase();
    console.log(colors.yellow(`⏳ Exportando colección '${collectionName}'...`));

    try {
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) {
            console.log(colors.red('❌ La colección está vacía o no existe.'));
            return;
        }

        const data = [];
        snapshot.forEach(doc => {
            // Convertir Timestamps a Date strings para mejor legibilidad en JSON/CSV
            const docData = doc.data();
            const processedData = { id: doc.id, ...docData };
            data.push(processedData);
        });

        const outputDir = path.join(process.cwd(), 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${collectionName}_${timestamp}.${format}`;
        const filePath = path.join(outputDir, filename);

        if (format === 'json') {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } else if (format === 'csv') {
            const parser = new Parser();
            const csv = parser.parse(data);
            fs.writeFileSync(filePath, csv);
        } else {
            console.error(colors.red(`❌ Formato '${format}' no soportado.`));
            return;
        }

        console.log(colors.green(`✅ Exportación completada exitosamente.`));
        console.log(colors.white(`📂 Archivo guardado en: ${filePath}`));
        console.log(colors.white(`📊 Total documentos: ${data.length}`));

    } catch (error) {
        console.error(colors.red('❌ Error durante la exportación:'), error);
    }
};
