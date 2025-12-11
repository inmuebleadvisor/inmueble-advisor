import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../service-account.json');

export const initializeFirebase = () => {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error('\n❌ ERROR CRÍTICO DE SEGURIDAD ❌');
        console.error('No se encontró el archivo "service-account.json" en la raíz de /data-manager.');
        console.error('Por razones de seguridad, este archivo NO está en el repositorio.');
        console.error('➡️ SOLUCIÓN: Descarga tu llave JSON de Firebase Console -> Configuración -> Cuentas de servicio -> Generar nueva clave privada.');
        console.error('   Luego guárdalo como "service-account.json" en esta carpeta.');
        process.exit(1);
    }

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        console.log('✅ Firebase Admin Inicializado Correctamente');
        return admin.firestore();
    } catch (error) {
        console.error('❌ Error al leer las credenciales:', error.message);
        process.exit(1);
    }
};
