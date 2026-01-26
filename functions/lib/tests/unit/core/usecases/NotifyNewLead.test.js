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
const NotifyNewLead_1 = require("../../../../src/core/usecases/NotifyNewLead");
describe('NotifyNewLead UseCase', () => {
    let notifyNewLead;
    let mockNotificationPort;
    let mockUserRepo;
    let mockLeadRepo;
    beforeEach(() => {
        mockNotificationPort = { sendAlert: sinon.stub().resolves() };
        mockUserRepo = { getUserById: sinon.stub() };
        mockLeadRepo = { getLeadsByUserId: sinon.stub() };
        notifyNewLead = new NotifyNewLead_1.NotifyNewLead(mockNotificationPort, mockUserRepo, mockLeadRepo);
    });
    it('should send alert with client info if user exists', async () => {
        const leadData = { id: 'l1', uid: 'u1' };
        mockUserRepo.getUserById.resolves({ uid: 'u1', name: 'Test Client' });
        mockLeadRepo.getLeadsByUserId.resolves([]);
        await notifyNewLead.execute(leadData);
        (0, chai_1.expect)(mockUserRepo.getUserById.calledWith('u1')).to.be.true;
        (0, chai_1.expect)(mockNotificationPort.sendAlert.called).to.be.true;
    });
    it('should send alert even if user fetch fails', async () => {
        const leadData = { id: 'l2', uid: 'u2' };
        mockUserRepo.getUserById.rejects(new Error('DB Error'));
        mockLeadRepo.getLeadsByUserId.resolves([]);
        await notifyNewLead.execute(leadData);
        (0, chai_1.expect)(mockNotificationPort.sendAlert.called).to.be.true;
    });
});
//# sourceMappingURL=NotifyNewLead.test.js.map