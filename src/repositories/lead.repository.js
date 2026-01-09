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
            metaEventId,      // ✅ Meta CAPI Deduplication ID
            fbp,              // ✅ Meta Browser ID
            fbc,              // ✅ Meta Click ID
            clientUserAgent,  // ✅ Audit
            ...extraData      // ✅ Capture any additional fields
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
            precioReferencia: Number(precioReferencia) || 0,
            comisionPorcentaje: Number(comisionPorcentaje) || 0,
            status: "PENDIENTE",
            idAsesorAsignado: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // ❌ REMOVED: statusHistory. logic centralized in Backend Trigger.
            _statusReason: "Lead generado por el sistema", // Trigger will consume this
            _changedBy: "SYSTEM", // Trigger will consume this

            // ✅ PERSIST TRACKING DATA
            metaEventId,
            fbp,
            fbc,
            clientUserAgent,

            ...extraData
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

        let dataToUpdate = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        // Automatic Status History Tracking
        // If the update contains a 'status', we append to the history.
        if (updateData.status) {
            // ✅ CHANGED: We now map metadata to transient fields.
            // The Backend Trigger will detect status change & consume these.

            if (updateData.note) {
                dataToUpdate._statusReason = updateData.note;
                delete dataToUpdate.note; // Clean from main object
            } else {
                dataToUpdate._statusReason = "Estatus actualizado";
            }

            if (updateData.changedBy) {
                dataToUpdate._changedBy = updateData.changedBy;
                delete dataToUpdate.changedBy; // Clean from main object
            } else {
                dataToUpdate._changedBy = "SYSTEM";
            }

            // Note: We DO NOT touch statusHistory here anymore.
        }

        await updateDoc(leadRef, dataToUpdate);
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
        // ✅ Refactored: We update 'status' + transient fields.
        // Trigger handles the history.

        await updateDoc(leadRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
            _statusReason: eventMetadata.note || "Estatus actualizado",
            _changedBy: eventMetadata.changedBy || "SYSTEM"
        });
        return true;
    }

    /**
     * Finds an active appointment for a user in a specific development.
     * Active means the appointment date is in the future.
     * @param {string} uid 
     * @param {string} idDesarrollo 
     * @returns {Promise<Object|null>} The lead with the active appointment or null.
     */
    async findActiveAppointment(uid, idDesarrollo) {
        // console.log("🔍 [TheRepository] findActiveAppointment checking:", { uid, idDesarrollo });

        // We query by user and development. 
        // We avoid querying by date directly to prevent Need Index errors during development.
        // REMOVED orderBy("createdAt", "desc") to avoid requiring a composite index for (uid + idDesarrollo + createdAt).
        // We will simple sort in memory if needed, or just find ANY future appointment.
        const q = query(
            collection(this.db, this.collectionName),
            where("uid", "==", uid),
            where("idDesarrollo", "==", idDesarrollo)
        );

        try {
            const snap = await getDocs(q);
            const now = new Date();
            // console.log(`🔍 [TheRepository] Found ${snap.docs.length} leads for this dev. Checking dates against ${now.toISOString()}...`);

            for (const d of snap.docs) {
                const data = d.data();
                // Check if has appointment data
                if (data.citainicial && data.citainicial.dia) {
                    // Handle Firestore Timestamp or Date object
                    const appointmentDate = data.citainicial.dia.toDate ? data.citainicial.dia.toDate() : new Date(data.citainicial.dia);

                    // console.log(`🔍 [TheRepository] checking lead ${d.id}: Date=${appointmentDate.toISOString()}`);

                    if (appointmentDate > now) {
                        // console.log("✅ [TheRepository] Active appointment found:", d.id);
                        return { id: d.id, ...data };
                    }
                } else {
                    // console.log(`🔍 [TheRepository] Lead ${d.id} has no valid citainicial data.`);
                }
            }
        } catch (err) {
            console.error("❌ [TheRepository] Error executing query:", err);
            throw err; // Re-throw to be caught by service
        }

        // console.log("❌ [TheRepository] No active appointment found.");
        return null;
    }
}
