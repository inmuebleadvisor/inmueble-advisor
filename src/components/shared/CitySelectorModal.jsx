import React, { useState, useEffect } from 'react';
import { obtenerCiudadesDisponibles } from '../../services/catalog.service';
import { useUser } from '../../context/UserContext';
import './CitySelectorModal.css'; // Asumimos estilos básicos o reutilizamos modal existente

const CitySelectorModal = () => {
    const { selectedCity, updateSelectedCity } = useUser();
    const [ciudades, setCiudades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tempSelection, setTempSelection] = useState(null);

    // Si ya hay ciudad, no mostramos el modal (o verificamos si queremos forzar confirmación)
    // Este componente se renderizará condicionalmente en App.jsx si !selectedCity

    useEffect(() => {
        const fetchCiudades = async () => {
            try {
                const lista = await obtenerCiudadesDisponibles();
                setCiudades(lista);
                if (lista.length > 0) {
                    setTempSelection(lista[0]); // Default first
                }
            } catch (err) {
                console.error("Error cargando ciudades", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCiudades();
    }, []);

    const handleConfirm = () => {
        if (tempSelection) {
            updateSelectedCity(tempSelection);
            // El modal se desmontará porque App.jsx dejará de renderizarlo
        }
    };

    if (selectedCity) return null; // Safety check

    return (
        <div className="city-modal-overlay">
            <div className="city-modal-content">
                <h2>Bienvenido a Inmueble Advisor</h2>
                <p>Por favor, selecciona tu ciudad de interés para mostrarte las mejores opciones.</p>

                {loading ? (
                    <p>Cargando ciudades...</p>
                ) : (
                    <div className="city-selector-container">
                        <select
                            value={tempSelection || ''}
                            onChange={(e) => setTempSelection(e.target.value)}
                            className="city-dropdown"
                        >
                            <option value="" disabled>Selecciona una ciudad</option>
                            {ciudades.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    className="btn-primary-modal"
                    onClick={handleConfirm}
                    disabled={!tempSelection || loading}
                >
                    Comenzar
                </button>

                {/* Fallback por si la lista está vacía (Error layout) */}
                {!loading && ciudades.length === 0 && (
                    <p className="error-text">No se encontraron ciudades disponibles. Intenta recargar.</p>
                )}
            </div>
        </div>
    );
};

export default CitySelectorModal;
