import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * @file SEOHead.jsx
 * @description Componente agnóstico encargado de inyectar dinámicamente metadatos SEO en el <head>.
 * Diseñado bajo principios de separación de UI/Negocio.
 */
export default function SEOHead({ title, description, keywords, ogImage, ogUrl }) {
    const siteTitle = title ? `${title} | Inmueble Advisor` : 'Inmueble Advisor | Desarrollos Inmobiliarios y Venta de Casas';
    const siteDescription = description || 'Encuentra tu hogar ideal o excelente oportunidad de inversión en desarrollos inmobiliarios y casas en México.';
    const siteKeywords = keywords || 'Bienes raíces, Venta de casas, Departamentos, Desarrollos inmobiliarios, Preventa, México';
    const siteImage = ogImage || 'https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FFavicon%20Inmueble%20Advisor%20PNG.png?alt=media&token=a7fb5f8d-c194-4897-82e4-62addd4764d1';

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={siteDescription} />
            {siteKeywords && <meta name="keywords" content={siteKeywords} />}

            {/* Open Graph tags (Facebook, LinkedIn, etc.) */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={siteDescription} />
            {siteImage && <meta property="og:image" content={siteImage} />}
            {ogUrl && <meta property="og:url" content={ogUrl} />}

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={siteDescription} />
            {siteImage && <meta name="twitter:image" content={siteImage} />}
        </Helmet>
    );
}

SEOHead.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    ogImage: PropTypes.string,
    ogUrl: PropTypes.string
};
