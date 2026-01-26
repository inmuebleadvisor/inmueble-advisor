
import { expect } from 'chai';
import * as sinon from 'sinon';
import { NotifyNewLead } from '../../../../src/core/usecases/NotifyNewLead';

describe('NotifyNewLead UseCase', () => {
    let notifyNewLead: NotifyNewLead;
    let mockNotificationPort: any;
    let mockUserRepo: any;
    let mockLeadRepo: any;

    beforeEach(() => {
        mockNotificationPort = { sendAlert: sinon.stub().resolves() };
        mockUserRepo = { getUserById: sinon.stub() };
        mockLeadRepo = { getLeadsByUserId: sinon.stub() };

        notifyNewLead = new NotifyNewLead(mockNotificationPort, mockUserRepo, mockLeadRepo);
    });

    it('should send alert with client info if user exists', async () => {
        const leadData = { id: 'l1', uid: 'u1' };
        mockUserRepo.getUserById.resolves({ uid: 'u1', name: 'Test Client' });
        mockLeadRepo.getLeadsByUserId.resolves([]);

        await notifyNewLead.execute(leadData);

        expect(mockUserRepo.getUserById.calledWith('u1')).to.be.true;
        expect(mockNotificationPort.sendAlert.called).to.be.true;
    });

    it('should send alert even if user fetch fails', async () => {
        const leadData = { id: 'l2', uid: 'u2' };
        mockUserRepo.getUserById.rejects(new Error('DB Error'));
        mockLeadRepo.getLeadsByUserId.resolves([]);

        await notifyNewLead.execute(leadData);

        expect(mockNotificationPort.sendAlert.called).to.be.true;
    });
});
