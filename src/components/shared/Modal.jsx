import React from 'react';

// Icons
const Icons = {
    X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Modal({ isOpen, onClose, children, title }) {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose} className="animate-fade-in">
            <div
                style={styles.modalContent}
                onClick={e => e.stopPropagation()} // Prevent close when clicking inside
            >
                <div style={styles.header}>
                    {title && <h3 style={styles.title}>{title}</h3>}
                    <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar">
                        <Icons.X />
                    </button>
                </div>
                <div style={styles.body} className="hide-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '900px', // Large width for details
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 20px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: 'white',
        zIndex: 10
    },
    title: {
        margin: 0,
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#1e293b'
    },
    closeBtn: {
        background: '#f1f5f9',
        border: 'none',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#64748b',
        transition: 'all 0.2s'
    },
    body: {
        overflowY: 'auto',
        flex: 1,
        position: 'relative'
    }
};
