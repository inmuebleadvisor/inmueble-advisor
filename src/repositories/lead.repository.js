import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    orderBy,
    serverTimestamp,
    arrayUnion,
    getDoc
} from 'firebase/firestore';

export class LeadRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'leads';
    }

    async getLeadsByAdvisor(asesorUid) {
        const q = query(
            collection(this.db, this.collectionName),
            where("asesorUid", "==", asesorUid),
            orderBy("fechaUltimaInteraccion", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async getAllLeads() {
        const snap = await getDocs(collection(this.db, this.collectionName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async getLeadById(leadId) {
        const docRef = doc(this.db, this.collectionName, leadId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    }

    async createLead(leadData) {
        const dataWithTimestamp = {
            ...leadData,
            fechaCreacion: serverTimestamp(),
            fechaUltimaInteraccion: serverTimestamp()
        };
        const docRef = await addDoc(collection(this.db, this.collectionName), dataWithTimestamp);
        return docRef.id;
    }

    async updateLead(leadId, updateData) {
        const leadRef = doc(this.db, this.collectionName, leadId);
        const dataWithTimestamp = {
            ...updateData,
            // Ensure we always update the last interaction on updates if not provided
            // But usually the service controls this logic. 
            // For now, allow service to dictate timestamps or fields.
        };
        // However, looking at crm.service, it sets fechaUltimaInteraccion manually on updates. 
        // We will trust the service to pass the right data, or we could enforce it here.
        // Ideally, a repository just writes what it's told.

        await updateDoc(leadRef, dataWithTimestamp);
        return true;
    }

    async addB2BMilestone(leadId, milestone) {
        const leadRef = doc(this.db, this.collectionName, leadId);
        await updateDoc(leadRef, {
            "seguimientoB2B.hitosAlcanzados": arrayUnion(milestone),
            fechaUltimaInteraccion: serverTimestamp()
        });
        return true;
    }
}
