import React, { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import DataTable from '../../components/admin/DataTable';
import { STATUS } from '../../config/constants';
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
                mensaje += `- ${l.nombreDesarrollo} (${l.status})%0A`;
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
                let color = '#64748b'; // default slate
                const s = row.status;
                if (s === 'PENDING_DEVELOPER_CONTACT') color = '#e11d48';
                else if (s === 'REPORTED') color = '#f59e0b';
                else if (s === 'ASSIGNED_EXTERNAL') color = '#3b82f6';
                else if (s === 'WON') color = '#10b981';

                return (
                    <span style={{
                        backgroundColor: color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                    }}>
                        {s}
                    </span>
                );
            }
        },
        {
            header: 'Acciones', render: row => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {row.status === 'PENDING_DEVELOPER_CONTACT' && (
                        <button onClick={() => handleReport(row)} style={styles.actionBtnReport}>Reportar</button>
                    )}
                    {(row.status === 'REPORTED' || row.status === 'ASSIGNED_EXTERNAL') && (
                        <button onClick={() => openAssignModal(row)} style={styles.actionBtnAssign}>
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
                <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Asignar Lead: {selectedLead?.nombreDesarrollo}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>X</button>
                        </div>

                        <div style={styles.modalBody}>
                            {viewMode === 'LIST' ? (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <p>Selecciona un asesor existente o registra uno nuevo.</p>
                                    </div>

                                    {loadingAdvisors ? (
                                        <div>Cargando asesores...</div>
                                    ) : (
                                        <div style={styles.advisorsList}>
                                            {advisors.length > 0 ? (
                                                advisors.map(adv => (
                                                    <div key={adv.id} style={styles.advisorItem} onClick={() => handleAssignExisting(adv)}>
                                                        <div style={{ fontWeight: 'bold' }}>{adv.nombre}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{adv.puesto} • {adv.whatsapp}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                                                    No hay asesores registrados para este desarrollador aún.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setViewMode('REGISTER')}
                                        style={styles.registerBtn}
                                    >
                                        + Registrar Nuevo Asesor
                                    </button>
                                </>
                            ) : (
                                <form onSubmit={handleRegisterAndAssign} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <h4>Nuevo Asesor para {selectedLead?.nombreDesarrollo}</h4>
                                    <input
                                        placeholder="Nombre Completo"
                                        required
                                        style={styles.input}
                                        value={newAdvisorForm.nombre}
                                        onChange={e => setNewAdvisorForm({ ...newAdvisorForm, nombre: e.target.value })}
                                    />
                                    <input
                                        placeholder="WhatsApp (Solo números)"
                                        required
                                        pattern="\d+"
                                        style={styles.input}
                                        value={newAdvisorForm.whatsapp}
                                        onChange={e => setNewAdvisorForm({ ...newAdvisorForm, whatsapp: e.target.value })}
                                    />
                                    <input
                                        placeholder="Email (Opcional)"
                                        type="email"
                                        style={styles.input}
                                        value={newAdvisorForm.email}
                                        onChange={e => setNewAdvisorForm({ ...newAdvisorForm, email: e.target.value })}
                                    />

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button type="button" onClick={() => setViewMode('LIST')} style={styles.cancelBtn}>
                                            Volver a Lista
                                        </button>
                                        <button type="submit" disabled={submitting} style={styles.submitBtn}>
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

const styles = {
    actionBtnReport: { background: '#be123c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    actionBtnAssign: { background: '#f97316', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },

    // Modal Styles (Inline for speed, ideally moved to CSS or Modal Component)
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    },
    modalContent: {
        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px'
    },
    closeBtn: {
        background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer'
    },
    advisorsList: {
        display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto'
    },
    advisorItem: {
        padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
        ':hover': { backgroundColor: '#f1f5f9' } // Note: Inline styles don't support pseudo-classes generally without libs, but this is a rough indication.
    },
    registerBtn: {
        width: '100%', padding: '12px', background: '#eab308', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
    },
    input: {
        padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1'
    },
    submitBtn: {
        flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
    },
    cancelBtn: {
        flex: 1, padding: '10px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
    }
};

export default AdminLeads;
