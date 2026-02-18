import React, { useState, useEffect } from 'react';
import { useService } from '../../hooks/useService';
import { useUser } from '../../context/UserContext';
import '../../styles/components/home/FeaturedDevelopers.css';

/**
 * @file FeaturedDevelopers.jsx
 * @description Carrusel de desarrolladores destacados filtrados por ciudad.
 */
export default function FeaturedDevelopers() {
    const { catalog } = useService();
    const { selectedCity } = useUser();

    const [developers, setDevelopers] = useState([]);

    useEffect(() => {
        const fetchDevs = async () => {
            try {
                const allDevs = await catalog.obtenerInventarioDesarrollos();

                // Filtrar por ciudad si existe una seleccionada
                let filtered = allDevs;
                if (selectedCity) {
                    filtered = allDevs.filter(d =>
                        d.ubicacion?.ciudad?.trim().toLowerCase() === selectedCity.trim().toLowerCase()
                    );
                }

                setDevelopers(filtered.slice(0, 8));
            } catch (error) {
                console.error("Error fetching developers:", error);
            }
        };

        fetchDevs();
    }, [catalog, selectedCity]);

    if (developers.length === 0) return null;

    return (
        <section className="featured-developers">
            <h2 className="featured-developers__title">
                {selectedCity ? `Desarrollos en ${selectedCity}` : 'Desarrollos Destacados'}
            </h2>
            <div className="featured-developers__grid">
                {developers.map((dev) => (
                    <div key={dev.id} className="featured-developers__item">
                        <div className="featured-developers__logo-box">
                            {dev.imagen ? (
                                <img src={dev.imagen} alt={dev.nombre} className="featured-developers__img" />
                            ) : (
                                <span className="featured-developers__placeholder">
                                    {dev.nombre?.charAt(0)}
                                </span>
                            )}
                        </div>
                        <span className="featured-developers__name">{dev.nombre}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
