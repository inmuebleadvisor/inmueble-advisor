import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import { getAllDesarrollos, getAllLeads, getAllUsers, toggleAdvisorInventory, updateAdvisorMetrics, hideIncompleteDevelopments, hideIncompleteModels, hidePricelessModels, hideEmptyDevelopments, enableAllDevelopments } from '../services/admin.service';

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

    // Estado local para edición de métricas manuales { [uid]: { puntosEncuestas: 30, ... } }
    const [editableMetrics, setEditableMetrics] = useState({});

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

                // Inicializar estado editable
                const initialEditable = {};
                usersData.filter(u => u.role === 'asesor').forEach(u => {
                    initialEditable[u.uid] = {
                        puntosEncuestas: u.metricas?.puntosEncuestas ?? 30,
                        puntosActualizacion: u.metricas?.puntosActualizacion ?? 20,
                        puntosComunicacion: u.metricas?.puntosComunicacion ?? 20
                    };
                });
                setEditableMetrics(initialEditable);

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

    // --- HANDLERS ---
    const handleToggleInventory = async (asesorId, idDesarrollo, currentStatus) => {
        // Optimistic UI Update locally first (optional) or loading state
        const asesorIndex = users.findIndex(u => u.uid === asesorId);
        if (asesorIndex === -1) return;

        const asesor = users[asesorIndex];
        const newStatus = !currentStatus;

        // Call Service
        const result = await toggleAdvisorInventory(asesorId, idDesarrollo, newStatus);

        if (result.success) {
            // Update State
            const updatedUsers = [...users];
            updatedUsers[asesorIndex] = { ...asesor, inventario: result.updatedInventory };
            setUsers(updatedUsers);
            // alert('Estado actualizado correctamente');
        } else {
            alert('Error actualizando el estado');
        }
    };

    const handleMetricChange = (uid, field, value) => {
        setEditableMetrics(prev => ({
            ...prev,
            [uid]: {
                ...prev[uid],
                [field]: Number(value)
            }
        }));
    };

    const handleSaveMetrics = async (asesor) => {
        const metricsToSave = editableMetrics[asesor.uid];
        if (!metricsToSave) return;

        // --- Optimistic UI Update ---
        // 1. Calcular nuevo Score localmente para feedback inmediato
        const tasaCierre = asesor.metricas?.tasaCierre || 0;
        const puntosCierre = Math.round(tasaCierre * 1.5);

        const ptosEncuestas = Number(metricsToSave.puntosEncuestas ?? 30);
        const ptosActualizacion = Number(metricsToSave.puntosActualizacion ?? 20);
        const ptosComunicacion = Number(metricsToSave.puntosComunicacion ?? 20);

        const newScoreGlobal = puntosCierre + ptosEncuestas + ptosActualizacion + ptosComunicacion;

        // 2. Actualizar estado local
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.uid === asesor.uid) {
                return {
                    ...u,
                    scoreGlobal: newScoreGlobal,
                    metricas: {
                        ...u.metricas,
                        puntosEncuestas: ptosEncuestas,
                        puntosActualizacion: ptosActualizacion,
                        puntosComunicacion: ptosComunicacion
                    }
                };
            }
            return u;
        }));

        const result = await updateAdvisorMetrics(asesor.uid, metricsToSave);
        if (result.success) {
            // alert(`Métricas actualizadas. Nuevo Score: ${newScoreGlobal}`);
        } else {
            alert("Error al actualizar métricas. Recarga la página.");
        }
    };

    // --- MAINTENANCE HANDLERS ---
    const handleHideDevsNoPhotos = async () => {
        if (!confirm("¿Ocultar desarrollos sin portada/galería?")) return;
        const res = await hideIncompleteDevelopments();
        if (res.success) alert(`Se ocultaron ${res.count} desarrollos.`);
        else alert("Error al ejecutar.");
    };

    const handleHideModelsNoPhotos = async () => {
        if (!confirm("¿Ocultar modelos sin imágenes?")) return;
        setLoading(true); // Visual feedback
        try {
            const resModels = await hideIncompleteModels();
            // Chain: Check for empty developments now
            const resDevs = await hideEmptyDevelopments();

            let msg = "";
            if (resModels.success) msg += `Se ocultaron ${resModels.count} modelos sin fotos. `;
            else msg += "Error ocultando modelos. ";

            if (resDevs.success && resDevs.count > 0) msg += `Además, se ocultaron ${resDevs.count} desarrollos que quedaron vacíos.`;

            alert(msg);
        } catch (e) {
            console.error(e);
            alert("Error ejecutando la limpieza.");
        } finally {
            setLoading(false);
        }
    };

    const handleHidePricelessModels = async () => {
        if (!confirm("¿Ocultar modelos sin precio?")) return;
        setLoading(true);
        try {
            const resModels = await hidePricelessModels();
            // Chain: Check for empty developments now
            const resDevs = await hideEmptyDevelopments();

            let msg = "";
            if (resModels.success) msg += `Se ocultaron ${resModels.count} modelos sin precio. `;
            else msg += "Error ocultando modelos. ";

            if (resDevs.success && resDevs.count > 0) msg += `Además, se ocultaron ${resDevs.count} desarrollos que quedaron vacíos.`;

            alert(msg);
        } catch (e) {
            console.error(e);
            alert("Error ejecutando la limpieza.");
        } finally {
            setLoading(false);
        }
    };

    const handleHideEmptyDevs = async () => {
        if (!confirm("¿Ocultar desarrollos sin modelos activos?")) return;
        setLoading(true);
        try {
            const res = await hideEmptyDevelopments();
            if (res.success) alert(`Se ocultaron ${res.count} desarrollos vacíos.`);
            else alert("Error al ejecutar.");
        } finally {
            setLoading(false);
        }
    };

    const handleShowAllDevs = async () => {
        if (!confirm("¿Estás seguro de reactivar TODOS los desarrollos? Esto hará visibles desarrollos sin fotos o vacíos.")) return;
        setLoading(true);
        try {
            const res = await enableAllDevelopments();
            if (res.success) alert(`Se reactivaron ${res.count} desarrollos previamente ocultos.`);
            else alert("Error al ejecutar.");
        } finally {
            setLoading(false);
        }
    };

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
                    General y Métricas
                </button>
                <button
                    className={`admin-dashboard__tab ${activeTab === 'asesores' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('asesores')}
                >
                    Gestión de Score y Asesores
                </button>
                <button
                    className={`admin-dashboard__tab ${activeTab === 'propiedades' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('propiedades')}
                >
                    Propiedades e Inventario
                </button>
                <button
                    className={`admin-dashboard__tab ${activeTab === 'mantenimiento' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('mantenimiento')}
                >
                    Mantenimiento
                </button>
            </div>

            {/* --- CONTENT: GENERAL --- */}
            {activeTab === 'general' && (
                <>
                    <div className="admin-kpi-grid">
                        <div className="admin-kpi-card">
                            <div className="admin-kpi-card__title">Total Usuarios</div>
                            <div className="admin-kpi-card__value">{metrics.totalUsers}</div>
                            <div className="admin-kpi-card__sub">
                                {metrics.totalClientes} Clientes | {metrics.totalAsesores} Asesores
                            </div>
                        </div>
                        <div className="admin-kpi-card">
                            <div className="admin-kpi-card__title">Total Leads</div>
                            <div className="admin-kpi-card__value">{metrics.totalLeads}</div>
                            <div className="admin-kpi-card__sub">{metrics.leadsActivos} Activos</div>
                        </div>
                        <div className="admin-kpi-card">
                            <div className="admin-kpi-card__title">Tasa de Cierre</div>
                            <div className="admin-kpi-card__value">
                                {metrics.totalLeads > 0 ? ((metrics.leadsGanados / metrics.totalLeads) * 100).toFixed(1) : 0}%
                            </div>
                            <div className="admin-kpi-card__sub">{metrics.leadsGanados} Ganados</div>
                        </div>
                        <div className="admin-kpi-card">
                            <div className="admin-kpi-card__title">Propiedad Top</div>
                            <div className="admin-kpi-card__value" style={{ fontSize: '1.2rem' }}>{metrics.mostVisitedProp}</div>
                            <div className="admin-kpi-card__sub">Más leads generados</div>
                        </div>
                        <div className="admin-kpi-card">
                            <div className="admin-kpi-card__title">Tiempo Promedio</div>
                            <div className="admin-kpi-card__value">{metrics.avgSession}</div>
                            <div className="admin-kpi-card__sub">Por visita (Est.)</div>
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
            )}

            {/* --- CONTENT: ASESORES --- */}
            {activeTab === 'asesores' && (
                <div className="admin-section">
                    <h3 className="admin-section__title">Listado de Asesores y Score Card Manual</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                        Ajusta los puntos manuales. El Score Global se recalculará automáticamente: (Tasa Cierre × 1.5) + Encuestas + Actualización + Comunicación.
                    </p>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Asesor</th>
                                    <th>Score Global</th>
                                    <th style={{ textAlign: 'center' }} title="Max 30 pts">Encuestas<br /><small>(0-30)</small></th>
                                    <th style={{ textAlign: 'center' }} title="Max 20 pts">Actualización<br /><small>(0-20)</small></th>
                                    <th style={{ textAlign: 'center' }} title="Max 20 pts">Comunicación<br /><small>(0-20)</small></th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => u.role === 'asesor').map(asesor => {
                                    const editData = editableMetrics[asesor.uid] || {};
                                    return (
                                        <tr key={asesor.uid}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{asesor.nombre}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{asesor.email}</div>
                                                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                                    Tasa Cierre: {asesor.metricas?.tasaCierre || 0}%
                                                    <span style={{ color: '#aaa' }}> (approx {Math.round((asesor.metricas?.tasaCierre || 0) * 1.5)} pts)</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{
                                                    fontSize: '1.2rem',
                                                    fontWeight: 'bold',
                                                    color: (asesor.scoreGlobal >= 90 ? '#eab308' : (asesor.scoreGlobal >= 80 ? '#22c55e' : '#3b82f6'))
                                                }}>
                                                    {asesor.scoreGlobal || 0}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    min="0" max="30"
                                                    value={editData.puntosEncuestas ?? 30}
                                                    onChange={(e) => handleMetricChange(asesor.uid, 'puntosEncuestas', e.target.value)}
                                                    style={{ width: '60px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    min="0" max="20"
                                                    value={editData.puntosActualizacion ?? 20}
                                                    onChange={(e) => handleMetricChange(asesor.uid, 'puntosActualizacion', e.target.value)}
                                                    style={{ width: '60px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    min="0" max="20"
                                                    value={editData.puntosComunicacion ?? 20}
                                                    onChange={(e) => handleMetricChange(asesor.uid, 'puntosComunicacion', e.target.value)}
                                                    style={{ width: '60px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center' }}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleSaveMetrics(asesor)}
                                                    className="admin-btn-save"
                                                    style={{
                                                        backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    Guardar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- CONTENT: PROPIEDADES (INVENTORY CONTROL) --- */}
            {activeTab === 'propiedades' && (
                <>
                    <div className="admin-section">
                        <h3 className="admin-section__title">Control de Propiedades Solicitadas</h3>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            Aquí puedes activar o desactivar los desarrollos que cada asesor ha solicitado vender.
                        </p>

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Asesor</th>
                                        <th>Desarrollo Solicitado</th>
                                        <th>Tipo Solicitud</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.role === 'asesor').map(asesor => (
                                        (asesor.inventario || []).map((item, index) => {
                                            // Find real name from catalog
                                            const devInfo = desarrollos.find(d => String(d.id) === String(item.idDesarrollo));
                                            const devName = devInfo ? devInfo.nombre : (item.nombreManual || 'Desconocido');

                                            return (
                                                <tr key={`${asesor.uid}-${index}`}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{asesor.nombre}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{asesor.email}</div>
                                                    </td>
                                                    <td>{devName}</td>
                                                    <td>
                                                        <span className={`admin-tag ${item.tipo === 'db' ? 'admin-tag--blue' : 'admin-tag--red'}`}>
                                                            {item.tipo === 'db' ? 'Catálogo' : 'Manual'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {item.activo ? (
                                                            <span style={{ color: '#28a745', fontWeight: 600 }}>ACTIVO</span>
                                                        ) : (
                                                            <span style={{ color: '#dc3545', fontWeight: 600 }}>INACTIVO</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!item.activo}
                                                                onChange={() => handleToggleInventory(asesor.uid, item.idDesarrollo, item.activo)}
                                                            />
                                                            <span className="slider"></span>
                                                        </label>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}


            {/* --- CONTENT: MANTENIMIENTO --- */}
            {activeTab === 'mantenimiento' && (
                <div className="admin-section">
                    <h3 className="admin-section__title">Mantenimiento de Contenido</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Herramientas para ocultar automáticamente contenido incompleto del catálogo público.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

                        <div className="admin-kpi-card" style={{ alignItems: 'flex-start' }}>
                            <div className="admin-kpi-card__title">Desarrollos sin Fotos</div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                                Oculta desarrollos que no tienen imagen de portada ni galería.
                            </p>
                            <button
                                onClick={handleHideDevsNoPhotos}
                                className="admin-btn-save"
                                style={{ background: '#ef4444', marginTop: 'auto' }}
                            >
                                Ejecutar Limpieza
                            </button>
                        </div>

                        <div className="admin-kpi-card" style={{ alignItems: 'flex-start' }}>
                            <div className="admin-kpi-card__title">Modelos sin Fotos</div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                                Oculta modelos que no tienen imagen, render ni planos.
                            </p>
                            <button
                                onClick={handleHideModelsNoPhotos}
                                className="admin-btn-save"
                                style={{ background: '#f59e0b', marginTop: 'auto' }}
                            >
                                Ejecutar Limpieza
                            </button>
                        </div>

                        <div className="admin-kpi-card" style={{ alignItems: 'flex-start' }}>
                            <div className="admin-kpi-card__title">Modelos sin Precio</div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                                Oculta modelos con precio 0 o no definido.
                            </p>
                            <button
                                onClick={handleHidePricelessModels}
                                className="admin-btn-save"
                                style={{ background: '#3b82f6', marginTop: 'auto' }}
                            >
                                Ejecutar Limpieza
                            </button>
                        </div>


                        <div className="admin-kpi-card" style={{ alignItems: 'flex-start' }}>
                            <div className="admin-kpi-card__title">Desarrollos Vacíos</div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                                Oculta desarrollos que no tienen ningún modelo activo visible.
                            </p>
                            <button
                                onClick={handleHideEmptyDevs}
                                className="admin-btn-save"
                                style={{ background: '#6366f1', marginTop: 'auto' }}
                            >
                                Ejecutar Limpieza
                            </button>
                        </div>

                        <div className="admin-kpi-card" style={{ alignItems: 'flex-start' }}>
                            <div className="admin-kpi-card__title">Mostrar Todo</div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                                Reactiva todos los desarrollos (útil para resetear y depurar).
                            </p>
                            <button
                                onClick={handleShowAllDevs}
                                className="admin-btn-save"
                                style={{ background: '#22c55e', marginTop: 'auto' }}
                            >
                                Reactivar Todo
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
