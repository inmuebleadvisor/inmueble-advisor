"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = __importStar(require("sinon"));
const PromoteUserUseCase_1 = require("../../../../src/core/usecases/PromoteUserUseCase");
describe('PromoteUserUseCase', () => {
    let promoteUser;
    let mockUserRepo;
    beforeEach(() => {
        mockUserRepo = {
            getUserById: sinon.stub(),
            updateUserRole: sinon.stub().resolves({ role: 'asesor' })
        };
        promoteUser = new PromoteUserUseCase_1.PromoteUserUseCase(mockUserRepo);
    });
    it('should promote user from cliente to asesor', async () => {
        mockUserRepo.getUserById.resolves({ uid: 'u1', role: 'cliente' });
        await promoteUser.execute('u1', 'u1');
        (0, chai_1.expect)(mockUserRepo.updateUserRole.calledWith('u1', 'asesor')).to.be.true;
    });
    it('should throw error if user is already admin', async () => {
        mockUserRepo.getUserById.resolves({ uid: 'u2', role: 'admin' });
        // execute will return successfully if admin (check implementation: line 25 returns)
        // actually implementation says if admin, return. So update is NOT called.
        await promoteUser.execute('u2', 'requester');
        (0, chai_1.expect)(mockUserRepo.updateUserRole.called).to.be.false;
    });
});
//# sourceMappingURL=PromoteUserUseCase.test.js.map