import React from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import DataTable from '../../components/admin/DataTable';

const AdminUsers = () => {
    const { data, loading } = useAdminData();
    const { users } = data;

    const columns = [
        { header: 'Nombre', accessor: 'firstName', render: row => <strong>{row.firstName} {row.lastName}</strong> },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Rol', accessor: 'role', render: row => (
                <span style={{
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    color: row.role === 'admin' ? '#ef4444' : (row.role === 'asesor' ? '#3b82f6' : 'var(--text-main)')
                }}>
                    {row.role || 'CLIENTE'}
                </span>
            )
        },
        {
            header: 'Registro', accessor: 'createdAt', render: row => {
                // Safe date handling
                const d = row.createdAt?.toDate ? row.createdAt.toDate() : new Date(row.createdAt);
                return isNaN(d) ? 'N/A' : d.toLocaleDateString();
            }
        }
    ];

    return (
        <div>
            <h1>Usuarios Registrados</h1>
            <DataTable columns={columns} data={users} isLoading={loading} />
        </div>
    );
};

export default AdminUsers;
