
import * as admin from 'firebase-admin';
import { User, UserRepository } from '../../core/entities/User';
import { COLLECTIONS } from '../../config/constants';

export class FirebaseUserRepository implements UserRepository {
    private db = admin.firestore();

    async getUserById(uid: string): Promise<User | null> {
        const doc = await this.db.collection(COLLECTIONS.USERS).doc(uid).get();
        if (!doc.exists) return null;
        return doc.data() as User;
    }

    async updateUserRole(uid: string, role: string, extraData: any): Promise<void> {
        await this.db.collection(COLLECTIONS.USERS).doc(uid).update({
            role,
            ...extraData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
}
