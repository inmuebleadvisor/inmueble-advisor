import React, { useEffect, useState } from 'react';
import { useService } from '../../hooks/useService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { Users, UserPlus, Timer, Layout, DollarSign, Calendar } from 'lucide-react';

const AdminHome = () => {
    const { dashboard } = useService();
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('7d'); // 'today', '7d', '30d', '12m'

    useEffect(() => {
        loadData();
    }, [dateFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch latest snapshot
            const current = await dashboard.getLatestStats();
            setStats(current);

            // 2. Fetch history for charts (mocked length based on filter)
            const daysMap = { '7d': 7, '30d': 30, '12m': 12 }; // 12m logic would need monthly aggregation
            const hist = await dashboard.getDailyHistory(daysMap[dateFilter] || 7);

            // Reverse to show oldest -> newest
            setHistory(hist.reverse());
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return <div className="admin-loading">Cargando Dashboard...</div>;
    if (!stats) return <div className="admin-loading">No hay datos disponibles aún. Asegúrate de ejecutar el Cloud Function.</div>;

    const { metrics, topDevelopments } = stats;

    return (
        <div className="admin-home">
            {/* HEADER & FILTERS */}
            <div className="admin-home__controls">
                <h1 className="admin-home__title">Dashboard General</h1>
                <div className="admin-home__filters">
                    {['today', '7d', '30d'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setDateFilter(filter)}
                            className={`admin-home__filter-btn ${dateFilter === filter ? 'admin-home__filter-btn--active' : ''}`}
                        >
                            {filter === 'today' ? 'Hoy' : filter.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* METRIC CARDS */}
            <section className="admin-metrics-grid">
                <MetricCard
                    label="Usuarios Activos (Hoy)"
                    value={metrics.activeUsersDaily}
                    icon={Users}
                    variant="blue"
                />
                <MetricCard
                    label="Usuarios Nuevos"
                    value={metrics.newUsersDaily}
                    icon={UserPlus}
                    variant="green"
                />
                <MetricCard
                    label="Leads Vivos"
                    value={metrics.leadsAlive}
                    icon={Layout}
                    variant="purple"
                />
                <MetricCard
                    label="Comisiones Potenciales"
                    value={`$${(metrics.potentialCommissions / 1000000).toFixed(2)}M`}
                    icon={DollarSign}
                    variant="amber"
                    subtext="MXN (Estimado)"
                />
                <MetricCard
                    label="Citas (Prox 10 días)"
                    value={metrics.futureAppointments}
                    icon={Calendar}
                    variant="indigo"
                />
                {/* 
                <MetricCard
                    label="Promedio Tiempo/Sitio"
                    value="-- min"
                    icon={Timer}
                    variant="rose"
                    subtext="Próximamente"
                /> 
                */}
            </section>

            {/* CHARTS SECTION */}
            <section className="admin-charts-section">
                {/* Chart 1 */}
                <article className="admin-chart-card">
                    <h3 className="admin-chart-card__title">Progreso de Usuarios y Leads</h3>
                    <div className="admin-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => str.slice(5)}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="metrics.newUsersDaily" name="Nuevos Usuarios" stroke="#10B981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="metrics.totalLeadsDaily" name="Nuevos Leads" stroke="#6366F1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                {/* Chart 2 */}
                <article className="admin-chart-card">
                    <h3 className="admin-chart-card__title">Actividad de Desarrollo</h3>
                    <div className="admin-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topDevelopments.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend />
                                <Bar dataKey="totalLeads" name="Total Leads" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="activeLeads" name="Leads Activos" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </section>

            {/* TOP 10 DEVELOPMENTS TABLE */}
            <section className="admin-table-section">
                <div className="admin-table-header">
                    <h3 className="admin-table-header__title">Top 10 Desarrollos</h3>
                    {/* Placeholder for City Filter */}
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Desarrollo</th>
                                <th className="admin-table__cell--right">Leads Totales</th>
                                <th className="admin-table__cell--right">Leads Vivos</th>
                                <th className="admin-table__cell--right">% Cierre</th>
                                <th className="admin-table__cell--right">Ingresos Brutos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topDevelopments.map((dev) => (
                                <tr key={dev.id}>
                                    <td>{dev.name}</td>
                                    <td className="admin-table__cell--right">{dev.totalLeads}</td>
                                    <td className="admin-table__cell--right admin-table__cell--highlight">{dev.activeLeads}</td>
                                    <td className="admin-table__cell--right">{(dev.conversionRate * 100).toFixed(1)}%</td>
                                    <td className="admin-table__cell--right admin-table__cell--success">
                                        ${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(dev.grossRevenue)}
                                    </td>
                                </tr>
                            ))}
                            {topDevelopments.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="admin-table__empty-state">
                                        No hay datos de desarrollos disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

// Sub-component for Cards
const MetricCard = ({ label, value, icon: Icon, variant = 'blue', subtext }) => (
    <div className="admin-metric-card">
        <div className="admin-metric-card__content">
            <p className="admin-metric-card__label">{label}</p>
            <h4 className="admin-metric-card__value">{value}</h4>
            {subtext && <p className="admin-metric-card__subtext">{subtext}</p>}
        </div>
        <div className={`admin-metric-card__icon-wrapper admin-metric-card__icon-wrapper--${variant}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

export default AdminHome;
