import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import { getAllDesarrollos, getAllLeads, getAllUsers, toggleAdvisorInventory, updateAdvisorMetrics } from '../services/admin.service';
import { importData, parseCSV } from '../services/massImport.service';
import { useTheme } from '../context/ThemeContext';

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

    // Estado local para edición de métricas manuales { [uid]: { puntosEncuestas: 30, ... } }
    const [editableMetrics, setEditableMetrics] = useState({});

    // Debug Logs State
    const [debugLogs, setDebugLogs] = useState([]);



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



    // --- MASS IMPORT HANDLERS ---
    const handleImportFile = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm(`¿Estás seguro de importar ${type} desde ${file.name}? Esto podría sobrescribir datos existentes.`)) {
            e.target.value = null; // Reset input
            return;
        }

        setLoading(true);
        try {
            const data = await parseCSV(file);
            // alert(`Archivo parseado. ${data.length} filas encontradas. Iniciando carga...`);

            const result = await importData(type, data);

            if (result.success) {
                alert(`Importación ÉXITOSA.\nProcesados: ${result.procesados}\nMensaje: ${result.mensaje}`);
                // Recargar datos para ver cambios
                window.location.reload();
            } else {
                alert(`Error en importación: ${result.error}`);
            }

        } catch (error) {
            console.error(error);
            alert(`Error crítico: ${error.message}`);
        } finally {
            setLoading(false);
            e.target.value = null;
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
                    className={`admin-dashboard__tab ${activeTab === 'config' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    Configuración
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
                                {users.filter(u => u.role === 'asesor' || u.role === 'admin').map(asesor => {
                                    const editData = editableMetrics[asesor.uid] || {};
                                    return (
                                        <tr key={asesor.uid}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{asesor.nombre} {asesor.role === 'admin' && <span style={{ fontSize: '0.7em', background: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>ADMIN</span>}</div>
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
                                    {users.filter(u => u.role === 'asesor' || u.role === 'admin').map(asesor => (
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


            {/* --- CONTENT: CONFIGURACIÓN --- */}
            {activeTab === 'config' && (
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
            )}

        </div >
    );
};

export default AdminDashboard;
