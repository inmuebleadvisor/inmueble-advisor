import { expect } from 'chai';
import * as sinon from 'sinon';
import { RegisterConversion } from '../../../../src/core/usecases/RegisterConversion';
import { TrackingEvent } from '../../../../src/core/interfaces/TrackingService';

describe('RegisterConversion UseCase', () => {
    let useCase: RegisterConversion;
    let trackingServiceMock: any;

    beforeEach(() => {
        trackingServiceMock = {
            sendEvent: sinon.spy()
        };
        useCase = new RegisterConversion(trackingServiceMock);
    });

    it('should call trackingService.sendEvent with correct data', async () => {
        const input = {
            leadId: 'lead-123',
            email: 'test@example.com',
            eventName: 'Schedule',
            eventId: 'ev-123',
            conversionValue: 5000000
        };

        await useCase.execute(input);

        expect(trackingServiceMock.sendEvent.calledOnce).to.be.true;
        const eventArg = trackingServiceMock.sendEvent.firstCall.args[0] as TrackingEvent;

        expect(eventArg.eventName).to.equal('Schedule');
        expect(eventArg.eventId).to.equal('ev-123');
        expect(eventArg.userData.email).to.equal('test@example.com');
        expect(eventArg.customData?.value).to.equal(5000000);
    });

    it('should NOT call trackingService if eventId is missing', async () => {
        const input = {
            leadId: 'lead-123',
            email: 'test@example.com',
            eventName: 'Schedule',
            eventId: '', // Missing
        };

        await useCase.execute(input);

        expect(trackingServiceMock.sendEvent.called).to.be.false;
    });
});
