import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import { getAllDesarrollos, getAllLeads, getAllUsers } from '../services/admin.service';
import { marcarComoReportado, asignarAsesorExterno, registrarHito } from '../services/crm.service'; // Added registrarHito

import { useTheme } from '../context/ThemeContext';
import ExternalAdvisorModal from '../components/ExternalAdvisorModal'; // Importar Modal

import { db } from '../firebase/config';


const INITIAL_METRICS = {
    totalLeads: 0,
    totalUsers: 0,
    totalClientes: 0,
    totalAsesores: 0,
    leadsActivos: 0,
    leadsGanados: 0,
    leadsPerdidos: 0,
    // "Fake" analytics
    mostVisitedProp: 'Torre Andanza',
    avgSession: '4m 12s'
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('general'); // general | asesores | propiedades
    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [desarrollos, setDesarrollos] = useState([]);
    const [metrics, setMetrics] = useState(INITIAL_METRICS);

    const { currentSeason } = useTheme();


    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLeadForAssign, setSelectedLeadForAssign] = useState(null);



    // Initial Data Load
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Parallel fetch for speed
                const [usersData, leadsData, devData] = await Promise.all([
                    getAllUsers(),
                    getAllLeads(),
                    getAllDesarrollos()
                ]);

                setUsers(usersData);
                setLeads(leadsData);
                setDesarrollos(devData);



                // Calculate Metrics
                const asesores = usersData.filter(u => u.role === 'asesor');
                const ganados = leadsData.filter(l => l.status === 'WON').length;
                const perdidos = leadsData.filter(l => l.status === 'LOST').length;

                // Calculate Top Property (Most Leads)
                const leadsByDev = {};
                leadsData.forEach(lead => {
                    const name = lead.nombreDesarrollo || 'Desconocido';
                    leadsByDev[name] = (leadsByDev[name] || 0) + 1;
                });
                let topProp = 'N/A';
                let maxLeads = 0;
                Object.entries(leadsByDev).forEach(([name, count]) => {
                    if (count > maxLeads) {
                        maxLeads = count;
                        topProp = name;
                    }
                });

                setMetrics({
                    totalLeads: leadsData.length,
                    totalUsers: usersData.length,
                    totalClientes: usersData.length - asesores.length,
                    totalAsesores: asesores.length,
                    leadsActivos: leadsData.length - (ganados + perdidos),
                    leadsGanados: ganados,
                    leadsPerdidos: perdidos,
                    mostVisitedProp: topProp,
                    avgSession: '5m 30s' // Hardcoded placeholder (requires analytics)
                });

            } catch (error) {
                console.error("Error loading admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 🗑️ DELETED duplicate handlers (consolidated below)



    // --- NEW HANDLERS: DEVELOPER RELATIONSHIP MANAGEMENT ---

    // 1. Reportar Lead vía WhatsApp
    const handleReportLead = async (lead) => {
        const desarrollo = desarrollos.find(d => String(d.id) === String(lead.desarrolloId));
        const devContact = desarrollo?.developerContact || {}; // TODO: Asegurar que este campo exista en el futuro

        // Construir Mensaje
        const mensaje = `Hola! Te comparto un nuevo LEAD para *${lead.nombreDesarrollo}*:%0A%0A` +
            `👤 *Cliente:* ${lead.clienteDatos?.nombre}%0A` +
            `📞 *Tel:* ${lead.clienteDatos?.telefono}%0A` +
            `✉️ *Email:* ${lead.clienteDatos?.email}%0A` +
            `🏠 *Interés:* ${lead.modeloInteres}%0A%0A` +
            `Por favor, indícame a qué asesor se le asigna para dar seguimiento.`;

        // Si hay número del developer, abrir chat. Si no, solo copiar al portapapeles o avisar.
        if (devContact.phone) {
            window.open(`https://wa.me/${devContact.phone}?text=${mensaje}`, '_blank');
        } else {
            // Fallback: Abrir WhatsApp genérico o copiar
            // Por simplicidad, abrimos WhatsApp Web vacío con el texto listo para enviar a quien sea
            window.open(`https://wa.me/?text=${mensaje}`, '_blank');
        }

        // Actualizar estado en BD
        if (confirm("¿Ya enviaste el reporte al desarrollador? Se marcará como 'Reportado'.")) {
            await marcarComoReportado(lead.id);
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'REPORTED' } : l));
        }
    };

    // 2. Asignar Asesor Externo
    const handleAssignExternal = async (lead) => {
        const nombreAsesor = prompt("Nombre del Asesor (Developer/Externo) asignado:");
        if (!nombreAsesor) return;

        const telefonoAsesor = prompt("Teléfono del Asesor (Opcional):") || "";

        await asignarAsesorExterno(lead.id, { nombre: nombreAsesor, telefono: telefonoAsesor });

        setLeads(prev => prev.map(l => l.id === lead.id ? {
            ...l,
            status: 'ASSIGNED_EXTERNAL',
            externalAdvisor: { nombre: nombreAsesor, telefono: telefonoAsesor }
        } : l));
    };


    // --- MASS IMPORT HANDLERS ---


    if (loading) {
        return <div className="loading-container">Cargando Panel de Administrador...</div>;
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-dashboard__header">
                <h1 className="admin-dashboard__title">Panel de Administrador</h1>
                <p className="admin-dashboard__subtitle">Control centralizado de Inmueble Advisor</p>
            </header>

            {/* Navigation Tabs */}
            <div className="admin-dashboard__tabs">
                <button
                    className={`admin-dashboard__tab ${activeTab === 'general' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    DASHBOARD DE GESTIÓN B2B
                </button>
                <button

                    className={`admin-dashboard__tab ${activeTab === 'config' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    Configuración
                </button>
            </div>

            {/* --- CONTENT: GENERAL --- */}
            {activeTab === 'general' && (
                <>
                    {/* MINI METRICS */}
                    <div className="admin-grid-metrics">
                        <div className="metric-card">
                            <h3>Total Leads</h3>
                            <p className="metric-value">{metrics.totalLeads}</p>
                        </div>
                        <div className="metric-card">
                            <h3>Por Reportar</h3>
                            <p className="metric-value" style={{ color: '#be123c' }}>
                                {leads.filter(l => l.status === 'PENDING_DEVELOPER_CONTACT').length}
                            </p>
                        </div>
                        <div className="metric-card">
                            <h3>En Seguimiento</h3>
                            <p className="metric-value" style={{ color: '#3b82f6' }}>
                                {leads.filter(l => l.status === 'ASSIGNED_EXTERNAL').length}
                            </p>
                        </div>
                        <div className="metric-card">
                            <h3>Comisiones Est.</h3>
                            {/* Calculo Rapido */}
                            <p className="metric-value" style={{ color: '#059669', fontSize: '1.2rem' }}>
                                ${Math.round(leads.filter(l => l.status === 'ASSIGNED_EXTERNAL').reduce((acc, curr) => acc + (curr.precioPresupuesto || 0) * 0.035, 0)).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="admin-section">
                        <h3 className="admin-section__title">Gestión de Leads (Modelo Developer)</h3>

                        {/* KANBAN / LISTA DE TAREAS URGENTES */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                            {/* COLUMNA 1: POR REPORTAR */}
                            <div className="admin-card-column" style={{ background: '#fff1f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                                <h4 style={{ color: '#9f1239', margin: '0 0 10px 0' }}>⚠️ Por Reportar al Dev ({leads.filter(l => l.status === 'PENDING_DEVELOPER_CONTACT').length})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {leads.filter(l => l.status === 'PENDING_DEVELOPER_CONTACT').map(lead => (
                                        <div key={lead.id} style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #fda4af' }}>
                                            <div style={{ fontWeight: 'bold' }}>{lead.clienteDatos?.nombre}</div>
                                            <div style={{ fontSize: '0.8rem' }}>{lead.nombreDesarrollo}</div>
                                            <button
                                                onClick={() => handleReportLead(lead)}
                                                style={{ marginTop: '5px', width: '100%', background: '#be123c', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Reportar WA
                                            </button>
                                        </div>
                                    ))}
                                    {leads.filter(l => l.status === 'PENDING_DEVELOPER_CONTACT').length === 0 && <span style={{ fontSize: '0.8rem', color: '#888' }}>Todo al día.</span>}
                                </div>
                            </div>

                            {/* COLUMNA 2: REPORTADOS (ESPERANDO ASIGNACIÓN) */}
                            <div className="admin-card-column" style={{ background: '#fff7ed', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                                <h4 style={{ color: '#9a3412', margin: '0 0 10px 0' }}>⏳ Esperando Asesor ({leads.filter(l => l.status === 'REPORTED').length})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {leads.filter(l => l.status === 'REPORTED').map(lead => (
                                        <div key={lead.id} style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #fdba74' }}>
                                            <div style={{ fontWeight: 'bold' }}>{lead.clienteDatos?.nombre}</div>
                                            <div style={{ fontSize: '0.8rem' }}>{lead.nombreDesarrollo}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>Reportado hace: {lead.fechaReporte ? new Date(lead.fechaReporte.toDate()).toLocaleTimeString() : 'N/A'}</div>
                                            <button
                                                onClick={() => handleAssignExternal(lead)}
                                                style={{ marginTop: '5px', width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Registrar Asesor
                                            </button>
                                        </div>
                                    ))}
                                    {leads.filter(l => l.status === 'REPORTED').length === 0 && <span style={{ fontSize: '0.8rem', color: '#888' }}>Sin pendientes.</span>}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="admin-section">
                        <h3 className="admin-section__title">Actividad Reciente</h3>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Fecha (Est)</th>
                                        <th>Tipo</th>
                                        <th>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Hace 5 min</td>
                                        <td><span className="admin-tag admin-tag--blue">Visita</span></td>
                                        <td>Usuario nuevo en Catálogo</td>
                                    </tr>
                                    <tr>
                                        <td>Hace 12 min</td>
                                        <td><span className="admin-tag admin-tag--green">Lead</span></td>
                                        <td>Nuevo lead para {metrics.mostVisitedProp}</td>
                                    </tr>
                                    <tr>
                                        <td>Hace 1 hora</td>
                                        <td><span className="admin-tag admin-tag--red">Sistema</span></td>
                                        <td>Asignación automática ejecutada</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )
            }



            {/* --- CONTENT: CONFIGURACIÓN --- */}
            {
                activeTab === 'config' && (
                    <div className="admin-section">
                        <h3 className="admin-section__title">Configuración del Sistema</h3>

                        <div className="admin-kpi-card" style={{ maxWidth: '400px', margin: '0' }}>
                            <div className="admin-kpi-card__title">Temática Estacional</div>
                            <div className="admin-kpi-card__sub" style={{ marginBottom: '10px' }}>
                                Estado actual de la temática (Controlado por Fecha y Configuración).
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div className={`admin-tag ${currentSeason ? 'admin-tag--green' : 'admin-tag--blue'}`} style={{ fontSize: '1rem', padding: '5px 15px' }}>
                                    {currentSeason ? `ACTIVO: ${currentSeason.name}` : 'NINGUNA'}
                                </div>

                                {/* 
                                NOTE: The toggle functionality has been moved to configuration-based logic 
                                (src/config/theme.config.js) to comply with architecture standards. 
                                To change seasons, update the config file or date ranges.
                            */}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EXTERNAL ADVISOR MODAL */}
            <ExternalAdvisorModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onAssign={handleAssignExternal}
            />

        </div >
    );
};

export default AdminDashboard;
