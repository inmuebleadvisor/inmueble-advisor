
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ServiceProvider } from '../../src/context/ServiceContext';
import AdminHome from '../../src/screens/admin/AdminHome';
import { describe, it, expect, vi } from 'vitest';

// 1. Create a Mock for the Dashboard Service
const mockDashboardService = {
    getLatestStats: vi.fn().mockResolvedValue({
        metrics: {
            activeUsersDaily: 100,
            newUsersDaily: 5,
            leadsAlive: 50,
            potentialCommissions: 2000000,
            futureAppointments: 3
        },
        topDevelopments: []
    }),
    getDailyHistory: vi.fn().mockResolvedValue([
        { date: '2023-01-01', metrics: { newUsersDaily: 1, totalLeadsDaily: 1 } }
    ])
};

// 2. Mock useService to fallback to our overridden services? 
// No, the whole point of ServiceProvider is we don't need to mock the hook manually if we construct the Provider correctly.
// But we need to ensure AdminHome does not fail if it tries to render charts requiring ResizeObserver etc.
// For simplicity, we just check if it renders the stats from our mock.

describe('Integration: AdminHome Dependency Injection', () => {
    it('should consume DashboardService from Context and not from singleton', async () => {
        // Construct the override map
        const overrideServices = {
            dashboard: mockDashboardService,
            // We might need to mock admin service too if the component used it, but AdminHome mainly uses dashboard.
            // AdminHome uses dashboard service via useService().
        };

        render(
            <ServiceProvider overrideServices={overrideServices}>
                <AdminHome />
            </ServiceProvider>
        );

        // Expect "Cargando..." initially
        expect(screen.getByText(/Cargando Dashboard/i)).toBeTruthy();

        // Wait for data to load
        await waitFor(() => {
            // Check if the value '100' (activeUsersDaily) is rendered
            expect(screen.getByText('100')).toBeTruthy();
        });

        // Use regex for currency since formatting might vary
        // "2M" or similar. Implementation says: (metrics.potentialCommissions / 1000000).toFixed(2) + 'M'
        // 2000000 / 1000000 = 2.00M
        expect(screen.getByText('$2.00M')).toBeTruthy();

        // Verify that our mock was called
        expect(mockDashboardService.getLatestStats).toHaveBeenCalledTimes(1);
    });
});
