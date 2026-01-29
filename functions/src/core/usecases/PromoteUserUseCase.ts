
import { UserRepository } from '../entities/User';
import { ROLES } from '../../config/constants';

export class PromoteUserUseCase {
    constructor(private userRepository: UserRepository) { }

    async execute(uid: string, requesterUid: string): Promise<void> {
        // 1. Fetch Requester and Target User
        const [requester, targetUser] = await Promise.all([
            this.userRepository.getUserById(requesterUid),
            this.userRepository.getUserById(uid)
        ]);

        if (!targetUser) throw new Error("Target user not found");
        if (!requester) throw new Error("Requester not found");

        // 2. Authorization Logic
        const isSelfPromotion = uid === requesterUid;
        const isAdmin = requester.role === ROLES.ADMIN;

        if (!isSelfPromotion && !isAdmin) {
            throw new Error("Unauthorized: Only admins can promote other users");
        }

        // 3. Role Logic
        if (targetUser.role === ROLES.ADMIN) {
            // Already admin, do nothing
            return;
        }

        // Upgrade to Advisor
        await this.userRepository.updateUserRole(uid, ROLES.ADVISOR, {
            onboardingCompleto: true,
            promovidoPor: isSelfPromotion ? 'SELF' : requesterUid,
            fechaRegistroAsesor: new Date().toISOString()
        });
    }
}
