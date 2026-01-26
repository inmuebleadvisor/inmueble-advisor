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
const RegisterConversion_1 = require("../../../../src/core/usecases/RegisterConversion");
describe('RegisterConversion UseCase', () => {
    let useCase;
    let trackingServiceMock;
    beforeEach(() => {
        trackingServiceMock = {
            sendEvent: sinon.spy()
        };
        useCase = new RegisterConversion_1.RegisterConversion(trackingServiceMock);
    });
    it('should call trackingService.sendEvent with correct data', async () => {
        var _a;
        const input = {
            leadId: 'lead-123',
            email: 'test@example.com',
            eventName: 'Schedule',
            eventId: 'ev-123',
            conversionValue: 5000000
        };
        await useCase.execute(input);
        (0, chai_1.expect)(trackingServiceMock.sendEvent.calledOnce).to.be.true;
        const eventArg = trackingServiceMock.sendEvent.firstCall.args[0];
        (0, chai_1.expect)(eventArg.eventName).to.equal('Schedule');
        (0, chai_1.expect)(eventArg.eventId).to.equal('ev-123');
        (0, chai_1.expect)(eventArg.userData.email).to.equal('test@example.com');
        (0, chai_1.expect)((_a = eventArg.customData) === null || _a === void 0 ? void 0 : _a.value).to.equal(5000000);
    });
    it('should NOT call trackingService if eventId is missing', async () => {
        const input = {
            leadId: 'lead-123',
            email: 'test@example.com',
            eventName: 'Schedule',
            eventId: '', // Missing
        };
        await useCase.execute(input);
        (0, chai_1.expect)(trackingServiceMock.sendEvent.called).to.be.false;
    });
});
//# sourceMappingURL=registerConversion.test.js.map