/**
 * @file useScrollReveal.js
 * @description Custom hook to handle scroll animations using native IntersectionObserver.
 * Replaces ScrollReveal.js to avoid conflicts with body scroll locking and layout shifts.
 */
import { useEffect } from 'react';

/**
 * useScrollReveal Hook
 * 
 * Observes elements matching the selector and applies a visible class when they enter the viewport.
 * 
 * @param {string} selector - CSS selector of the elements to animate (e.g., '.catalogo__grid .card').
 * @param {Object} [config={}] - Configuration options (interval, etc. - mostly handled in CSS now).
 * @param {Array} [dependencies=[]] - Dependency array to re-run the observation.
 */
export const useScrollReveal = (selector, config = {}, dependencies = []) => {
    useEffect(() => {
        // Safety check
        if (typeof window === 'undefined' || !selector) return;

        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;

        const observerOptions = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // Trigger when 10% is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;

                    // Add visibility class
                    el.classList.add('sr-visible');

                    // Unobserve after revealing (trigger once)
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        elements.forEach((el, index) => {
            // Optional: Stagger effect via inline style delay
            if (config.interval) {
                // Only apply delay if it's the initial load or a batch update
                // Use a modest delay to prevent long waits on long lists
                // We restart delay count for every batch
                const delay = (index % 10) * (config.interval / 1000); // Limit stagger to chunks of 10
                el.style.transitionDelay = `${delay}s`;
            }
            // Ensure initial state class is set (handled in CSS usually, but we can guard here)
            el.classList.add('sr-hidden');
            observer.observe(el);
        });

        return () => {
            elements.forEach(el => observer.unobserve(el));
            observer.disconnect();
        };

    }, [selector, JSON.stringify(config), ...dependencies]);
};
