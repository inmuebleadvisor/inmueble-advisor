import * as admin from 'firebase-admin';
import { LeadRepository } from '../../core/interfaces/LeadRepository';

export class FirebaseLeadRepository implements LeadRepository {
    private db = admin.firestore();

    async getLeadsByUserId(uid: string): Promise<any[]> {
        const q = await this.db.collection('leads')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        return q.docs.map(d => ({ id: d.id, ...d.data() }));
    }
}
