import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { mapModelo } from '../models/Modelo';
import { mapDesarrollo } from '../models/Desarrollo';

const FIRESTORE_BATCH_LIMIT = 30;

export class CatalogRepository {
    constructor(db) {
        this.db = db;
    }

    get collectionRef() {
        return collection(this.db, "modelos");
    }

    get desarrollosRef() {
        return collection(this.db, "desarrollos");
    }

    async getAllDesarrollos() {
        try {
            const snap = await getDocs(this.desarrollosRef);
            return snap.docs.map(mapDesarrollo);
        } catch (error) {
            console.error("Error en CatalogRepository.getAllDesarrollos:", error);
            throw error;
        }
    }

    async getDesarrollosByCiudad(ciudad) {
        if (!ciudad) return [];
        try {
            const q = query(this.desarrollosRef, where("ubicacion.ciudad", "==", ciudad));
            const snap = await getDocs(q);
            return snap.docs.map(mapDesarrollo);
        } catch (error) {
            console.error(`Error en CatalogRepository.getDesarrollosByCiudad(${ciudad}):`, error);
            throw error;
        }
    }

    async getAllModelos() {
        try {
            const snap = await getDocs(this.collectionRef);
            return snap.docs.map(mapModelo);
        } catch (error) {
            console.error("Error en CatalogRepository.getAllModelos:", error);
            throw error;
        }
    }

    async getModelosByDesarrolloIds(devIds) {
        if (!devIds || devIds.length === 0) return [];

        const chunks = [];
        for (let i = 0; i < devIds.length; i += FIRESTORE_BATCH_LIMIT) {
            chunks.push(devIds.slice(i, i + FIRESTORE_BATCH_LIMIT));
        }

        try {
            const promises = chunks.map(async (chunkIds) => {
                const qModelos = query(this.collectionRef, where("idDesarrollo", "in", chunkIds));
                const snap = await getDocs(qModelos);
                return snap.docs.map(mapModelo);
            });

            const results = await Promise.all(promises);
            return results.flat();
        } catch (error) {
            console.error("Error en CatalogRepository.getModelosByDesarrolloIds:", error);
            throw error;
        }
    }

    async getDesarrolloById(id) {
        try {
            const docRef = doc(this.db, "desarrollos", String(id).trim());
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return null;
            return mapDesarrollo(docSnap);
        } catch (error) {
            console.error(`Error en CatalogRepository.getDesarrolloById(${id}):`, error);
            throw error;
        }
    }

    async getModelosByDesarrolloId(id) {
        try {
            const q = query(this.collectionRef, where("idDesarrollo", "==", id));
            const snap = await getDocs(q);
            let modelos = snap.docs.map(mapModelo);

            if (modelos.length === 0) {
                // Fallback for snake_case
                const q2 = query(this.collectionRef, where("id_desarrollo", "==", id));
                const snap2 = await getDocs(q2);
                modelos = snap2.docs.map(mapModelo);
            }
            return modelos;
        } catch (error) {
            console.error(`Error en CatalogRepository.getModelosByDesarrolloId(${id}):`, error);
            throw error;
        }
    }

    async getAllDevelopers() {
        try {
            const snap = await getDocs(collection(this.db, "desarrolladores"));
            // Return raw data or map it? DATOSESTRUCTURA says it has specific structure.
            // Using loose mapping for now as there is no specific 'mapDesarrollador'.
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error("Error en CatalogRepository.getAllDevelopers:", error);
            throw error;
        }
    }
}
