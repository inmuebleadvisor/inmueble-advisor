import React from 'react';
import HeroSection from '../../components/home/HeroSection';
import AffordabilityWidget from '../../components/home/AffordabilityWidget';
import FeaturedDevelopers from '../../components/home/FeaturedDevelopers';
import NewLaunches from '../../components/home/NewLaunches';
import '../../styles/screens/Home.css';

/**
 * @file Home.jsx
 * @description Composición principal de la Home Page.
 * Centraliza el diseño del Hero para asegurar sincronía entre imagen, texto y widget.
 */
export default function Home() {
    return (
        <div className="home-screen">
            {/* 1. SECCIÓN HERO (CONTENEDOR MAESTRO) */}
            <header className="home-hero">
                <div className="home-hero__overlay"></div>

                <div className="home-hero__container">
                    {/* Contenido Editorial (Izquierda en Desktop) */}
                    <div className="home-hero__content-column">
                        <HeroSection />
                    </div>

                    {/* Widget Financiero (Derecha en Desktop) */}
                    <div className="home-hero__widget-column">
                        <AffordabilityWidget />
                    </div>
                </div>
            </header>

            {/* 2. CONTENIDO PRINCIPAL */}
            <main className="home-main">
                <FeaturedDevelopers />
                <NewLaunches />
            </main>
        </div>
    );
}
