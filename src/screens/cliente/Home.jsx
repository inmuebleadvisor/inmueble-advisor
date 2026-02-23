import React from 'react';
import HeroSection from '../../components/home/HeroSection';
import AffordabilityWidget from '../../components/home/AffordabilityWidget';
import FeaturedDevelopers from '../../components/home/FeaturedDevelopers';
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
                <div className="home-hero__container">
                    <HeroSection />
                </div>
            </header>

            {/* 2. CONTENIDO PRINCIPAL */}
            <main className="home-main">
                <section className="home-calculator">
                    <AffordabilityWidget />
                </section>
                <FeaturedDevelopers />
            </main>
        </div>
    );
}
