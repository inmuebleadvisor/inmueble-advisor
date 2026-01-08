import { expect } from 'chai';
import * as sinon from 'sinon';
import { MetaAdsService } from '../../src/infrastructure/services/MetaAdsService';

describe('MetaAdsService (Backend)', () => {
    let service: MetaAdsService;
    let fetchStub: sinon.SinonStub;

    beforeEach(() => {
        service = new MetaAdsService();
        // Mock global fetch
        fetchStub = sinon.stub(global, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('should hash PII data correctly', () => {
        // Access private method via casting if needed or test public side effect
        // Using 'any' to access private method for testing purpose strictly
        const hashed = (service as any).hash('test@example.com');
        // echo -n 'test@example.com' | shasum -a 256
        expect(hashed).to.equal('973dfe463ec85785f5f95af5e392116873fd6881afbc0a18eb0a473a5a849204');
    });

    it('should process user data normalization and hashing', () => {
        const raw = {
            em: ' Test@Example.com ',
            ph: ' +52 (55) 1234 5678 ',
            fn: ' Juan '
        };
        const processed = (service as any).processUserData(raw);

        expect(processed.em).to.equal('973dfe463ec85785f5f95af5e392116873fd6881afbc0a18eb0a473a5a849204'); // trimmed & lowercase
        expect(processed.ph).to.not.equal(' +52 (55) 1234 5678 '); // should be hashed
        // Verify phone normalization logic if implemented (usually strip non-digits)
    });

    it('should send event to Meta Graph API', async () => {
        fetchStub.resolves({
            ok: true,
            json: async () => ({ events_received: 1 })
        } as Response);

        await service.sendEvent('Contact', 'event-123', { em: 'test@test.com' });

        expect(fetchStub.calledOnce).to.be.true;
        const args = fetchStub.firstCall.args;
        expect(args[0]).to.include('graph.facebook.com');
        expect(args[1].method).to.equal('POST');

        const body = JSON.parse(args[1].body);
        expect(body.data[0].event_name).to.equal('Contact');
        expect(body.data[0].event_id).to.equal('event-123');
        expect(body.data[0].user_data.em).to.be.a('string'); // hashed
    });
});
