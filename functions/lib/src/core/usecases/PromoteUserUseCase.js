"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoteUserUseCase = void 0;
const constants_1 = require("../../config/constants");
class PromoteUserUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(uid, requesterUid) {
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
        if (user.role === constants_1.ROLES.ADMIN) {
            // Already admin, do nothing or keep admin
            return;
        }
        // Upgrade to Advisor
        await this.userRepository.updateUserRole(uid, constants_1.ROLES.ADVISOR, {
            onboardingCompleto: true,
            fechaRegistroAsesor: new Date().toISOString()
        });
    }
}
exports.PromoteUserUseCase = PromoteUserUseCase;
//# sourceMappingURL=PromoteUserUseCase.js.map