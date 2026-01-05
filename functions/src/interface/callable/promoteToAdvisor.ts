
import * as functions from 'firebase-functions';
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

    const uid = context.auth.uid;

    // 2. Execute Use Case
    try {
        await promoteUserUseCase.execute(uid, uid);
        return { success: true, message: 'User promoted successfully' };
    } catch (error) {
        console.error("Error promoting user:", error);
        throw new functions.https.HttpsError('internal', 'Unable to promote user');
    }
});
