import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { MetaAdsService } from './MetaAdsService';
import { META_CONFIG } from '../../core/constants/meta';

describe('MetaAdsService', () => {
    let metaService: MetaAdsService;
    let axiosPostStub: sinon.SinonStub;

    beforeEach(() => {
        metaService = new MetaAdsService();
        axiosPostStub = sinon.stub(axios, 'post');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('sendEvent', () => {
        it('should send an event to Meta with the correct payload', async () => {
            const event = {
                eventName: 'PageView',
                eventId: 'test-event-id',
                userData: {
                    email: 'test@example.com',
                    clientIp: '127.0.0.1',
                    userAgent: 'test-agent'
                },
                eventSourceUrl: 'https://example.com'
            };

            axiosPostStub.resolves({ data: { success: true } });

            await metaService.sendEvent(event as any);

            expect(axiosPostStub.calledOnce).to.be.true;
            const lastCall = axiosPostStub.getCall(0);
            const payload = lastCall.args[1];

            expect(payload.data[0].event_name).to.equal('PageView');
            expect(payload.data[0].event_id).to.equal('test-event-id');
            // Check if test_event_code is present (since we updated constants.ts)
            expect(payload.test_event_code).to.equal(META_CONFIG.TEST_EVENT_CODE);
            expect(payload.test_event_code).to.equal('TEST21374');
        });

        it('should properly hash user data', async () => {
            const event = {
                eventName: 'Contact',
                eventId: 'hash-test',
                userData: {
                    email: 'TEST@example.com ', // Mixed case and spaces
                    firstName: 'John'
                }
            };

            axiosPostStub.resolves({ data: { success: true } });

            await metaService.sendEvent(event as any);

            const payload = axiosPostStub.getCall(0).args[1];
            const userData = payload.data[0].user_data;

            // SHA256 of 'test@example.com'
            const expectedEmailHash = '973dfe463ea747b783c5da995628534195b2d6ff511de11bcdd383ad508079d3';
            expect(userData.em[0]).to.equal(expectedEmailHash);
        });

        it('should handle errors from axios', async () => {
            const event = {
                eventName: 'PageView',
                eventId: 'error-test',
                userData: {}
            };

            axiosPostStub.rejects(new Error('Network Error'));

            // Should not throw, but log error (based on current implementation)
            await metaService.sendEvent(event as any);
            expect(axiosPostStub.calledOnce).to.be.true;
        });
    });
});
