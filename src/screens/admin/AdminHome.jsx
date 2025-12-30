import React from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import KPICard from '../../components/admin/KPICard';
import { STATUS } from '../../config/constants';

const AdminHome = () => {
    const { data, loading } = useAdminData();
    const { leads, users, desarrollos } = data;

    if (loading) return <div className="p-10 text-center">Cargando Dashboard...</div>;

    // --- CALCULATE METRICS ---
    const asesores = users.filter(u => u.role === 'asesor');
    const leadsGanados = leads.filter(l => l.status === STATUS.LEAD_WON || l.status === 'WON').length;
    const leadsPerdidos = leads.filter(l => l.status === STATUS.LEAD_LOST || l.status === 'LOST').length;
    const leadsActivos = leads.length - (leadsGanados + leadsPerdidos);
    const leadsPorReportar = leads.filter(l => l.status === 'PENDING_DEVELOPER_CONTACT').length;

    // Calculate Estimated Commission (Simple Logic)
    const comisionEstimada = leads
        .filter(l => l.status === STATUS.LEAD_ASSIGNED_EXTERNAL || l.status === 'ASSIGNED_EXTERNAL')
        .reduce((acc, curr) => acc + (curr.precioPresupuesto || 0) * 0.035, 0);

    return (
        <div className="admin-home animate-fade-in">
            <h1 style={{ marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-main)' }}>Resumen General</h1>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <KPICard
                    title="Total Leads"
                    value={leads.length}
                    icon="📋"
                    subtext={`${leadsPorReportar} por reportar`}
                    color="blue"
                />
                <KPICard
                    title="Leads Activos"
                    value={leadsActivos}
                    icon="🔥"
                    color="green"
                />
                <KPICard
                    title="Usuarios Totales"
                    value={users.length}
                    subtext={`${asesores.length} asesores`}
                    icon="👥"
                    color="yellow"
                />
                <KPICard
                    title="Comisión Est."
                    value={`$${Math.round(comisionEstimada).toLocaleString()}`}
                    icon="💰"
                    color="green"
                />
            </div>

            {/* QUICK ACTIONS / ALERTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="admin-card" style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ marginTop: 0 }}>⚠️ Atención Requerida</h3>
                    {leadsPorReportar > 0 ? (
                        <div style={{ color: '#be123c', background: '#fff1f2', padding: '10px', borderRadius: '6px' }}>
                            Hay <strong>{leadsPorReportar} leads</strong> esperando ser reportados a los desarrolladores.
                            <br />
                            <a href="/administrador/leads" style={{ color: '#be123c', fontWeight: 'bold' }}>Ir a Gestionar &rarr;</a>
                        </div>
                    ) : (
                        <div style={{ color: '#047857', background: '#ecfdf5', padding: '10px', borderRadius: '6px' }}>
                            ¡Todo al día! No hay leads pendientes de reporte.
                        </div>
                    )}
                </div>

                <div className="admin-card" style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ marginTop: 0 }}>Estado del Sistema</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '10px' }}>✅ Base de Datos Conectada</li>
                        <li style={{ marginBottom: '10px' }}>✅ {desarrollos.length} Desarrollos Activos</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;
