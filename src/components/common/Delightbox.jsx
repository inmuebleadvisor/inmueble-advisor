import React, { useState, useEffect, useCallback } from 'react';

const Icons = {
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Prev: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
    Next: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
};

export default function Delightbox({ isOpen, images = [], initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, initialIndex]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        if (items.length <= 1) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setTimeout(() => setIsAnimating(false), 300);
    }, [images]);

    const handlePrev = useCallback((e) => {
        e?.stopPropagation();
        if (items.length <= 1) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        setTimeout(() => setIsAnimating(false), 300);
    }, [images]);

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

    // Normalize images to be objects (since we might pass strings or objects)
    const items = images.map(img => {
        if (typeof img === 'string') return { url: img, type: 'image' };
        return img;
    });

    const currentItem = items[currentIndex];

    return (
        <div style={styles.overlay} onClick={onClose} className="delightbox-overlay">
            <div style={styles.backdrop}></div>

            <button style={styles.closeButton} onClick={onClose} aria-label="Cerrar">
                <Icons.Close />
            </button>

            {/* Remove stopPropagation from here so clicks on empty space close the modal */}
            {/* Add touch handlers to the wrapper so you can swipe anywhere */}
            <div
                style={styles.contentWrapper}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Navigation Buttons for Desktop (Left) */}
                {items.length > 1 && (
                    <button
                        style={{ ...styles.navButton, left: '20px' }}
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        aria-label="Anterior"
                    >
                        <Icons.Prev />
                    </button>
                )}

                <div
                    style={styles.imageContainer}
                    onClick={(e) => e.stopPropagation()} // Stop propagation here so clicking image DOES NOT close
                >
                    {currentItem.type === 'video' ? (
                        <div style={styles.videoPlaceholder}>
                            <a href={currentItem.url} target="_blank" rel="noopener noreferrer" style={styles.videoLink}>
                                <span>▶ Ver Video Original</span>
                            </a>
                        </div>
                    ) : (
                        <img
                            src={currentItem.url}
                            alt={`Imagen ${currentIndex + 1}`}
                            style={{
                                ...styles.image,
                                opacity: isAnimating ? 0.5 : 1, // Simple fade during splice switch
                                transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
                            }}
                            className="delightbox-image"
                        />
                    )}

                    <div style={styles.counter}>
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>

                {/* Navigation Buttons for Desktop (Right) */}
                {items.length > 1 && (
                    <button
                        style={{ ...styles.navButton, right: '20px' }}
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        aria-label="Siguiente"
                    >
                        <Icons.Next />
                    </button>
                )}
            </div>

            <style>{`
                .delightbox-overlay { animation: fadeIn 0.3s ease-out; }
                .delightbox-image { transition: all 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999, // Super high z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(5px)',
    },
    closeButton: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
        zIndex: 10001,
        transition: 'background 0.2s',
    },
    contentWrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
    },
    imageContainer: {
        position: 'relative',
        maxWidth: '90%',
        maxHeight: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '85vh',
        objectFit: 'contain',
        borderRadius: '4px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
        zIndex: 10001,
        transition: 'all 0.2s',
    },
    counter: {
        marginTop: '15px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.9rem',
        fontWeight: '500',
        letterSpacing: '1px',
    },
    videoPlaceholder: {
        width: '80vw',
        height: '60vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #333',
        borderRadius: '8px'
    },
    videoLink: {
        color: 'white',
        fontSize: '1.2rem',
        textDecoration: 'none',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '30px',
        transition: 'transform 0.2s'
    }
};
