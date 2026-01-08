import { expect } from 'chai';
import * as sinon from 'sinon';
import axios from 'axios';
import { MetaAdsService } from './MetaAdsService';

describe('MetaAdsService (Backend)', () => {
    let service: MetaAdsService;
    let axiosPostStub: sinon.SinonStub;

    beforeEach(() => {
        service = new MetaAdsService();
        axiosPostStub = sinon.stub(axios, 'post');
    });

    afterEach(() => {
        axiosPostStub.restore();
    });

    it('should hash PII data correctly', () => {
        // Access private method via casting
        const hashed = (service as any).hashData('test@example.com');
        // SHA256 of 'test@example.com' (trimmed, lowercase)
        expect(hashed).to.equal('973dfe463ec85785f5f95af5e392116873fd6881afbc0a18eb0a473a5a849204');
    });

    it('should send event to Meta CAPI with correct payload', async () => {
        axiosPostStub.resolves({ data: { events_received: 1 } });

        const userData = {
            email: 'test@example.com',
            phone: '+521234567890'
        };
        const customData = { value: 100 };
        const eventId = 'ev-123';

        await service.sendEvent('Schedule', userData, customData, eventId);

        expect(axiosPostStub.calledOnce).to.be.true;
        const [url, payload] = axiosPostStub.firstCall.args;

        expect(url).to.include('graph.facebook.com');

        const eventData = payload.data[0];
        expect(eventData.event_name).to.equal('Schedule');
        expect(eventData.event_id).to.equal(eventId);
        expect(eventData.action_source).to.equal('website');

        // Hashing check
        expect(eventData.user_data.em[0]).to.equal('973dfe463ec85785f5f95af5e392116873fd6881afbc0a18eb0a473a5a849204');
        expect(eventData.user_data.ph).to.exist;
    });

    it('should handle API errors gracefully', async () => {
        axiosPostStub.resolves({ data: { error: { message: 'Meta Error' } } });
        // Or reject
        // axiosPostStub.rejects(new Error('Network Error'));

        // Current implementation logs error but doesn't throw (caught inside). 
        // We verify it calls axios and finishes without crashing process.
        await service.sendEvent('Schedule', {}, {}, 'ev-err');
        expect(axiosPostStub.calledOnce).to.be.true;
    });
});
