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
exports.BigQueryDashboardRepository = void 0;
const bigquery_1 = require("@google-cloud/bigquery");
const admin = __importStar(require("firebase-admin"));
class BigQueryDashboardRepository {
    constructor() {
        // Configuración de Datasets (Sincronizados con Google Cloud Console)
        this.PROJECT_ID = 'inmueble-advisor-app';
        this.DATASET_LEADS = 'firestore_export_leads';
        this.DATASET_USERS = 'firestore_export_users'; // Dataset independiente detectado en auditoría visual
        this.bq = new bigquery_1.BigQuery();
        this.db = admin.firestore();
    }
    async generateDailyStats(isHistorical = true) {
        // Al ejecutar a las 00:01 (isHistorical), el día analizado es AYER.
        // Al presionar Refresh (real-time), el día analizado es HOY.
        const targetDate = new Date();
        if (isHistorical) {
            targetDate.setDate(targetDate.getDate() - 1);
        }
        const dayAnalyzed = targetDate.toISOString().split('T')[0];
        const dayFilter = isHistorical ? "DATE_SUB(CURRENT_DATE('America/Mexico_City'), INTERVAL 1 DAY)" : "CURRENT_DATE('America/Mexico_City')";
        // 1. Ejecutar consultas en paralelo
        const [usersStats, leadsStats, developmentsStats, activeDevelopers] = await Promise.all([
            this.getUsersStats(dayFilter),
            this.getLeadsStats(dayFilter),
            this.getTopDevelopments(),
            this.getActiveDevelopersCount()
        ]);
        return {
            date: dayAnalyzed,
            generatedAt: new Date(),
            metrics: Object.assign(Object.assign(Object.assign({}, usersStats), leadsStats), { activeDevelopments: developmentsStats.length, activeDevelopers: activeDevelopers, activeModels: 0 // Todavía requiere join con catálogo
             }),
            topDevelopments: developmentsStats
        };
    }
    async saveStats(stats) {
        const dateId = stats.date; // YYYY-MM-DD
        await this.db.collection('dashboard_stats').doc(dateId).set(stats);
        // También actualizamos el documento 'latest' para lectura rápida
        await this.db.collection('dashboard_stats').doc('latest').set(stats);
    }
    // --- Private Queries ---
    async getUsersStats(dayFilter) {
        // UPDATED: Using absolute PROJECT.DATASET.TABLE path
        const query = `
            SELECT
                COUNTIF(DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)), 'America/Mexico_City') = ${dayFilter}) as newUsersDaily,
                COUNTIF(DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.lastSeen._seconds') AS INT64)), 'America/Mexico_City') = ${dayFilter}) as activeUsersDaily
            FROM \`${this.PROJECT_ID}.${this.DATASET_USERS}.users_raw_latest\`
        `;
        try {
            const [rows] = await this.bq.query({ query });
            console.log("🔍 [DEBUG] Users Raw Sample:", JSON.stringify(rows[0]));
            return rows[0] || { newUsersDaily: 0, activeUsersDaily: 0 };
        }
        catch (e) {
            console.error("Error querying Users stats:", e);
            return { newUsersDaily: 0, activeUsersDaily: 0 }; // Fail safe
        }
    }
    async getLeadsStats(dayFilter) {
        // FIXED: Added SAFE to prevent crashes on null timestamps
        const query = `
            WITH LiveLeads AS (
                SELECT data 
                FROM \`${this.DATASET_LEADS}.leads_raw_latest\`
                WHERE JSON_VALUE(data, '$.status') NOT IN ('VENDIDO', 'PERDIDO', 'CANCELADO', 'WON', 'LOST')
            )
            SELECT
                (SELECT COUNT(*) FROM \`${this.PROJECT_ID}.${this.DATASET_LEADS}.leads_raw_latest\` 
                 WHERE DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)), 'America/Mexico_City') = ${dayFilter}) as totalLeadsDaily,
                (SELECT COUNT(*) FROM LiveLeads) as leadsAlive,
                (SELECT COALESCE(SUM(CAST(JSON_VALUE(data, '$.comisionPorcentaje') AS FLOAT64) * CAST(JSON_VALUE(data, '$.precioReferencia') AS FLOAT64) / 100), 0) FROM LiveLeads) as potentialCommissions,
                (SELECT COUNT(*) FROM LiveLeads WHERE SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.citainicial.dia._seconds') AS INT64)) >= CURRENT_TIMESTAMP()) as futureAppointments
        `;
        try {
            const [rows] = await this.bq.query({ query });
            console.log("🔍 [DEBUG] Leads Raw Sample:", JSON.stringify(rows[0]));
            return rows[0] || { totalLeadsDaily: 0, leadsAlive: 0, potentialCommissions: 0, futureAppointments: 0 };
        }
        catch (e) {
            console.error("Error querying Leads stats:", e);
            return { totalLeadsDaily: 0, leadsAlive: 0, potentialCommissions: 0, futureAppointments: 0 };
        }
    }
    async getTopDevelopments() {
        // Agregación compleja por Desarrollo usando JSON parsing
        const query = `
            SELECT
                JSON_VALUE(data, '$.idDesarrollo') as id,
                ANY_VALUE(JSON_VALUE(data, '$.idDesarrollo')) as name, -- Idealmente haríamos JOIN con 'desarrollos' table si estuviera sincronizada
                COUNT(*) as totalLeads,
                COUNTIF(JSON_VALUE(data, '$.status') NOT IN ('VENDIDO', 'PERDIDO', 'CANCELADO', 'WON', 'LOST')) as activeLeads,
                COUNTIF(JSON_VALUE(data, '$.status') IN ('VENDIDO', 'WON')) as m_won,
                COALESCE(SUM(CASE WHEN JSON_VALUE(data, '$.status') IN ('VENDIDO', 'WON') THEN CAST(JSON_VALUE(data, '$.precioReferencia') AS FLOAT64) ELSE 0 END), 0) as grossRevenue
            FROM \`${this.PROJECT_ID}.${this.DATASET_LEADS}.leads_raw_latest\`
            GROUP BY 1
            ORDER BY totalLeads DESC
            LIMIT 10
        `;
        try {
            const [rows] = await this.bq.query({ query });
            return rows.map((r) => ({
                id: r.id,
                name: r.name || 'Desconocido',
                totalLeads: r.totalLeads,
                activeLeads: r.activeLeads,
                conversionRate: r.totalLeads > 0 ? (r.m_won / r.totalLeads) : 0,
                grossRevenue: r.grossRevenue
            }));
        }
        catch (e) {
            console.error("Error querying Developments:", e);
            return [];
        }
    }
    async getActiveDevelopersCount() {
        var _a;
        const query = `
            SELECT COUNT(DISTINCT JSON_VALUE(data, '$.idDesarrollador')) as count
            FROM \`${this.PROJECT_ID}.${this.DATASET_LEADS}.leads_raw_latest\`
            WHERE JSON_VALUE(data, '$.status') NOT IN ('PERDIDO', 'CANCELADO', 'LOST')
        `;
        try {
            const [rows] = await this.bq.query({ query });
            return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        }
        catch (e) {
            console.error("Error querying Developers count:", e);
            return 0;
        }
    }
}
exports.BigQueryDashboardRepository = BigQueryDashboardRepository;
//# sourceMappingURL=BigQueryDashboardRepository.js.map