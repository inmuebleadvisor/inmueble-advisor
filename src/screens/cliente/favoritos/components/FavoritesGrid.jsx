import React from 'react';
import ImageLoader from '../../../../components/common/ImageLoader';
import styles from '../Favoritos.module.css';

// Note: Circular dependency issue if importing Icons from parent.
// Proper way: Extract Icons to a separate file, or define locally.
// For now, I'll redefine locally to be safe and clean.

const LocalIcons = {
    Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
};

export default function FavoritesGrid({
    groupedFavorites,
    selectedIds,
    onSelect,
    onRemove,
    onOpenModel,
    onOpenDev,
    getDesarrolloForModel // passed from VM or props
}) {

    const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

    const getImageForModel = (model) => {
        if (!model.imagen || model.imagen === FALLBACK_IMG) {
            const dev = getDesarrolloForModel(model);
            if (dev && dev.imagen && dev.imagen !== FALLBACK_IMG) {
                return dev.imagen;
            }
        }
        return model.imagen;
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    return (
        <>
            {groupedFavorites.map(group => (
                <div key={group.id} className={styles.group}>
                    <div className={styles.group__header}>
                        <h2 className={styles.group__title}>{group.name}</h2>
                        {group.desarrollo && (
                            <button
                                onClick={(e) => onOpenDev(e, group.id)}
                                className={styles['group__view-dev-btn']}
                            >
                                Ver Desarrollo
                            </button>
                        )}
                    </div>

                    <div className={styles.grid}>
                        {group.items.map(item => {
                            const isSelected = selectedIds.includes(item.id);
                            const displayImage = getImageForModel(item);

                            return (
                                <div
                                    key={item.id}
                                    className={styles.card} // We need to ensure 'card' class exists in CSS or inline it if complex
                                    style={{
                                        // Keeping some inline styles for dynamic properties not easily done in loose CSS modules without clsx
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        border: isSelected ? '2px solid var(--primary-color)' : '2px solid transparent',
                                        boxShadow: isSelected ? '0 0 0 3px rgba(0, 57, 106, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={() => onSelect(item.id)}
                                >
                                    <div style={{
                                        position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px',
                                        borderRadius: '6px', border: '2px solid', zIndex: 10, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: 'white',
                                        backgroundColor: isSelected ? 'var(--primary-color)' : 'white',
                                        borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-subtle)'
                                    }}>
                                        {isSelected && <LocalIcons.Check />}
                                    </div>

                                    <div style={{ height: '140px', position: 'relative', backgroundColor: 'var(--bg-main)' }}>
                                        <ImageLoader src={displayImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                            style={{
                                                position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px',
                                                borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444'
                                            }}
                                        >
                                            <LocalIcons.Trash />
                                        </button>

                                        <button
                                            onClick={(e) => onOpenModel(e, item)}
                                            style={{
                                                position: 'absolute', bottom: '10px', right: '10px', width: '32px', height: '32px',
                                                borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white'
                                            }}
                                        >
                                            <LocalIcons.Eye />
                                        </button>
                                    </div>

                                    <div style={{ padding: '12px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre_modelo}</h3>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                                            {item.precioNumerico ? formatCurrency(item.precioNumerico) : 'Pendiente'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            <span>{item.recamaras} Rec</span> • <span>{item.m2} m²</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </>
    );
}
