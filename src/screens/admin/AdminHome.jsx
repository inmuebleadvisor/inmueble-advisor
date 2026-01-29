import React from 'react';
import { Layout, ExternalLink, BarChart2 } from 'lucide-react';

/**
 * AdminHome - Looker Studio Integration
 * 
 * Se ha eliminado el dashboard interno en favor de Looker Studio
 * para mayor robustez y flexibilidad analítica.
 */
const AdminHome = () => {
    return (
        <div className="admin-home admin-home--clean">
            <header className="admin-home__header">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart2 className="text-gold-500 w-8 h-8" />
                    <h1 className="admin-home__title text-2xl font-bold text-slate-800">
                        Análisis y Business Intelligence
                    </h1>
                </div>
                <p className="text-slate-500 max-w-2xl">
                    Bienvenido al centro de analíticas de Inmueble Advisor. Hemos migrado nuestras estadísticas
                    a <strong>Looker Studio</strong> para ofrecerte reportes más precisos, interactivos y en tiempo real.
                </p>
            </header>

            <section className="admin-home__looker-container mt-8">
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-slate-50 p-6 rounded-full mb-6">
                        <Layout className="w-12 h-12 text-slate-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">
                        Looker Studio Dashboard
                    </h2>
                    <p className="text-slate-500 mb-8 max-w-sm">
                        Para visualizar el reporte completo, pega el enlace de inserción (iframe) en el código
                        o utiliza el acceso directo a la consola de Looker.
                    </p>

                    <div className="flex gap-4">
                        <a
                            href="https://lookerstudio.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            Ir a Looker Studio
                            <ExternalLink size={18} />
                        </a>
                    </div>
                </div>

                {/* 
                   💡 TIP PARA EL USUARIO:
                   Cuando tengas tu reporte de Looker Studio, reemplaza el div de arriba por:
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
