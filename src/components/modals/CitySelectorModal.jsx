import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useService } from '../../hooks/useService';
import { useUser } from '../../context/UserContext';
import './CitySelectorModal.css';

/**
 * CitySelectorModal - Componente inicial para la selección de ubicación.
 * Utiliza una cuadrícula de botones para facilitar la interacción del usuario (Direct Selection UX).
 */
const CitySelectorModal = () => {
    const { selectedCity, updateSelectedCity } = useUser();
    const { catalog: catalogService } = useService();
    const [ciudades, setCiudades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * Carga las ciudades disponibles desde el servicio de catálogo.
         * Desacoplado mediante el patrón de Inyección de Dependencias.
         */
        const fetchCiudades = async () => {
            try {
                const lista = await catalogService.obtenerCiudadesDisponibles();
                setCiudades(lista);
            } catch (err) {
                console.error("❌ [CitySelector] Error cargando ciudades:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCiudades();
    }, [catalogService]);

    // Si el usuario ya tiene una ciudad seleccionada, no mostramos el selector
    if (selectedCity) return null;

    return (
        <div className="city-selector-modal">
            <div className="city-selector">
                <h2 className="city-selector__title">Bienvenid@</h2>
                <p className="city-selector__description">
                    selecciona tu ciudad
                </p>

                {loading ? (
                    <div className="city-selector__loading">
                        <div className="city-selector__spinner" />
                        <span>Cargando destinos...</span>
                    </div>
                ) : (
                    <div className="city-selector__grid">
                        {ciudades.map(ciudad => (
                            <button
                                key={ciudad}
                                className="city-selector__item"
                                onClick={() => updateSelectedCity(ciudad)}
                            >
                                <MapPin size={24} strokeWidth={2} />
                                <span>{ciudad}</span>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && ciudades.length === 0 && (
                    <p className="city-selector__error">
                        No pudimos encontrar ciudades disponibles en este momento. Por favor, intenta de nuevo más tarde.
                    </p>
                )}
            </div>
        </div>
    );
};


export default CitySelectorModal;
