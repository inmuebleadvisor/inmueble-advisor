
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceProvider, useServiceContext } from './ServiceContext';

const TestComponent = () => {
    const services = useServiceContext();
    return <div>{services.testService.getData()}</div>;
};

describe('ServiceContext', () => {
    it('provides services', () => {
        const mockServices = {
            testService: { getData: () => 'Hello' }
        };

        render(
            <ServiceProvider overrideServices={mockServices}>
                <TestComponent />
            </ServiceProvider>
        );

        expect(screen.getByText('Hello')).toBeTruthy();
    });

    it('throws if used outside provider', () => {
        // Suppress console.error for this test as React logs the error
        const originalError = console.error;
        console.error = vi.fn();

        expect(() => render(<TestComponent />)).toThrow("useServiceContext must be used within a ServiceProvider");

        console.error = originalError;
    });
});
