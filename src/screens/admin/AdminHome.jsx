import React from 'react';
import { Layout, ExternalLink, BarChart2 } from 'lucide-react';
import '../../styles/screens/AdminHome.css';

/**
 * AdminHome - Looker Studio Integration
 * 
 * Se ha eliminado el dashboard interno en favor de Looker Studio
 * para mayor robustez y flexibilidad analítica.
 */
const AdminHome = () => {
    return (
        <div className="admin-home">
            <header className="admin-home__header">
                <div className="admin-home__title-wrapper">
                    <BarChart2 className="admin-home__title-icon" />
                    <h1 className="admin-home__title">
                        Análisis y Business Intelligence
                    </h1>
                </div>
                <p className="admin-home__subtitle">
                    Bienvenido al centro de analíticas de Inmueble Advisor. Hemos migrado nuestras estadísticas
                    a <strong>Looker Studio</strong> para ofrecerte reportes más precisos, interactivos y en tiempo real.
                </p>
            </header>

            <section className="admin-home__looker-container">
                <div className="admin-home__iframe-wrapper">
                    <div className="admin-home__icon-wrapper">
                        <Layout className="admin-home__icon" />
                    </div>
                    <h2 className="admin-home__wrapper-title">
                        Looker Studio Dashboard
                    </h2>
                    <p className="admin-home__wrapper-subtitle">
                        Para visualizar el reporte completo, pega el enlace de inserción (iframe) en el código
                        o utiliza el acceso directo a la consola de Looker.
                    </p>

                    <div className="admin-home__actions">
                        <a
                            href="https://lookerstudio.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-home__btn"
                        >
                            Ir a Looker Studio
                            <ExternalLink size={18} />
                        </a>
                    </div>
                </div>

                {/* 
                   💡 TIP PARA EL USUARIO:
                   Cuando tengas tu reporte de Looker Studio, reemplaza el div ".admin-home__iframe-wrapper" de arriba por:
                   <iframe 
                      width="100%" 
                      height="600" 
                      src="TU_URL_DE_LOOKER_STUDIO" 
                      frameBorder="0" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                   />
                */}
            </section>
        </div>
    );
};

export default AdminHome;
