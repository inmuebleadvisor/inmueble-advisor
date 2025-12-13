/**
 * @file useScrollReveal.js
 * @description Custom hook to integrate ScrollReveal.js animations into components.
 * Follows the Singleton pattern for the ScrollReveal instance but applies reveals to specific selectors.
 */
import { useEffect } from 'react';
import ScrollReveal from 'scrollreveal';

/**
 * useScrollReveal Hook
 * 
 * Applies ScrollReveal animations to elements matching the provided selector.
 * 
 * @param {string} selector - CSS selector of the elements to animate (e.g., '.card').
 * @param {Object} [config={}] - Optional configuration override for ScrollReveal.
 * @param {Array} [dependencies=[]] - Dependency array to re-run the animation (e.g., when data changes).
 * 
 * @example
 * useScrollReveal('.my-card', { interval: 200 }, [items]);
 */
export const useScrollReveal = (selector, config = {}, dependencies = []) => {
    useEffect(() => {
        // Safety check for server-side rendering or non-browser environments
        if (typeof window === 'undefined' || !selector) return;

        // Default configuration aligning with "Premium" feel (smooth, bottom-up)
        const defaultConfig = {
            distance: '50px',
            duration: 1000,
            easing: 'cubic-bezier(0.5, 0, 0, 1)',
            origin: 'bottom',
            interval: 100, // Stagger effect
            cleanup: true, // Custom flag, though SR handles it differently
            ...config
        };

        try {
            const sr = ScrollReveal();
            // Clean previous styles if re-running (important for filtering)
            sr.clean(selector);
            sr.reveal(selector, defaultConfig);
        } catch (error) {
            console.error('ScrollReveal Error:', error);
        }

        // Cleanup function
        return () => {
            try {
                const sr = ScrollReveal();
                sr.clean(selector);
            } catch (e) {
                // Ignore cleanup errors
            }
        };
    }, [selector, JSON.stringify(config), ...dependencies]);
};
