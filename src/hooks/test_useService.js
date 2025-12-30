
import { renderHook } from '@testing-library/react';
import { useService } from './useService';
import { ServiceProvider } from '../context/ServiceContext';
import React from 'react';

describe('useService', () => {
    it('returns services from context', () => {
        const mockServices = { crm: 'crm-instance' };
        const wrapper = ({ children }) => (
            <ServiceProvider overrideServices={mockServices}>{children}</ServiceProvider>
        );

        const { result } = renderHook(() => useService(), { wrapper });
        expect(result.current.crm).toBe('crm-instance');
    });
});
