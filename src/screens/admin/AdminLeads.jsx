import React, { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import DataTable from '../../components/admin/DataTable';
import { STATUS } from '../../config/constants';
import { useService } from '../../hooks/useService';

const AdminLeads = () => {
    const { crm } = useService();
    const { data, loading, refresh } = useAdminData();
    const { leads, desarrollos } = data;
    const [filter, setFilter] = useState('ALL');

    const handleReport = async (lead) => {
        const desarrollo = desarrollos.find(d => String(d.id) === String(lead.desarrolloId));
        const devContact = desarrollo?.developerContact || {};

        const mensaje = `Hola! Te comparto un nuevo LEAD para *${lead.nombreDesarrollo}*:%0A%0A` +
            `👤 *Cliente:* ${lead.clienteDatos?.nombre}%0A` +
            `📞 *Tel:* ${lead.clienteDatos?.telefono}%0A` +
            `✉️ *Email:* ${lead.clienteDatos?.email}%0A` +
            `🏠 *Interés:* ${lead.modeloInteres}%0A%0A` +
            `Por favor, indícame a qué asesor se le asigna para dar seguimiento.`;

        // Open WA
        const url = devContact.phone
            ? `https://wa.me/${devContact.phone}?text=${mensaje}`
            : `https://wa.me/?text=${mensaje}`; // Fallback

        window.open(url, '_blank');

        if (confirm("¿Se envió el reporte? Confirmar para actualizar estado.")) {
            await crm.marcarComoReportado(lead.id);
            refresh(); // Reload data
        }
    };

    const handleAssign = async (lead) => {
        const nombreVal = prompt("Nombre del Asesor Externo:");
        if (!nombreVal) return;

        await crm.asignarAsesorExterno(lead.id, { nombre: nombreVal });
        refresh();
    };

    // --- TABLE COLUMNS ---
    const columns = [
        {
            header: 'Cliente', accessor: 'clienteDatos', render: row => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{row.clienteDatos?.nombre || 'Anónimo'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.clienteDatos?.email}</div>
                </div>
            )
        },
        { header: 'Desarrollo', accessor: 'nombreDesarrollo' },
        {
            header: 'Estado', accessor: 'status', render: row => {
                let color = '#64748b'; // default slate
                if (row.status === 'PENDING_DEVELOPER_CONTACT') color = '#e11d48';
                if (row.status === 'REPORTED') color = '#f59e0b';
                if (row.status === 'ASSIGNED_EXTERNAL') color = '#3b82f6';
                if (row.status === 'WON') color = '#10b981';

                return (
                    <span style={{
                        backgroundColor: color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                    }}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            header: 'Acciones', render: row => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {row.status === 'PENDING_DEVELOPER_CONTACT' && (
                        <button onClick={() => handleReport(row)} style={{
                            background: '#be123c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
                        }}>Reportar</button>
                    )}
                    {row.status === 'REPORTED' && (
                        <button onClick={() => handleAssign(row)} style={{
                            background: '#f97316', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
                        }}>Asignar</button>
                    )}
                </div>
            )
        }
    ];

    const filteredLeads = filter === 'ALL' ? leads : leads.filter(l => l.status === filter);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Gestión de Leads</h1>
                <select onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
                    <option value="ALL">Todos los Estados</option>
                    <option value="PENDING_DEVELOPER_CONTACT">Por Reportar</option>
                    <option value="REPORTED">Reportados</option>
                    <option value="ASSIGNED_EXTERNAL">En Seguimiento</option>
                </select>
            </div>
            <DataTable columns={columns} data={filteredLeads} isLoading={loading} />
        </div>
    );
};

export default AdminLeads;
