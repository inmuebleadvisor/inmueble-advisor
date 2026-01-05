
import { UserRepository } from '../entities/User';
import { ROLES } from '../../config/constants';

export class PromoteUserUseCase {
    constructor(private userRepository: UserRepository) { }

    async execute(uid: string, requesterUid: string): Promise<void> {
        // 1. Validate Requester (Optional layer, usually handled by trigger context)
        // In this case, logic is: User promotes themselves? check restrictions.
        // The original code allowed self-promotion if user was client.

        const user = await this.userRepository.getUserById(uid);
        if (!user) {
            throw new Error("User not found");
        }

        // Logic from frontend was: const newRole = currentRole === 'admin' ? 'admin' : 'asesor';
        // We replicate safe logic here.
        // We DO NOT allow upgrading to admin via this function. 
        // Only upgrade to 'asesor'.

        if (user.role === ROLES.ADMIN) {
            // Already admin, do nothing or keep admin
            return;
        }

        // Upgrade to Advisor
        await this.userRepository.updateUserRole(uid, ROLES.ADVISOR, {
            onboardingCompleto: true,
            fechaRegistroAsesor: new Date().toISOString()
        });
    }
}
