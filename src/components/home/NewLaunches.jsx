import React, { useEffect, useState } from 'react';
import { useService } from '../../hooks/useService';
import PropertyCard from '../catalogo/PropertyCard';
import { Link } from 'react-router-dom';
import '../../styles/components/home/NewLaunches.css';

/**
 * @file NewLaunches.jsx
 * @description Grid de propiedades recientes o destacadas.
 * @responsibility Mostrar inventario atractivo para generar clics.
 */
export default function NewLaunches() {
    const { catalog } = useService();
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        const fetchProps = async () => {
            // Obtenemos modelos unificados
            const allModels = await catalog.obtenerDatosUnificados();

            // Lógica simple de "Highlights":
            // 1. Priorizar los que tienen 'highlights' (banderita en datos)
            // 2. O los más recientes (si tuvieramos fecha, por ahora random slice o first 4)

            const highlighted = allModels.filter(m => m.highlights && m.highlights.length > 0);
            const others = allModels.filter(m => !m.highlights || m.highlights.length === 0);

            // Combinar: Highlights primero, luego el resto, cortar a 4
            const displaySet = [...highlighted, ...others].slice(0, 4);

            setProperties(displaySet);
        };

        fetchProps();
    }, [catalog]);

    if (properties.length === 0) return null;

    return (
        <section className="new-launches">
            <div className="new-launches__header">
                <h2 className="new-launches__title">Nuevos Lanzamientos</h2>
                <Link to="/catalogo" className="new-launches__link">Ver Todo</Link>
            </div>

            <div className="new-launches__grid">
                {properties.map(item => (
                    <PropertyCard
                        key={item.id}
                        item={item}
                        style={{ margin: 0 }} // Override card margin if needed
                    />
                ))}
            </div>
        </section>
    );
}
