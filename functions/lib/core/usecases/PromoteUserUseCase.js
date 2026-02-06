"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoteUserUseCase = void 0;
const constants_1 = require("../../config/constants");
class PromoteUserUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(uid, requesterUid) {
        // 1. Fetch Requester and Target User
        const [requester, targetUser] = await Promise.all([
            this.userRepository.getUserById(requesterUid),
            this.userRepository.getUserById(uid)
        ]);
        if (!targetUser)
            throw new Error("Target user not found");
        if (!requester)
            throw new Error("Requester not found");
        // 2. Authorization Logic
        const isSelfPromotion = uid === requesterUid;
        const isAdmin = requester.role === constants_1.ROLES.ADMIN;
        if (!isSelfPromotion && !isAdmin) {
            throw new Error("Unauthorized: Only admins can promote other users");
        }
        // 3. Role Logic
        if (targetUser.role === constants_1.ROLES.ADMIN) {
            // Already admin, do nothing
            return;
        }
        // Upgrade to Advisor
        await this.userRepository.updateUserRole(uid, constants_1.ROLES.ADVISOR, {
            onboardingCompleto: true,
            promovidoPor: isSelfPromotion ? 'SELF' : requesterUid,
            fechaRegistroAsesor: new Date().toISOString()
        });
    }
}
exports.PromoteUserUseCase = PromoteUserUseCase;
//# sourceMappingURL=PromoteUserUseCase.js.map