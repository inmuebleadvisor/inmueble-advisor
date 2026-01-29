
import * as functions from "firebase-functions/v1";
import { FirebaseUserRepository } from '../../infrastructure/repositories/FirebaseUserRepository';
import { PromoteUserUseCase } from '../../core/usecases/PromoteUserUseCase';

const userRepository = new FirebaseUserRepository();
const promoteUserUseCase = new PromoteUserUseCase(userRepository);

export const promoteToAdvisor = functions.https.onCall(async (data, context) => {
    // 1. Auth Guard
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const requesterUid = context.auth.uid;
    const targetUid = data.uid || requesterUid; // Support both self and admin-led

    // 2. Execute Use Case
    try {
        await promoteUserUseCase.execute(targetUid, requesterUid);
        return { success: true, message: `User ${targetUid} promoted successfully` };
    } catch (error) {
        console.error("Error promoting user:", error);
        const message = error instanceof Error ? error.message : 'Unable to promote user';
        throw new functions.https.HttpsError('internal', message);
    }
});
