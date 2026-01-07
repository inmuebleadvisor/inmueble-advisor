export interface DashboardStats {
    date: string; // YYYY-MM-DD
    generatedAt: Date;

    // Filtros de tiempo: Esto es una snapshot diaria.
    // El frontend calculará 7d, 30d sumando snapshots o comparando.
    // O mejor, guardamos ya pre-calculados los valores del día.

    metrics: {
        activeUsersDaily: number;
        newUsersDaily: number;

        // Leads
        totalLeadsDaily: number;
        leadsAlive: number; // Clientes vivos totales

        // Performance
        avgTimeOnSite?: number; // De analytic_events
        pagesPerVisit?: number;

        // Business
        potentialCommissions: number;
        activeDevelopments: number;
        activeDevelopers: number;
        activeModels: number;

        futureAppointments: number; // Next 10 days
    };

    topDevelopments: Array<{
        id: string;
        name: string;
        totalLeads: number;
        activeLeads: number;
        conversionRate: number;
        grossRevenue: number;
    }>;
}

export interface DashboardRepository {
    generateDailyStats(): Promise<DashboardStats>;
    saveStats(stats: DashboardStats): Promise<void>;
}
