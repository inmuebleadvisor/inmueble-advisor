import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import FavoriteBtn from '../FavoriteBtn';
import { useFavorites } from '../../context/FavoritesContext';
import { useUser } from '../../context/UserContext';
import { normalizar } from '../../utils/formatters';
import confetti from 'canvas-confetti';

const HighlightsModal = ({ isOpen, onClose, highlights, modeloId }) => {
    const { isFavorite } = useFavorites();
    const { selectedCity } = useUser();
    const [modalTitle, setModalTitle] = useState("Felicidades, encontraste un dato destacado!");

    useEffect(() => {
        if (isOpen && highlights && highlights.length > 0) {
            const hasCityHighlight = highlights.some(h => {
                const normH = normalizar(h);
                const normCity = selectedCity ? normalizar(selectedCity) : '';
                return normH.includes('ciudad') || (normCity && normH.includes(normCity));
            });

            if (hasCityHighlight) {
                setModalTitle("¡El mejor de la ciudad!");
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 10000,
                    colors: ['#fcd34d', '#f59e0b', '#10b981', '#3b82f6']
                });
            } else {
                setModalTitle("Felicidades, encontraste un dato destacado!");
            }
        }
    }, [isOpen, highlights, selectedCity]);

    if (!highlights || highlights.length === 0) return null;

    const isFav = isFavorite(modeloId);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
        >
            <div style={styles.container}>
                <ul style={styles.list}>
                    {highlights.map((highlight, index) => (
                        <li key={index} style={styles.listItem}>
                            <span style={styles.checkIcon}>✓</span>
                            {highlight}
                        </li>
                    ))}
                </ul>

                <div style={styles.actionContainer}>
                    <FavoriteBtn
                        modeloId={modeloId}
                        style={{ width: '50px', height: '50px', transform: 'scale(1.2)' }}
                    />
                </div>
                <p style={styles.favoriteLegend}>
                    {isFav ? "Ya está en tus favoritos" : "Agrega a tus favoritos"}
                </p>
            </div>
        </Modal>
    );
};

const styles = {
    container: {
        padding: '20px',
        textAlign: 'center',
    },
    list: {
        listStyle: 'none',

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
    actionContainer: {
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '10px'
    },
    favoriteLegend: {
        textAlign: 'center',
        margin: '10px 0 0 0',
        fontSize: '0.9rem',
        color: '#64748b',
        fontWeight: '500'
    }
};

export default HighlightsModal;
