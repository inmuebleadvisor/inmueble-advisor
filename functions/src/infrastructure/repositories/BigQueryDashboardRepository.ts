import { BigQuery } from '@google-cloud/bigquery';
import * as admin from 'firebase-admin';
import { DashboardRepository, DashboardStats } from '../../core/entities/DashboardStats';

export class BigQueryDashboardRepository implements DashboardRepository {
    private bq: BigQuery;
    private db: admin.firestore.Firestore;

    // Configuración de Datasets (Hardcoded por ahora según setup)
    private DATASET_LEADS = 'firestore_export_leads';
    // private DATASET_ANALYTICS = 'firestore_export_analytics'; // Descomentar cuando exista

    constructor() {
        this.bq = new BigQuery();
        this.db = admin.firestore();
    }

    async generateDailyStats(): Promise<DashboardStats> {
        const today = new Date().toISOString().split('T')[0];

        // 1. Ejecutar consultas en paralelo
        const [usersStats, leadsStats, developmentsStats] = await Promise.all([
            this.getUsersStats(),
            this.getLeadsStats(),
            this.getTopDevelopments()
        ]);

        return {
            date: today,
            generatedAt: new Date(),
            metrics: {
                ...usersStats,
                ...leadsStats,
                activeDevelopments: developmentsStats.length,
                // Placeholder para metrics que requieren joins complejos o falta data
                activeDevelopers: 0,
                activeModels: 0
            },
            topDevelopments: developmentsStats
        };
    }

    async saveStats(stats: DashboardStats): Promise<void> {
        const dateId = stats.date; // YYYY-MM-DD
        await this.db.collection('dashboard_stats').doc(dateId).set(stats);

        // También actualizamos el documento 'latest' para lectura rápida
        await this.db.collection('dashboard_stats').doc('latest').set(stats);
    }

    // --- Private Queries ---

    private async getUsersStats() {
        // Asumiendo que 'users' está en el mismo dataset que leads
        const query = `
            SELECT
                COUNTIF(DATE(createdAt) = CURRENT_DATE()) as newUsersDaily,
                COUNTIF(DATE(lastSeen) = CURRENT_DATE()) as activeUsersDaily
            FROM \`${this.DATASET_LEADS}.users_raw_latest\`
        `;

        try {
            const [rows] = await this.bq.query({ query });
            return rows[0] || { newUsersDaily: 0, activeUsersDaily: 0 };
        } catch (e) {
            console.error("Error querying Users stats:", e);
            return { newUsersDaily: 0, activeUsersDaily: 0 }; // Fail safe
        }
    }

    private async getLeadsStats() {
        const query = `
            WITH LiveLeads AS (
                SELECT * 
                FROM \`${this.DATASET_LEADS}.leads_raw_latest\`
                WHERE status NOT IN ('VENDIDO', 'PERDIDO', 'CANCELADO', 'WON', 'LOST')
            )
            SELECT
                (SELECT COUNT(*) FROM \`${this.DATASET_LEADS}.leads_raw_latest\` WHERE DATE(createdAt) = CURRENT_DATE()) as totalLeadsDaily,
                (SELECT COUNT(*) FROM LiveLeads) as leadsAlive,
                (SELECT COALESCE(SUM(CAST(comisionPorcentaje AS FLOAT64) * CAST(precioReferencia AS FLOAT64) / 100), 0) FROM LiveLeads) as potentialCommissions,
                (SELECT COUNT(*) FROM LiveLeads WHERE citainicial.dia >= CURRENT_TIMESTAMP()) as futureAppointments
        `;

        try {
            const [rows] = await this.bq.query({ query });
            return rows[0] || { totalLeadsDaily: 0, leadsAlive: 0, potentialCommissions: 0, futureAppointments: 0 };
        } catch (e) {
            console.error("Error querying Leads stats:", e);
            return { totalLeadsDaily: 0, leadsAlive: 0, potentialCommissions: 0, futureAppointments: 0 };
        }
    }

    private async getTopDevelopments() {
        // Agregación compleja por Desarrollo
        // Nota: Asumimos que idDesarrollo existe en leads
        const query = `
            SELECT
                idDesarrollo as id,
                ANY_VALUE(idDesarrollo) as name, -- Idealmente haríamos JOIN con 'desarrollos' table si estuviera sincronizada
                COUNT(*) as totalLeads,
                COUNTIF(status NOT IN ('VENDIDO', 'PERDIDO', 'CANCELADO', 'WON', 'LOST')) as activeLeads,
                COUNTIF(status IN ('VENDIDO', 'WON')) as m_won,
                COALESCE(SUM(CASE WHEN status IN ('VENDIDO', 'WON') THEN CAST(precioReferencia AS FLOAT64) ELSE 0 END), 0) as grossRevenue
            FROM \`${this.DATASET_LEADS}.leads_raw_latest\`
            GROUP BY idDesarrollo
            ORDER BY totalLeads DESC
            LIMIT 10
        `;

        try {
            const [rows] = await this.bq.query({ query });
            return rows.map((r: any) => ({
                id: r.id,
                name: r.name || 'Desconocido', // TODO: Fetch real name from Firestore if needed
                totalLeads: r.totalLeads,
                activeLeads: r.activeLeads,
                conversionRate: r.totalLeads > 0 ? (r.m_won / r.totalLeads) : 0,
                grossRevenue: r.grossRevenue
            }));
        } catch (e) {
            console.error("Error querying Developments:", e);
            return [];
        }
    }
}
