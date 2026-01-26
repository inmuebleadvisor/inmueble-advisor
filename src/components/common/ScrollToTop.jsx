import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * 
 * Componente que resetea la posición del scroll al inicio de la ventana
 * cada vez que cambia la ruta (pathname).
 * 
 * Se debe colocar dentro de BrowserRouter y antes de las rutas.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Deshabilitar la restauración automática del navegador
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // 2. Función de scroll agresivo
        const handleScroll = () => {
            const options = { top: 0, left: 0, behavior: 'instant' };

            // Intentar scrollear la ventana global
            window.scrollTo(options);

            // Intentar scrollear el body y html (algunos navegadores/layouts usan uno u otro)
            document.body.scrollTo(options);
            document.documentElement.scrollTo(options);

            // Intentar scrollear el contenedor principal del layout si existe
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTo(options);
            }
        };

        // 3. Ejecutar inmediatamente
        handleScroll();

        // 4. Forzar un segundo intento en el siguiente ciclo (para layouts que renderizan tarde)
        const timeoutId = setTimeout(handleScroll, 0);

        return () => clearTimeout(timeoutId);

    }, [pathname]);

    return null;
};

export default ScrollToTop;
