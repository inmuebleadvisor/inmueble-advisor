import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialService } from '../../services/financial.service';
import { useCatalog } from '../../context/CatalogContext';
import { useUser } from '../../context/UserContext';
import { useService } from '../../hooks/useService';
import { CatalogService } from '../../services/catalog.service';
import '../../styles/components/home/AffordabilityWidget.css';

/**
 * @file AffordabilityWidget.jsx
 * @description Widget financiero para la Home.
 * @responsibility Calcular presupuesto máximo basado en ingresos y enganche, y mostrar coincidencias.
 */
export default function AffordabilityWidget() {
    const navigate = useNavigate();
    const { modelos, desarrollos } = useCatalog();
    const { user } = useUser();
    const { client } = useService();

    // Form State
    const [ingreso, setIngreso] = useState('');
    const [enganche, setEnganche] = useState('');
    const [resultado, setResultado] = useState(null);

    const financialService = new FinancialService();

    const calcular = async (e) => {
        e.preventDefault();
        const capMensual = parseFloat(ingreso) || 0;
        const capitalInicial = parseFloat(enganche) || 0;

        // Lógica de negocio (Servicio Financiero)
        const { maxBudget, dynamicNote, isAlert } = financialService.calculateAffordability(capitalInicial, capMensual);

        const calculationResult = { maxBudget, dynamicNote, isAlert };
        setResultado(calculationResult);

        // PERSISTENCIA: Si el usuario está logueado, guardamos en su perfil
        if (user?.uid) {
            try {
                await client.completeOnboarding(user.uid, {
                    ...calculationResult,
                    ingresoMensual: capMensual,
                    engancheDisponible: capitalInicial,
                    fechaCalculo: new Date().toISOString()
                });
            } catch (error) {
                console.error("Error persistiendo cálculo en perfil:", error);
            }
        }
    };

    // --- LÓGICA DE COINCIDENCIAS (Restored from Onboarding) ---
    const matchingCount = useMemo(() => {
        if (!resultado?.maxBudget || !modelos || !desarrollos) return 0;

        // Filtros equivalentes a "Lo que me alcanza"
        const filters = {
            precioMin: 0,
            precioMax: resultado.maxBudget,
            status: 'all',
            tipo: 'all',
            habitaciones: 0,
            amenidad: '',
            showNoPrice: false
        };

        // Usamos el servicio estático para filtrar (mismo motor que el catálogo)
        return CatalogService.filterCatalog(modelos, desarrollos, filters, '').length;
    }, [resultado, modelos, desarrollos]);

    const handleVerPropiedades = () => {
        if (!resultado) return;

        // Navegamos al catálogo pasando el estado inicial de filtros
        // El catálogo debe ser capaz de leer `location.state` o query params.
        // Por consistencia con el plan, usaremos state, pero idealmente query params para compartir URL.
        // Vamos a usar state por ahora como se definió en el plan rápido.
        navigate('/catalogo', {
            state: {
                precioMax: resultado.maxBudget,
                // Podríamos pasar más filtros si el widget tuviera inputs de recámaras, etc.
            }
        });
    };

    const formatoMoneda = (val) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="affordability-widget">
            <h3 className="affordability-widget__title">Calculadora</h3>
            <p className="affordability-widget__desc">Descubre tu poder de compra</p>

            <form onSubmit={calcular} className="affordability-widget__form">
                <div className="affordability-widget__field">
                    <label className="affordability-widget__label">¿Cuánto puedes pagar al mes?</label>
                    <input
                        className="affordability-widget__input"
                        type="number"
                        placeholder="$20,000"
                        value={ingreso}
                        onChange={(e) => setIngreso(e.target.value)}
                        required
                    />
                </div>

                <div className="affordability-widget__field">
                    <label className="affordability-widget__label">¿Cuánto enganche tienes?</label>
                    <input
                        className="affordability-widget__input"
                        type="number"
                        placeholder="$100,000"
                        value={enganche}
                        onChange={(e) => setEnganche(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="affordability-widget__btn">
                    Calcular Presupuesto
                </button>
            </form>

            {resultado && (
                <div className={`affordability-widget__result ${resultado.isAlert ? 'affordability-widget__result--alert' : ''}`}>
                    <span className="affordability-widget__result-label">Monto Máximo de Propiedad:</span>
                    <span className="affordability-widget__result-value">{formatoMoneda(resultado.maxBudget)}</span>
                    <p className="affordability-widget__result-note">{resultado.dynamicNote}</p>

                    {/* --- SECCIÓN DE RESULTADOS (Restored) --- */}
                    <div className="affordability-widget__matches">
                        <p className="affordability-widget__matches-text">
                            {matchingCount > 0
                                ? `Encontramos ${matchingCount} propiedades para ti`
                                : "El mercado está limitado para este presupuesto"}
                        </p>

                        {matchingCount > 0 && (
                            <button
                                onClick={handleVerPropiedades}
                                className="affordability-widget__matches-btn"
                            >
                                Ver Propiedades
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
