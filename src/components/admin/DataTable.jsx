import React from 'react';

const DataTable = ({ columns, data, isLoading, emptyMessage = "No hay datos disponibles" }) => {

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando datos...</div>;
    }

    if (!data || data.length === 0) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
            }}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="admin-table-container" style={{
            overflowX: 'auto',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', backgroundColor: 'var(--bg-main)' }}>
                        {columns.map((col, idx) => (
                            <th key={idx} style={{
                                padding: '16px',
                                textAlign: 'left',
                                color: 'var(--text-secondary)',
                                fontWeight: '600'
                            }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr key={row.id || rowIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {columns.map((col, colIdx) => (
                                <td key={colIdx} style={{ padding: '16px', color: 'var(--text-main)' }}>
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
