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
    getDoc,
    Timestamp,
    arrayUnion
} from 'firebase/firestore';

export class LeadRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'leads';
    }

    /**
     * Creates a new lead with a strict schema.
     * @param {Object} leadData - The lead data.
     * @returns {Promise<string>} The ID of the created lead.
     */
    async createLead(leadData) {
        const {
            uid,
            idModelo = null,
            idDesarrollo,
            idDesarrollador,
            precioReferencia,
            comisionPorcentaje,
            ...extraData // ✅ Capture any additional fields (snapshot, origen, etc)
        } = leadData;

        if (!idDesarrollo || !idDesarrollador) {
            throw new Error("Missing required fields: idDesarrollo and idDesarrollador are mandatory.");
        }

        const now = Timestamp.now();

        const newLead = {
            uid, // ID del usuario propietario (Lead generator/User)
            idModelo,
            idDesarrollo,
            idDesarrollador,
            // Removed redundant top-level fields (email, nombre, telefono) in favor of clienteDatos
            precioReferencia: Number(precioReferencia) || 0,
            comisionPorcentaje: Number(comisionPorcentaje) || 0,
            status: "PENDIENTE",
            idAsesorAsignado: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            statusHistory: [
                {
                    status: "PENDIENTE",
                    timestamp: now,
                    note: "Lead generado por el sistema",
                    changedBy: "SYSTEM"
                }
            ],
            ...extraData // ✅ Persist dynamic fields (snapshot, origen, etc)
        };

        const docRef = await addDoc(collection(this.db, this.collectionName), newLead);
        return docRef.id;
    }

    async getLeadsByAdvisor(idAsesorAsignado) {
        const q = query(
            collection(this.db, this.collectionName),
            where("idAsesorAsignado", "==", idAsesorAsignado),
            orderBy("updatedAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async getAllLeads() {
        const snap = await getDocs(collection(this.db, this.collectionName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async getLeadsByDeveloper(idDesarrollador) {
        const q = query(
            collection(this.db, this.collectionName),
            where("idDesarrollador", "==", idDesarrollador),
            orderBy("updatedAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async getLeadById(leadId) {
        const docRef = doc(this.db, this.collectionName, leadId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    }

    async updateLead(leadId, updateData) {
        const leadRef = doc(this.db, this.collectionName, leadId);
        const dataWithTimestamp = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        // If status is being updated, ensure statusHistory is updated by the service or handle it here?
        // The requirement says "Repo should not contain complex validation logic".
        // Updating status history is often logic, but could be seen as data structure enforcement.
        // For now, we expect the service to handle the `arrayUnion` for `statusHistory` if it calls a specific method,
        // or passing the new history array if it updates it. 
        // However, standard update just updates fields.

        await updateDoc(leadRef, dataWithTimestamp);
        return true;
    }

    /**
     * Updates the status of a lead and appends to history.
     * @param {string} leadId 
     * @param {string} newStatus 
     * @param {Object} eventMetadata - { note, changedBy }
     */
    async updateStatus(leadId, newStatus, eventMetadata) {
        const leadRef = doc(this.db, this.collectionName, leadId);
        const now = Timestamp.now();
        const historyEvent = {
            status: newStatus,
            timestamp: now,
            note: eventMetadata.note || "Estatus actualizado",
            changedBy: eventMetadata.changedBy || "SYSTEM"
        };

        await updateDoc(leadRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
            statusHistory: arrayUnion(historyEvent)
        });
        return true;
    }
}
