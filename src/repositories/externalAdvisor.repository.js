import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';

export class ExternalAdvisorRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'external_advisors';
    }

    async findByPhone(telefono) {
        if (!telefono) return null;
        const q = query(collection(this.db, this.collectionName), where('telefono', '==', telefono));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
    }

    async create(advisorData) {
        const docRef = await addDoc(collection(this.db, this.collectionName), {
            ...advisorData,
            createdAt: serverTimestamp(),
            metricas: {
                ganados: 0,
                perdidos: 0,
                tasaCierre: 0
            }
        });
        return { id: docRef.id, ...advisorData };
    }

    async update(id, data) {
        const advisorRef = doc(this.db, this.collectionName, id);
        await updateDoc(advisorRef, {
            ...data,
            lastUpdated: serverTimestamp()
        });
        return true;
    }

    async getAll() {
        const snap = await getDocs(collection(this.db, this.collectionName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async getAdvisorsByDeveloper(idDesarrollador) {
        const q = query(
            collection(this.db, this.collectionName),
            where("idDesarrollador", "==", idDesarrollador)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async addLeadToHistory(id, leadSummary) {
        const advisorRef = doc(this.db, this.collectionName, id);
        await updateDoc(advisorRef, {
            leadsAsignados: arrayUnion({
                ...leadSummary,
                fechaAsignacion: new Date().toISOString()
            }),
            lastUpdated: serverTimestamp()
        });
        return true;
    }
}
