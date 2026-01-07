import React, { useEffect, useState } from 'react';
import { DashboardService } from '../../services/dashboard.service';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { Users, UserPlus, Timer, Layout, DollarSign, Calendar } from 'lucide-react';

const AdminHome = () => {
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
            const current = await DashboardService.getLatestStats();
            setStats(current);

            // 2. Fetch history for charts (mocked length based on filter)
            const daysMap = { '7d': 7, '30d': 30, '12m': 12 }; // 12m logic would need monthly aggregation
            const hist = await DashboardService.getDailyHistory(daysMap[dateFilter] || 7);

            // Reverse to show oldest -> newest
            setHistory(hist.reverse());
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return <div className="p-8 text-center">Cargando Dashboard...</div>;
    if (!stats) return <div className="p-8 text-center">No hay datos disponibles aún. Asegúrate de ejecutar el Cloud Function.</div>;

    const { metrics, topDevelopments } = stats;

    return (
        <div className="space-y-8">
            {/* HEADER & FILTERS */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard General</h1>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                    {['today', '7d', '30d'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setDateFilter(filter)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateFilter === filter
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {filter === 'today' ? 'Hoy' : filter.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* METRIC CARDS (DATOS DUROS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    label="Usuarios Activos (Hoy)"
                    value={metrics.activeUsersDaily}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <MetricCard
                    label="Usuarios Nuevos"
                    value={metrics.newUsersDaily}
                    icon={UserPlus}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <MetricCard
                    label="Leads Vivos"
                    value={metrics.leadsAlive}
                    icon={Layout}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <MetricCard
                    label="Comisiones Potenciales"
                    value={`$${(metrics.potentialCommissions / 1000000).toFixed(2)}M`}
                    icon={DollarSign}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    subtext="MXN (Estimado)"
                />
                <MetricCard
                    label="Citas (Prox 10 días)"
                    value={metrics.futureAppointments}
                    icon={Calendar}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <MetricCard
                    label="Promedio Tiempo/Sitio"
                    value="-- min" // Placeholder until events data flows
                    icon={Timer}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    subtext="Próximamente"
                />
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Leads & Traffic Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Progreso de Usuarios y Leads</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => str.slice(5)} // Show MM-DD
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
                </div>

                {/* Chart 2: Conversion Funnel (Mocked/Partial) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad de Desarrollo</h3>
                    <div className="h-72">
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
                </div>
            </div>

            {/* TOP 10 DEVELOPMENTS TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Top 10 Desarrollos</h3>
                    {/* Placeholder for City Filter */}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Filtro Ciudad: Todas</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Desarrollo</th>
                                <th className="px-6 py-3 text-right">Leads Totales</th>
                                <th className="px-6 py-3 text-right">Leads Vivos</th>
                                <th className="px-6 py-3 text-right">% Cierre</th>
                                <th className="px-6 py-3 text-right">Ingresos Brutos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topDevelopments.map((dev) => (
                                <tr key={dev.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{dev.name}</td>
                                    <td className="px-6 py-4 text-right">{dev.totalLeads}</td>
                                    <td className="px-6 py-4 text-right font-medium text-blue-600">{dev.activeLeads}</td>
                                    <td className="px-6 py-4 text-right">{(dev.conversionRate * 100).toFixed(1)}%</td>
                                    <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                                        ${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(dev.grossRevenue)}
                                    </td>
                                </tr>
                            ))}
                            {topDevelopments.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        No hay datos de desarrollos disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Cards
const MetricCard = ({ label, value, icon: Icon, color, bg, subtext }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

export default AdminHome;
