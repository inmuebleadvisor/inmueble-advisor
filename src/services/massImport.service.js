import Papa from 'papaparse';

const CLOUD_FUNCTION_URL = "https://us-central1-inmueble-advisor-app.cloudfunctions.net/importarDatosMasivos";

/**
 * Parsea un archivo CSV y devuelve un array de objetos.
 * @param {File} file - El archivo CSV seleccionado por el usuario.
 * @returns {Promise<Array>} - Array de objetos parseados.
 */
export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn("CSV Errors:", results.errors);
                }
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

/**
 * Envía datos masivos a la Cloud Function para importación.
 * Divide los datos en lotes pequeños si es necesario (manejado por UI o aquí si fuera muy grande, 
 * pero el backend maneja 100).
 * 
 * @param {string} tipo - 'desarrollos' o 'modelos'
 * @param {Array} datos - Array de datos parseados del CSV
 */
export const importData = async (tipo, datos) => {
    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Si la Cloud Function requiere auth token en futuro, agregarlo aquí
            },
            body: JSON.stringify({ tipo, datos })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del servidor: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en importData:", error);
        throw error;
    }
};
