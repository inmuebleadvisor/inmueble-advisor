import React from 'react';
import HeroSection from '../../components/home/HeroSection';
import AffordabilityWidget from '../../components/home/AffordabilityWidget';
import FeaturedDevelopers from '../../components/home/FeaturedDevelopers';
import SEOHead from '../../components/common/SEOHead';
import '../../styles/screens/Home.css';

/**
 * @file Home.jsx
 * @description Composición principal de la Home Page.
 * Centraliza el diseño del Hero para asegurar sincronía entre imagen, texto y widget.
 */
export default function Home() {
    return (
        <>
            <SEOHead 
                title="Venta de Casas y Desarrollos Inmobiliarios" 
                description="Encuentra tu hogar ideal o excelente oportunidad de inversión en desarrollos inmobiliarios en México con Inmueble Advisor." 
            />
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
        </>
    );
}
