import * as admin from 'firebase-admin';

export class CatalogRepository {
    private db = admin.firestore();

    async getDevSnippet(id: string): Promise<{ title: string; image: string | null; description: string } | null> {
        const snap = await this.db.collection('devs').doc(id).get();
        if (!snap.exists) return null;
        
        const data = snap.data();
        const title = data?.nombre ? `Desarrollo ${data.nombre}` : 'Desarrollo en Inmueble Advisor';
        const image = data?.imagen || null;
        const description = data?.nombre ? `Descubre ${data.nombre}. Departamentos y casas en venta.` : 'Encuentra tu hogar ideal o excelente oportunidad de inversión.';

        return { title, image, description };
    }

    async getModelSnippet(id: string): Promise<{ title: string; image: string | null; description: string } | null> {
        const snap = await this.db.collection('models').doc(id).get();
        if (!snap.exists) return null;

        const data = snap.data();
        let parentName = '';
        
        const parentId = data?.idDesarrollo || data?.id_desarrollo;
        if (parentId) {
            const devSnap = await this.db.collection('devs').doc(String(parentId)).get();
            if (devSnap.exists) {
                parentName = devSnap.data()?.nombre || '';
            }
        }

        const modeloName = data?.nombre_modelo || 'Modelo';
        const title = parentName ? `${modeloName} en ${parentName}` : `${modeloName} en Venta`;
        const image = data?.imagenPrincipal || (data?.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0 ? data.imagenes[0] : null);
        const description = `Conoce el modelo ${modeloName}${parentName ? ' del desarrollo ' + parentName : ''}. Características, precio y ubicación.`;

        return { title, image, description };
    }
}
