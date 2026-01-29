import React, { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import DataTable from '../../components/admin/DataTable';
import { STATUS, STATUS_LABELS } from '../../config/constants';
import { useService } from '../../hooks/useService';

const AdminLeads = () => {
    const { externalAdvisor, crm } = useService(); // Access externalAdvisor and crm service
    const { data, loading, refresh } = useAdminData();
    const { leads, desarrollos } = data;
    const [selectedLead, setSelectedLead] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [advisors, setAdvisors] = useState([]);
    const [loadingAdvisors, setLoadingAdvisors] = useState(false);
    const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'REGISTER'
    const [filter, setFilter] = useState('ALL');

    // Form State for new advisor
    const [newAdvisorForm, setNewAdvisorForm] = useState({ nombre: '', whatsapp: '', email: '', puesto: 'Asesor Comercial' });
    const [submitting, setSubmitting] = useState(false);

    const handleReport = async (lead) => {
        const desarrollo = desarrollos.find(d => String(d.id) === String(lead.desarrolloId));
        const devContact = desarrollo?.developerContact || {};

        // 1. Get Client Profile Data
        // Try to find by uid or clientUid
        const clientUser = data.users.find(u => u.uid === lead.uid || u.uid === lead.clienteUid);
        const perfil = clientUser?.perfilFinanciero || {};

        // 2. Get Lead History (Other leads for same person)
        const otherLeads = leads.filter(l =>
            (l.uid === lead.uid || l.clienteUid === lead.clienteUid) &&
            l.id !== lead.id
        );

        // Format Currency Helper
        const fmtMoney = (amount) => {
            if (!amount) return 'N/A';
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);
        };

        // Format Date Helper
        const fmtDate = (timestamp) => {
            if (!timestamp) return 'Por confirmar';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        };

        // --- CONSTRUCT MESSAGE ---
        let mensaje = `Hola! Te comparto un nuevo LEAD para *${lead.nombreDesarrollo}*:%0A%0A`;

        // A. Cita
        if (lead.citainicial) {
            mensaje += ` *Cita Agendada:*%0A` +
                `${fmtDate(lead.citainicial.dia)} a las ${lead.citainicial.hora}%0A%0A`;
        }

        // B. Cliente
        mensaje += ` *Cliente:* ${lead.clienteDatos?.nombre}%0A` +
            ` *Tel:* ${lead.clienteDatos?.telefono}%0A` +
            ` *Email:* ${lead.clienteDatos?.email}%0A%0A`;

        // C. Interés
        mensaje += ` *Modelo de Interés:* ${lead.modeloInteres || 'No especificado'}%0A`;

        // D. Perfil Financiero (Si existe)
        if (clientUser && perfil) {
            mensaje += `%0A *Perfil Financiero:*%0A` +
                `- Efvo. Inicial: ${fmtMoney(perfil.capitalInicial)}%0A` +
                `- Capacidad Mensual: ${fmtMoney(perfil.mensualidadMaxima)}%0A` +
                `- Habs. Deseadas: ${perfil.recamarasDeseadas || 'N/A'}%0A` +
                `- Interés: ${perfil.interesInmediato === true ? 'Entrega Inmediata' : perfil.interesInmediato === false ? 'Preventa' : 'Indistinto'}%0A`;
        }

        // E. Historial (Cross-selling info)
        if (otherLeads.length > 0) {
            mensaje += `%0A *Historial de Interés:*%0A`;
            otherLeads.slice(0, 3).forEach(l => { // Limit to 3 items
                const statusText = STATUS_LABELS[l.status] || l.status;
                mensaje += `- ${l.nombreDesarrollo} (${statusText})%0A`;
            });
        }

        mensaje += `%0A Por favor, indícame a qué asesor asignar.`;

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

    const openAssignModal = async (lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
        setViewMode('LIST');
        setLoadingAdvisors(true);
        try {
            // Fetch advisors for this lead's developer
            if (lead.idDesarrollador) {
                const results = await externalAdvisor.getByDeveloper(lead.idDesarrollador);
                setAdvisors(results);
            } else {
                setAdvisors([]);
                console.warn("Lead missing idDesarrollador");
            }
        } catch (error) {
            console.error("Error fetching advisors:", error);
        } finally {
            setLoadingAdvisors(false);
        }
    };

    const handleAssignExisting = async (advisor) => {
        if (!confirm(`¿Asignar lead a ${advisor.nombre}?`)) return;
        try {
            await crm.asignarAsesorExterno(selectedLead.id, advisor);
            setIsModalOpen(false);
            refresh();
        } catch (error) {
            alert("Error al asignar: " + error.message);
        }
    };

    const handleRegisterAndAssign = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Register
            const newAdvisor = await externalAdvisor.registerAdvisor({
                idDesarrollador: selectedLead.idDesarrollador,
                ...newAdvisorForm
            });

            // 2. Assign
            await crm.asignarAsesorExterno(selectedLead.id, newAdvisor); // newAdvisor usually returns { id, ...data }

            setIsModalOpen(false);
            refresh();
            setNewAdvisorForm({ nombre: '', whatsapp: '', email: '', puesto: 'Asesor Comercial' }); // Reset
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setSubmitting(false);
        }
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
                const s = row.status;
                let modifier = 'pending'; // Default
                if (s === 'REPORTED') modifier = 'reported';
                else if (s === 'ASSIGNED_EXTERNAL') modifier = 'assigned';
                else if (s === 'WON') modifier = 'won';

                return (
                    <span className={`admin-badge admin-badge--${modifier}`}>
                        {STATUS_LABELS[s] || s}
                    </span>
                );
            }
        },
        {
            header: 'Acciones', render: row => (
                <div className="admin-actions-group">
                    {(row.status === 'PENDING_DEVELOPER_CONTACT' || row.status === 'REPORTED') && (
                        <button onClick={() => handleReport(row)} className="action-btn action-btn--report">
                            Reportar
                        </button>
                    )}
                    {(row.status === 'PENDING_DEVELOPER_CONTACT' || row.status === 'REPORTED' || row.status === 'ASSIGNED_EXTERNAL') && (
                        <button onClick={() => openAssignModal(row)} className="action-btn action-btn--assign">
                            {row.status === 'ASSIGNED_EXTERNAL' ? 'Reasignar' : 'Asignar'}
                        </button>
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

            {/* ASSIGNMENT MODAL */}
            {isModalOpen && (
                <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal__header">
                            <h3 className="admin-modal__title">Asignar Lead: {selectedLead?.nombreDesarrollo}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="admin-modal__close">×</button>
                        </div>

                        <div className="admin-modal__body">
                            {viewMode === 'LIST' ? (
                                <>
                                    <div className="admin-modal__text">
                                        <p>Selecciona un asesor existente o registra uno nuevo.</p>
                                    </div>

                                    {loadingAdvisors ? (
                                        <div className="loading-container" style={{ height: '100px' }}>Cargando asesores...</div>
                                    ) : (
                                        <div className="advisor-list">
                                            {advisors.length > 0 ? (
                                                advisors.map(adv => (
                                                    <div key={adv.id} className="advisor-item" onClick={() => handleAssignExisting(adv)}>
                                                        <div className="advisor-item__name">{adv.nombre}</div>
                                                        <div className="advisor-item__detail">{adv.puesto} • {adv.whatsapp}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="advisor-list--empty">
                                                    No hay asesores registrados para este desarrollador aún.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setViewMode('REGISTER')}
                                        className="btn-accent btn-full"
                                    >
                                        + Registrar Nuevo Asesor
                                    </button>
                                </>
                            ) : (
                                <form onSubmit={handleRegisterAndAssign} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <h4 className="admin-modal__title" style={{ fontSize: '1rem' }}>Nuevo Asesor para {selectedLead?.nombreDesarrollo}</h4>
                                    <input
                                        placeholder="Nombre Completo"
                                        required
                                        className="admin-input"
                                        value={newAdvisorForm.nombre}
                                        onChange={e => setNewAdvisorForm({ ...newAdvisorForm, nombre: e.target.value })}
                                    />
                                    <input
                                        placeholder="WhatsApp (Solo números)"
                                        required
                                        pattern="\d+"
                                        className="admin-input"
                                        value={newAdvisorForm.whatsapp}
                                        onChange={e => setNewAdvisorForm({ ...newAdvisorForm, whatsapp: e.target.value })}
                                    />
                                    <input
                                        placeholder="Email (Opcional)"
                                        type="email"
                                        className="admin-input"
                                        value={newAdvisorForm.email}
                                        onChange={e => setNewAdvisorForm({ ...newAdvisorForm, email: e.target.value })}
                                    />

                                    <div className="btn-group">
                                        <button type="button" onClick={() => setViewMode('LIST')} className="btn-secondary" style={{ flex: 1 }}>
                                            Volver a Lista
                                        </button>
                                        <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                                            {submitting ? 'Guardando...' : 'Guardar y Asignar'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
