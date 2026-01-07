import * as admin from 'firebase-admin';
import { LeadRepository } from '../../core/interfaces/LeadRepository';

export class FirebaseLeadRepository implements LeadRepository {
    private db = admin.firestore();

    async getLeadsByUserId(uid: string): Promise<any[]> {
        // NOTE: avoiding orderBy('createdAt') to prevent "Missing Index" error in early dev.
        // We fetch by UID and sort in memory.
        const q = await this.db.collection('leads')
            .where('uid', '==', uid)
            .limit(20)
            .get();

        const leads = q.docs.map(d => ({ id: d.id, ...d.data() }));

        // In-memory sort: Newest first
        return leads.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });
    }
}
