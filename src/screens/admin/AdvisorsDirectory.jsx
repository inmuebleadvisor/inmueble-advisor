
import React, { useState, useEffect } from 'react';
import { useServiceContext } from '../../context/ServiceContext';
import Modal from '../../components/modals/Modal';

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
        <div className="advisors-directory">
            <header className="advisors-directory__header">
                <h1 className="advisors-directory__title">Directorio de Asesores Externos</h1>
                <p className="advisors-directory__subtitle">Gestiona la red de ventas por desarrollador</p>
            </header>

            {loading ? (
                <div className="admin-loading">Cargando directorio...</div>
            ) : (
                <div className="advisors-directory__list">
                    {directory.map(dev => (
                        <div key={dev.id} className="advisors-directory__card">
                            <div className="advisors-directory__card-header">
                                <div
                                    className="advisors-directory__dev-info"
                                    onClick={() => toggleDev(dev.id)}
                                >
                                    <h3 className="advisors-directory__dev-name">{dev.nombre}</h3>
                                    <span className="advisors-directory__count-badge">
                                        {dev.advisors?.length || 0} asesores
                                    </span>
                                </div>
                                <button
                                    className="advisors-directory__btn-register"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(dev);
                                    }}
                                >
                                    + Registrar Asesor
                                </button>
                            </div>

                            {expandedDevs[dev.id] && (
                                <div className="advisors-directory__details">
                                    {dev.advisors && dev.advisors.length > 0 ? (
                                        <div className="advisors-directory__table-wrapper">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>WhatsApp</th>
                                                        <th>Puesto</th>
                                                        <th>Leads</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dev.advisors.map(adv => (
                                                        <tr key={adv.id}>
                                                            <td>{adv.nombre}</td>
                                                            <td>{adv.whatsapp}</td>
                                                            <td>{adv.puesto}</td>
                                                            <td>{adv.leadsAsignadosAcumulados || 0}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="advisors-directory__empty-state">
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
                <form onSubmit={handleSubmit} className="advisors-form">
                    <div className="advisors-form__group">
                        <label className="advisors-form__label">Nombre Completo *</label>
                        <input
                            className="advisors-form__input"
                            required
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div className="advisors-form__group">
                        <label className="advisors-form__label">WhatsApp * (Solo números)</label>
                        <input
                            className="advisors-form__input"
                            required
                            pattern="\d+"
                            value={formData.whatsapp}
                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="Ej. 5216671234567"
                        />
                    </div>

                    <div className="advisors-form__group">
                        <label className="advisors-form__label">Correo Electrónico</label>
                        <input
                            className="advisors-form__input"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="opcional@email.com"
                        />
                    </div>

                    <div className="advisors-form__group">
                        <label className="advisors-form__label">Puesto</label>
                        <input
                            className="advisors-form__input"
                            value={formData.puesto}
                            onChange={e => setFormData({ ...formData, puesto: e.target.value })}
                        />
                    </div>

                    <div className="advisors-form__actions">
                        <button
                            type="button"
                            className="advisors-form__btn-cancel"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="advisors-form__btn-submit"
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
