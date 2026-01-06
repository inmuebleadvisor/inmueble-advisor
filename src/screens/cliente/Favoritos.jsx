// src/screens/Favoritos.jsx
// MODIFICADO POR AGENTIC AI: 2026-01-05
// Refactorizado para usar ViewModel y Subcomponentes (Clean Architecture)

import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

// Logic
import { useFavoritesViewModel } from '../../hooks/useFavoritesViewModel';

// Components
import Modal from '../../components/ui/Modal';
import ModelDetailsContent from '../../components/catalogo/ModelDetailsContent';
import DevelopmentDetailsContent from '../../components/catalogo/DevelopmentDetailsContent';
import FavoritesGrid from './favoritos/components/FavoritesGrid';
import ComparisonTable from './favoritos/components/ComparisonTable';

// Styles
import styles from './favoritos/Favoritos.module.css';

// --- ICONOS --- (Re-exported for consistency if needed, but components use their own or passed icons)
// For local usage like buttons
const Icons = {
    Compare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l5 5" /><path d="M4 4l5 5" /></svg>,
};

export default function Favoritos() {
    const vm = useFavoritesViewModel();

    // --- RENDERIZADO: ESTADO VACÍO ---
    if (!vm.isLoading && vm.favoritesList.length === 0) {
        return (
            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💔</div>
                <h2 style={{ color: 'var(--text-main)' }}>Tu lista está vacía</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '10px auto' }}>
                    Explora nuestro catálogo y guarda las propiedades que te interesen para compararlas aquí.
                </p>
                <Link to="/catalogo" className={styles.empty__btn}>Ir al Catálogo</Link>
            </div>
        );
    }

    // CONTENIDO DEL MODAL
    const renderModalContent = () => {
        if (!vm.modalState.activeItem) return null;

        if (vm.modalState.type === 'model') {
            const activeItem = vm.modalState.activeItem;
            const desarrollo = vm.getDesarrolloForModel(activeItem);

            // Logic for siblings could be moved to VM if complex, but filtering here is okay for view-logic
            const hermanos = vm.modelos.filter(m => {
                const activeIdDev = desarrollo ? String(desarrollo.id) : null;
                const mIdDev = m.idDesarrollo || m.id_desarrollo || m.desarrollo_id;
                return activeIdDev && String(mIdDev) === activeIdDev && String(m.id) !== String(activeItem.id);
            });

            return (
                <ModelDetailsContent
                    modelo={activeItem}
                    desarrollo={desarrollo}
                    modelosHermanos={hermanos}
                    isModal={true}
                />
            );
        } else {
            return (
                <DevelopmentDetailsContent
                    desarrollo={vm.modalState.activeItem}
                    isModal={true}
                />
            );
        }
    };

    // --- RENDERIZADO: MODO COMPARACIÓN (TABLA) ---
    if (vm.isComparing) {
        return (
            <div className="main-content">
                <ComparisonTable
                    items={vm.comparisonList}
                    selectedIds={vm.selectedIds}
                    onSelect={vm.handleSelect}
                    onBack={() => vm.setIsComparing(false)}
                    onOpenModel={vm.openModelPopup}
                    onOpenDev={vm.openDevelopmentPopup}
                    getDesarrolloForModel={vm.getDesarrolloForModel}
                />

                <Modal
                    isOpen={vm.modalState.isOpen}
                    onClose={vm.closeModal}
                    title={vm.modalState.type === 'model' ? 'Detalle del Modelo' : 'Detalle del Desarrollo'}
                >
                    {renderModalContent()}
                </Modal>
            </div>
        );
    }

    // --- RENDERIZADO: MODO GALERÍA (DEFAULT) ---
    return (
        <div className={`main-content ${styles.favoritos}`}>
            <header className={styles.favoritos__header}>
                <h1 className={styles.favoritos__title}>Mis Favoritos ({vm.favoritesList.length})</h1>
                <p className={styles.favoritos__subtitle}>Selecciona hasta 3 propiedades para enfrentarlas.</p>
            </header>

            <FavoritesGrid
                groupedFavorites={vm.groupedFavorites}
                selectedIds={vm.selectedIds}
                onSelect={vm.handleSelect}
                onRemove={vm.toggleFavorite}
                onOpenModel={vm.openModelPopup}
                onOpenDev={vm.openDevelopmentPopup}
                getDesarrolloForModel={vm.getDesarrolloForModel}
            />

            {/* FLOATING ACTION BAR - Portaled to escape stacking contexts */}
            {createPortal(
                <div className={`${styles['floating-bar']} ${vm.selectedIds.length > 0 ? styles['floating-bar--visible'] : ''}`}>
                    <div className={styles['floating-bar__content']}>
                        <span style={{ fontWeight: '600' }}>{vm.selectedIds.length} seleccionadas</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={vm.clearSelection} className={styles['floating-bar__btn-ghost']}>Limpiar</button>
                            <button
                                onClick={() => vm.setIsComparing(true)}
                                disabled={vm.selectedIds.length < 2}
                                className={styles['floating-bar__btn-compare']}
                            >
                                Comparar ahora <Icons.Compare />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL */}
            <Modal
                isOpen={vm.modalState.isOpen}
                onClose={vm.closeModal}
                title={vm.modalState.type === 'model' ? 'Detalle del Modelo' : 'Detalle del Desarrollo'}
            >
                {renderModalContent()}
            </Modal>

        </div>
    );
}
