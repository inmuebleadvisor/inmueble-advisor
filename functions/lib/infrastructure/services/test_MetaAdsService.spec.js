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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = __importStar(require("sinon"));
const axios_1 = __importDefault(require("axios"));
const MetaAdsService_1 = require("./MetaAdsService");
describe('MetaAdsService (Backend)', () => {
    let service;
    let axiosPostStub;
    beforeEach(() => {
        service = new MetaAdsService_1.MetaAdsService();
        axiosPostStub = sinon.stub(axios_1.default, 'post');
    });
    afterEach(() => {
        axiosPostStub.restore();
    });
    it('should hash PII data correctly', () => {
        // Access private method via casting
        const hashed = service.hashData('test@example.com');
        // SHA256 of 'test@example.com' (trimmed, lowercase)
        (0, chai_1.expect)(hashed).to.equal('973dfe463ec85785f5f95af5e392116873fd6881afbc0a18eb0a473a5a849204');
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
        (0, chai_1.expect)(axiosPostStub.calledOnce).to.be.true;
        const [url, payload] = axiosPostStub.firstCall.args;
        (0, chai_1.expect)(url).to.include('graph.facebook.com');
        const eventData = payload.data[0];
        (0, chai_1.expect)(eventData.event_name).to.equal('Schedule');
        (0, chai_1.expect)(eventData.event_id).to.equal(eventId);
        (0, chai_1.expect)(eventData.action_source).to.equal('website');
        // Hashing check
        (0, chai_1.expect)(eventData.user_data.em[0]).to.equal('973dfe463ec85785f5f95af5e392116873fd6881afbc0a18eb0a473a5a849204');
        (0, chai_1.expect)(eventData.user_data.ph).to.exist;
    });
    it('should handle API errors gracefully', async () => {
        axiosPostStub.resolves({ data: { error: { message: 'Meta Error' } } });
        // Or reject
        // axiosPostStub.rejects(new Error('Network Error'));
        // Current implementation logs error but doesn't throw (caught inside). 
        // We verify it calls axios and finishes without crashing process.
        await service.sendEvent('Schedule', {}, {}, 'ev-err');
        (0, chai_1.expect)(axiosPostStub.calledOnce).to.be.true;
    });
});
//# sourceMappingURL=test_MetaAdsService.spec.js.map