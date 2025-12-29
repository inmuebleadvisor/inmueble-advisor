import { useState, useEffect } from 'react';

/**
 * useStickyPanel Hook
 * 
 * Manages the visibility of a sticky action panel based on the scroll position relative to a header element.
 * SIDE EFFECT: Adds a global class 'global-fab-hidden' to the body when the panel is visible,
 * which is used to hide other floating action buttons (like WhatsApp).
 * 
 * @param {React.RefObject} headerRef - Ref to the element that, when scrolled out of view, triggers the sticky panel.
 * @returns {boolean} showPanel - True if the panel should be visible.
 */
export function useStickyPanel(headerRef) {
    const [showPanel, setShowPanel] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If header is NOT intersecting (scrolled out of view), show the sticky panel
                const shouldShow = !entry.isIntersecting;
                setShowPanel(shouldShow);
            },
            { root: null, threshold: 0, rootMargin: "-100px 0px 0px 0px" }
        );

        if (headerRef.current) {
            observer.observe(headerRef.current);
        }

        return () => {
            if (headerRef.current) {
                observer.unobserve(headerRef.current);
            }
        };
    }, [headerRef]);

    // Side Effect: Toggle global class on body to hide other FABs
    useEffect(() => {
        if (showPanel) {
            document.body.classList.add('global-fab-hidden');
        } else {
            document.body.classList.remove('global-fab-hidden');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('global-fab-hidden');
        };
    }, [showPanel]);

    return showPanel;
}
