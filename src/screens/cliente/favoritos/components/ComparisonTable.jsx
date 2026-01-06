import React from 'react';
import { Link } from 'react-router-dom';
import ImageLoader from '../../../../components/ui/ImageLoader';
import styles from '../Favoritos.module.css';

const LocalIcons = {
    X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
};

export default function ComparisonTable({
    items,
    selectedIds,
    onSelect,
    onBack,
    onOpenModel,
    onOpenDev,
    getDesarrolloForModel
}) {
    const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    const rows = [
        {
            label: 'Zona/Sector',
            val: (m) => {
                const dev = getDesarrolloForModel(m);
                return m.zona || dev?.zona || dev?.ubicacion?.ciudad || 'N/A';
            }
        },
        {
            label: 'Colonia',
            val: (m) => {
                const dev = getDesarrolloForModel(m);
                return m.ubicacion?.colonia || m.colonia || dev?.ubicacion?.colonia || 'N/A';
            }
        },
        {
            label: 'Desarrollo',
            val: (m) => {
                const dev = getDesarrolloForModel(m);
                return m.nombreDesarrollo || dev?.nombre || 'Desarrollo';
            },
            isLink: true,
            onClick: (m) => onOpenDev(null, m.idDesarrollo || m.id_desarrollo)
        },
        { label: 'Construcción', val: (m) => `${m.m2} m²` },
        {
            label: 'Costo por m²',
            val: (m) => m.m2 > 0 ? formatoMoneda(m.precioNumerico / m.m2) : 'N/A',
            highlightStyle: { fontSize: '0.85rem', color: 'var(--text-secondary)' }
        },
        { label: 'Recámaras', val: (m) => m.recamaras },
        { label: 'Baños', val: (m) => m.banos },
        { label: 'Niveles', val: (m) => m.niveles || 1 },
        { label: 'Entrega', val: (m) => m.esPreventa ? 'Pre-Venta' : 'Inmediata', highlight: true },
    ];

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '50px' }}>
            <div className={styles.comparison__header}>
                <button onClick={onBack} className={styles['comparison__back-btn']}>&larr; Volver a mis favoritos</button>
                <h2 className={styles.favoritos__title}>Comparativa</h2>
            </div>

            <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={`${styles['table__th']} ${styles['table__col-sticky']} ${styles['table__th--sticky']}`}>Característica</th>
                            {items.map(item => (
                                <th key={item.id} style={{ minWidth: '180px', padding: '15px', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top', backgroundColor: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <div style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}>
                                            <ImageLoader src={item.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                onClick={() => {
                                                    onSelect(item.id);
                                                    if (selectedIds.length <= 1) onBack();
                                                }}
                                                style={{
                                                    position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%',
                                                    backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                }}
                                            >
                                                <LocalIcons.X />
                                            </button>
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.2' }}>{item.nombre_modelo}</span>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem', marginTop: '4px' }}>{formatoMoneda(item.precioNumerico)}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-main)' }}>
                                <td className={`${styles['table__td']} ${styles['table__col-sticky']}`}>{row.label}</td>
                                {items.map(item => (
                                    <td key={item.id} style={{
                                        padding: '15px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)',
                                        color: row.highlight ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: row.highlight ? 'bold' : 'normal',
                                        fontSize: '0.95rem',
                                        ...(row.highlightStyle || {})
                                    }}>
                                        {row.isLink ? (
                                            <button
                                                onClick={() => row.onClick(item)}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600', fontSize: 'inherit' }}
                                            >
                                                {row.val(item)}
                                            </button>
                                        ) : (
                                            row.val(item)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {/* Action Row */}
                        <tr>
                            <td className={`${styles['table__td']} ${styles['table__col-sticky']}`} style={{ borderBottom: 'none' }}></td>
                            {items.map(item => (
                                <td key={item.id} style={{ padding: '20px', borderBottom: 'none' }}>
                                    <button
                                        onClick={(e) => onOpenModel(item)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
                                            backgroundColor: 'var(--base-brand-blue)', color: 'white', padding: '10px', borderRadius: '8px',
                                            border: 'none', cursor: 'pointer', fontWeight: '600'
                                        }}
                                    >
                                        Ver Detalle <LocalIcons.Eye />
                                    </button>
                                    <Link to={`/modelo/${item.id}`} style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textDecoration: 'none', textAlign: 'center' }}>
                                        Ir a página completa
                                    </Link>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
