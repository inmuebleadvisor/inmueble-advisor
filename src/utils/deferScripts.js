/**
 * Delays the execution of a function until the page is idle or a timeout is reached.
 * Used for deferring heavy third-party scripts like Tracking pixels.
 * @param {Function} callback - The function to execute
 * @param {number} timeout - Fallback timeout in ms (default 3000ms)
 */
export const runOnIdle = (callback, timeout = 3500) => {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => callback(), { timeout });
    } else {
        setTimeout(callback, timeout);
    }
};
