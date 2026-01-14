"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const axios_1 = __importDefault(require("axios"));
const MetaAdsService_1 = require("./MetaAdsService");
const meta_1 = require("../../core/constants/meta");
describe('MetaAdsService', () => {
    let metaService;
    let axiosPostStub;
    beforeEach(() => {
        metaService = new MetaAdsService_1.MetaAdsService();
        axiosPostStub = sinon_1.default.stub(axios_1.default, 'post');
    });
    afterEach(() => {
        sinon_1.default.restore();
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
            await metaService.sendEvent(event);
            (0, chai_1.expect)(axiosPostStub.calledOnce).to.be.true;
            const lastCall = axiosPostStub.getCall(0);
            const payload = lastCall.args[1];
            (0, chai_1.expect)(payload.data[0].event_name).to.equal('PageView');
            (0, chai_1.expect)(payload.data[0].event_id).to.equal('test-event-id');
            // Check if test_event_code is present (since we updated constants.ts)
            (0, chai_1.expect)(payload.test_event_code).to.equal(meta_1.META_CONFIG.TEST_EVENT_CODE);
            (0, chai_1.expect)(payload.test_event_code).to.equal('TEST21374');
        });
        it('should properly hash user data', async () => {
            const event = {
                eventName: 'Contact',
                eventId: 'hash-test',
                userData: {
                    email: 'TEST@example.com ',
                    firstName: 'John'
                }
            };
            axiosPostStub.resolves({ data: { success: true } });
            await metaService.sendEvent(event);
            const payload = axiosPostStub.getCall(0).args[1];
            const userData = payload.data[0].user_data;
            // SHA256 of 'test@example.com'
            const expectedEmailHash = '973dfe463ea747b783c5da995628534195b2d6ff511de11bcdd383ad508079d3';
            (0, chai_1.expect)(userData.em[0]).to.equal(expectedEmailHash);
        });
        it('should handle errors from axios', async () => {
            const event = {
                eventName: 'PageView',
                eventId: 'error-test',
                userData: {}
            };
            axiosPostStub.rejects(new Error('Network Error'));
            // Should not throw, but log error (based on current implementation)
            await metaService.sendEvent(event);
            (0, chai_1.expect)(axiosPostStub.calledOnce).to.be.true;
        });
    });
});
//# sourceMappingURL=test_MetaAdsService.js.map