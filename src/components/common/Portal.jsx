import { createPortal } from 'react-dom';

/**
 * Portal Component
 * Renders children into a DOM node that exists outside the DOM hierarchy of the parent component.
 * Used to solve stacking context issues for modals, overlays, and fullscreen views.
 */
const Portal = ({ children }) => {
    return createPortal(children, document.body);
};

export default Portal;
