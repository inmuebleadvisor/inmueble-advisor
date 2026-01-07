import * as admin from 'firebase-admin';
import { LeadRepository } from '../../core/interfaces/LeadRepository';

export class FirebaseLeadRepository implements LeadRepository {
    private db = admin.firestore();

    async getLeadsByUserId(uid: string): Promise<any[]> {
        if (!uid) return [];

        const leadsMap = new Map<string, any>();

        const addToMap = (docs: admin.firestore.QueryDocumentSnapshot[]) => {
            docs.forEach(d => {
                if (!leadsMap.has(d.id)) {
                    leadsMap.set(d.id, { id: d.id, ...d.data() });
                }
            });
        };

        try {
            // Query 1: By uid
            const q1 = await this.db.collection('leads')
                .where('uid', '==', uid)
                .limit(20)
                .get();
            addToMap(q1.docs);

            // Query 2: By clienteUid
            const q2 = await this.db.collection('leads')
                .where('clienteUid', '==', uid)
                .limit(20)
                .get();
            addToMap(q2.docs);

        } catch (e) {
            console.error("Error fetching lead history:", e);
        }

        const leads = Array.from(leadsMap.values());

        // In-memory sort: Newest first
        return leads.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });
    }
}
