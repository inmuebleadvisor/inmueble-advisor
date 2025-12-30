import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './Delightbox.css';

const Icons = {
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Prev: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
    Next: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
};

export default function Delightbox({ isOpen, images = [], initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isAnimating, setIsAnimating] = useState(false);

    // Normalize images to be objects (since we might pass strings or objects)
    // Defined BEFORE callbacks to avoid TDZ/Scope issues
    const items = React.useMemo(() => (images || []).map(img => {
        if (typeof img === 'string') return { url: img, type: 'image' };
        return img;
    }), [images]);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);

            // 1. SAVE POSITION
            const savedScroll = window.scrollY || document.documentElement.scrollTop;
            console.log(`[SCROLL DEBUG] Open Delightbox. Saving position: ${savedScroll}px`);

            // Store in a safe place (ref not available in effect scope easily without modifying component state generally, 
            // but we can use a closure variable or a session storage for robustness across re-renders if needed,
            // however, for a simple effect cleanup, the closure might be tricky if the effect re-runs.
            // Let's use a mutable ref approach or a simple property on the window if we must, 
            // but actually, the cleanup function captures the scope variables.
            // Wait, if I define 'savedScroll' here, can I access it in cleanup? No, cleanup assumes fresh scope if dependencies change.
            // BETTER: Use a ref outside.

            document.body.style.overflow = 'hidden';
            window.__tempScrollPosition = savedScroll; // Fallback super-global for guaranteed persistence

        } else {
            document.body.style.overflow = '';
        }

        return () => {
            // 2. RESTORE POSITION
            document.body.style.overflow = '';
            const targetScroll = window.__tempScrollPosition || 0;
            console.log(`[SCROLL DEBUG] Close Delightbox. Restoring to: ${targetScroll}px`);

            // Restore immediately
            window.scrollTo(0, targetScroll);

            // Double check with a slight delay (sometimes browser layout shifts happen)
            setTimeout(() => {
                console.log(`[SCROLL DEBUG] Re-applying scroll to: ${targetScroll}px`);
                window.scrollTo(0, targetScroll);
            }, 50);
        };
    }, [isOpen, initialIndex]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        if (items.length <= 1) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setTimeout(() => setIsAnimating(false), 300);
    }, [items]);

    const handlePrev = useCallback((e) => {
        e?.stopPropagation();
        if (items.length <= 1) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        setTimeout(() => setIsAnimating(false), 300);
    }, [items]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
    }, [isOpen, onClose, handleNext, handlePrev]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Touch state for swipe
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance (in px) 
    const minSwipeDistance = 50;

    // Touch Event Handlers
    const onTouchStart = (e) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Swiped Left -> Next Image
            handleNext();
        } else if (isRightSwipe) {
            // Swiped Right -> Prev Image
            handlePrev();
        }
    };

    if (!isOpen || images.length === 0) return null;

    const currentItem = items[currentIndex];

    return ReactDOM.createPortal(
        <div className="delightbox-overlay" onClick={onClose}>
            <div className="delightbox__backdrop"></div>

            <button className="delightbox__close-button" onClick={onClose} aria-label="Cerrar">
                <Icons.Close />
            </button>

            {/* Remove stopPropagation from here so clicks on empty space close the modal */}
            {/* Add touch handlers to the wrapper so you can swipe anywhere */}
            <div
                className="delightbox__content-wrapper"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Navigation Buttons for Desktop (Left) */}
                {items.length > 1 && (
                    <button
                        className="delightbox__nav-button"
                        style={{ left: '20px' }}
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        aria-label="Anterior"
                    >
                        <Icons.Prev />
                    </button>
                )}

                <div
                    className="delightbox__image-container"
                    onClick={(e) => e.stopPropagation()} // Stop propagation here so clicking image DOES NOT close
                >
                    {currentItem.type === 'video' ? (
                        <div className="delightbox__video-placeholder">
                            <a href={currentItem.url} target="_blank" rel="noopener noreferrer" className="delightbox__video-link">
                                <span>▶ Ver Video Original</span>
                            </a>
                        </div>
                    ) : (
                        <img
                            src={currentItem.url}
                            alt={`Imagen ${currentIndex + 1}`}
                            className="delightbox__image"
                            style={{
                                opacity: isAnimating ? 0.5 : 1,
                                transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
                                pointerEvents: 'auto' // Re-enable clicks on image itself
                            }}
                        />
                    )}

                    <div className="delightbox__counter">
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>

                {/* Navigation Buttons for Desktop (Right) */}
                {items.length > 1 && (
                    <button
                        className="delightbox__nav-button"
                        style={{ right: '20px' }}
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        aria-label="Siguiente"
                    >
                        <Icons.Next />
                    </button>
                )}
            </div>
        </div>,
        document.body
    );
}
