import React from 'react';

const DataTable = ({ columns, data, isLoading, emptyMessage = "No hay datos disponibles" }) => {

    if (isLoading) {
        return <div className="admin-loading-state">Cargando datos...</div>;
    }

    if (!data || data.length === 0) {
        return (
            <div className="admin-empty-state">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="admin-table-container">
            <table>
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr key={row.id || rowIdx}>
                            {columns.map((col, colIdx) => (
                                <td key={colIdx}>
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
