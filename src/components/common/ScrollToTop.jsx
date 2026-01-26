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
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
