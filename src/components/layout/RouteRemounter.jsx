import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteRemounter
 * 
 * Wrapper component that forces its children to remount whenever the route location key changes.
 * This is crucial for "Same Route" navigation (e.g., /model/1 -> /model/2) where we want
 * a completely fresh component state and scroll reset, avoiding React's component reuse optimization.
 * 
 * Usage:
 * <Route path="..." element={<RouteRemounter><MyComponent /></RouteRemounter>} />
 */
const RouteRemounter = ({ children }) => {
    const location = useLocation();

    // Use location.pathname (or location.key) as the key for the children.
    // Changing the key forces React to destroy and recreate the component tree.
    return React.cloneElement(children, { key: location.pathname });
};

export default RouteRemounter;
