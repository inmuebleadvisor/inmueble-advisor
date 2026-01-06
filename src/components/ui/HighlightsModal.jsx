import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import FavoriteBtn from './FavoriteBtn';
import { useFavorites } from '../../context/FavoritesContext';
import { useUser } from '../../context/UserContext';
import { normalizar } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import './HighlightsModal.css';

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
            <div className="highlights-modal__container">
                <ul className="highlights-modal__list">
                    {highlights.map((highlight, index) => (
                        <li key={index} className="highlights-modal__list-item">
                            <span className="highlights-modal__check-icon">✓</span>
                            {highlight}
                        </li>
                    ))}
                </ul>

                <div className="highlights-modal__action-container">
                    {/* Wrapper div applied for specific positioning needed if FavoriteBtn is generic */}
                    <div className="highlights-modal__favorite-btn-wrapper">
                        <FavoriteBtn
                            modeloId={modeloId}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
                <p className="highlights-modal__favorite-legend">
                    {isFav ? "Ya está en tus favoritos" : "Agrega a tus favoritos"}
                </p>
            </div>
        </Modal>
    );
};

export default HighlightsModal;
