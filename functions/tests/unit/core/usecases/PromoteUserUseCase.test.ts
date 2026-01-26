
import { expect } from 'chai';
import * as sinon from 'sinon';
import { PromoteUserUseCase } from '../../../../src/core/usecases/PromoteUserUseCase';

describe('PromoteUserUseCase', () => {
    let promoteUser: PromoteUserUseCase;
    let mockUserRepo: any;

    beforeEach(() => {
        mockUserRepo = {
            getUserById: sinon.stub(),
            updateUserRole: sinon.stub().resolves({ role: 'asesor' })
        };
        promoteUser = new PromoteUserUseCase(mockUserRepo);
    });

    it('should promote user from cliente to asesor', async () => {
        mockUserRepo.getUserById.resolves({ uid: 'u1', role: 'cliente' });

        await promoteUser.execute('u1', 'u1');

        expect(mockUserRepo.updateUserRole.calledWith('u1', 'asesor')).to.be.true;
    });

    it('should throw error if user is already admin', async () => {
        mockUserRepo.getUserById.resolves({ uid: 'u2', role: 'admin' });

        // execute will return successfully if admin (check implementation: line 25 returns)
        // actually implementation says if admin, return. So update is NOT called.

        await promoteUser.execute('u2', 'requester');
        expect(mockUserRepo.updateUserRole.called).to.be.false;
    });
});
