
import React, { useState, useEffect } from 'react';
import { useServiceContext } from '../../context/ServiceContext';
import Modal from '../../components/shared/Modal';

export default function AdvisorsDirectory() {
    const { externalAdvisor } = useServiceContext();
    const [directory, setDirectory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDev, setSelectedDev] = useState(null); // { id, nombre }
    const [formData, setFormData] = useState({
        nombre: '',
        whatsapp: '',
        email: '',
        puesto: 'Asesor Comercial'
    });
    const [submitting, setSubmitting] = useState(false);
    const [expandedDevs, setExpandedDevs] = useState({}); // { [id]: boolean }

    useEffect(() => {
        loadDirectory();
    }, []);

    const loadDirectory = async () => {
        setLoading(true);
        try {
            const data = await externalAdvisor.getDirectory();
            setDirectory(data);
        } catch (error) {
            console.error("Error loading directory:", error);
            // In a real app, show error toast
        } finally {
            setLoading(false);
        }
    };

    const toggleDev = (id) => {
        setExpandedDevs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleOpenModal = (dev) => {
        setSelectedDev(dev);
        setFormData({
            nombre: '',
            whatsapp: '',
            email: '',
            puesto: 'Asesor Comercial'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDev) return;
        setSubmitting(true);
        try {
            await externalAdvisor.registerAdvisor({
                idDesarrollador: selectedDev.id,
                ...formData
            });
            setIsModalOpen(false);
            alert("Asesor registrado con éxito"); // Simple feedback as requested/implied
            loadDirectory(); // Refresh list
        } catch (error) {
            console.error("Error registering advisor:", error);
            alert("Error al registrar asesor: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Directorio de Asesores Externos</h1>
                <p style={styles.subtitle}>Gestiona la red de ventas por desarrollador</p>
            </header>

            {loading ? (
                <div style={styles.loading}>Cargando directorio...</div>
            ) : (
                <div style={styles.listContainer}>
                    {directory.map(dev => (
                        <div key={dev.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div
                                    style={styles.devInfo}
                                    onClick={() => toggleDev(dev.id)}
                                >
                                    <h3 style={styles.devName}>{dev.nombre}</h3>
                                    <span style={styles.countBadge}>
                                        {dev.advisors?.length || 0} asesores
                                    </span>
                                </div>
                                <button
                                    style={styles.primaryBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(dev);
                                    }}
                                >
                                    + Registrar Asesor
                                </button>
                            </div>

                            {expandedDevs[dev.id] && (
                                <div style={styles.advisorsList}>
                                    {dev.advisors && dev.advisors.length > 0 ? (
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.th}>Nombre</th>
                                                    <th style={styles.th}>WhatsApp</th>
                                                    <th style={styles.th}>Puesto</th>
                                                    <th style={styles.th}>Leads</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dev.advisors.map(adv => (
                                                    <tr key={adv.id} style={styles.tr}>
                                                        <td style={styles.td}>{adv.nombre}</td>
                                                        <td style={styles.td}>{adv.whatsapp}</td>
                                                        <td style={styles.td}>{adv.puesto}</td>
                                                        <td style={styles.td}>{adv.leadsAsignadosAcumulados || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div style={styles.emptyState}>
                                            No hay asesores registrados para este desarrollador.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Registrar Asesor para ${selectedDev?.nombre || ''}`}
            >
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nombre Completo *</label>
                        <input
                            style={styles.input}
                            required
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>WhatsApp * (Solo números)</label>
                        <input
                            style={styles.input}
                            required
                            pattern="\d+"
                            value={formData.whatsapp}
                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="Ej. 5216671234567"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Correo Electrónico</label>
                        <input
                            style={styles.input}
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="opcional@email.com"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Puesto</label>
                        <input
                            style={styles.input}
                            value={formData.puesto}
                            onChange={e => setFormData({ ...formData, puesto: e.target.value })}
                        />
                    </div>

                    <div style={styles.formActions}>
                        <button
                            type="button"
                            style={styles.secondaryBtn}
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={styles.submitBtn}
                            disabled={submitting}
                        >
                            {submitting ? 'Registrando...' : 'Guardar Asesor'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        color: 'var(--text-main, #1e293b)'
    },
    header: {
        marginBottom: '2rem'
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: '700',
        marginBottom: '0.5rem'
    },
    subtitle: {
        color: 'var(--text-secondary, #64748b)'
    },
    loading: {
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-secondary)'
    },
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    card: {
        backgroundColor: 'var(--bg-secondary, white)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        overflow: 'hidden'
    },
    cardHeader: {
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        backgroundColor: 'var(--bg-secondary, white)'
    },
    devInfo: {
        flex: 1
    },
    devName: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: '600'
    },
    countBadge: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginTop: '0.25rem',
        display: 'block'
    },
    primaryBtn: {
        backgroundColor: 'var(--primary-color, #dcb23a)',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    },
    advisorsList: {
        borderTop: '1px solid var(--border-subtle, #e2e8f0)',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-main, #f8fafc)' // Slightly contrasted
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.95rem'
    },
    th: {
        textAlign: 'left',
        padding: '0.75rem',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        fontWeight: '600'
    },
    tr: {
        borderBottom: '1px solid var(--border-subtle)'
    },
    td: {
        padding: '0.75rem',
        color: 'var(--text-main)'
    },
    emptyState: {
        textAlign: 'center',
        padding: '1rem',
        color: 'var(--text-secondary)',
        fontStyle: 'italic'
    },
    form: {
        padding: '1rem 0'
    },
    formGroup: {
        marginBottom: '1rem'
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: 'var(--text-main)'
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle, #cbd5e1)',
        fontSize: '1rem'
    },
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '2rem'
    },
    secondaryBtn: {
        padding: '0.75rem 1.5rem',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600'
    },
    submitBtn: {
        padding: '0.75rem 1.5rem',
        backgroundColor: 'var(--primary-color, #dcb23a)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600'
    }
};
