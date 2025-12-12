import React from 'react';
import Modal from '../Modal';

const HighlightsModal = ({ isOpen, onClose, highlights }) => {
    if (!highlights || highlights.length === 0) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="¡Felicidades, encontraste un Destacado!"
        >
            <div style={styles.container}>
                <div style={styles.iconContainer}>
                    <span style={{ fontSize: '3rem' }}>🎉</span>
                </div>
                <p style={styles.introText}>
                    Esta propiedad cuenta con beneficios exclusivos que la hacen única:
                </p>
                <ul style={styles.list}>
                    {highlights.map((highlight, index) => (
                        <li key={index} style={styles.listItem}>
                            <span style={styles.checkIcon}>✓</span>
                            {highlight}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onClose}
                    className="btn btn-primary"
                    style={styles.closeButton}
                >
                    ¡Entendido!
                </button>
            </div>
        </Modal>
    );
};

const styles = {
    container: {
        padding: '20px',
        textAlign: 'center',
    },
    iconContainer: {
        marginBottom: '15px',
    },
    introText: {
        fontSize: '1.1rem',
        color: '#4b5563',
        marginBottom: '20px',
    },
    list: {
        listStyle: 'none',
        padding: 0,
        margin: '0 0 25px 0',
        textAlign: 'left',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '15px',
    },
    listItem: {
        display: 'flex',
        alignItems: 'start',
        gap: '10px',
        marginBottom: '10px',
        fontSize: '1rem',
        color: '#1e293b',
        fontWeight: '500',
    },
    checkIcon: {
        color: '#10b981',
        fontWeight: 'bold',
    },
    closeButton: {
        width: '100%',
        padding: '12px',
        fontSize: '1rem',
    }
};

export default HighlightsModal;
