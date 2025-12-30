import React, { useState, useEffect } from 'react';
import { getAllExternalAdvisors } from '../../services/externalAdvisor.service';

const ExternalAdvisorModal = ({ isOpen, onClose, onAssign }) => {
    const [advisors, setAdvisors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdvisor, setSelectedAdvisor] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Formulario Nuevo Asesor
    const [newAdvisor, setNewAdvisor] = useState({ nombre: '', telefono: '' });

    useEffect(() => {
        if (isOpen) {
            loadAdvisors();
        }
    }, [isOpen]);

    const loadAdvisors = async () => {
        const data = await getAllExternalAdvisors();
        setAdvisors(data);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setSelectedAdvisor(null);
    };

    const filteredAdvisors = advisors.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.telefono.includes(searchTerm)
    );

    const handleSelect = (advisor) => {
        setSelectedAdvisor(advisor);
        setSearchTerm(advisor.nombre);
        setIsCreating(false);
    };

    const handleSubmit = () => {
        if (isCreating) {
            if (!newAdvisor.nombre || !newAdvisor.telefono) return alert("Nombre y Teléfono son obligatorios");
            onAssign(newAdvisor);
        } else {
            if (!selectedAdvisor) return alert("Selecciona un asesor o crea uno nuevo");
            onAssign(selectedAdvisor);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h3>Asignar Asesor Externo</h3>

                {!isCreating ? (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Buscar Asesor Existente:</label>
                            <input
                                type="text"
                                placeholder="Nombre o Teléfono..."
                                value={searchTerm}
                                onChange={handleSearch}
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                            {searchTerm && !selectedAdvisor && (
                                <ul style={{ listStyle: 'none', padding: 0, border: '1px solid #ddd', maxHeight: '100px', overflowY: 'auto' }}>
                                    {filteredAdvisors.map(adv => (
                                        <li
                                            key={adv.id}
                                            onClick={() => handleSelect(adv)}
                                            style={{ padding: '5px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                        >
                                            {adv.nombre} ({adv.telefono})
                                        </li>
                                    ))}
                                    {filteredAdvisors.length === 0 && (
                                        <li style={{ padding: '5px', color: '#888' }}>No encontrado</li>
                                    )}
                                </ul>
                            )}
                        </div>
                        <div style={{ textAlign: 'center', margin: '10px 0' }}>- O -</div>
                        <button
                            className="btn-secondary"
                            onClick={() => { setIsCreating(true); setSelectedAdvisor(null); }}
                            style={{ width: '100%' }}
                        >
                            Crear Nuevo Asesor
                        </button>
                    </>
                ) : (
                    <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                        <h4>Nuevo Asesor</h4>
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            value={newAdvisor.nombre}
                            onChange={e => setNewAdvisor({ ...newAdvisor, nombre: e.target.value })}
                            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                        <input
                            type="text"
                            placeholder="Teléfono (WhatsApp)"
                            value={newAdvisor.telefono}
                            onChange={e => setNewAdvisor({ ...newAdvisor, telefono: e.target.value })}
                            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                        <button onClick={() => setIsCreating(false)} style={{ fontSize: '0.8rem', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}>Cancelar creación</button>
                    </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={!selectedAdvisor && !isCreating}>Confirmar Asignación</button>
                </div>
            </div>

            <style>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justifyContent: center; z-index: 1000; }
                .modal-content { background: white; padding: 20px; borderRadius: 8px; width: 90%; }
                .btn-primary { background: #0f172a; color: white; padding: 8px 16px; border: none; borderRadius: 4px; cursor: pointer; }
                .btn-secondary { background: #e2e8f0; color: #333; padding: 8px 16px; border: none; borderRadius: 4px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default ExternalAdvisorModal;
