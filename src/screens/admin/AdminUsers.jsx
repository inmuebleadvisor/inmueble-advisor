import React from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import DataTable from '../../components/admin/DataTable';

const AdminUsers = () => {
    const { data, loading } = useAdminData();
    const { users } = data;

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'admin-badge--admin';
            case 'asesor': return 'admin-badge--advisor';
            default: return 'admin-badge--client';
        }
    };

    const columns = [
        { header: 'Nombre', accessor: 'firstName', render: row => <strong>{row.firstName} {row.lastName}</strong> },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Rol', accessor: 'role', render: row => (
                <span className={`admin-badge ${getRoleBadgeClass(row.role)}`}>
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
        <div className="admin-users">
            <header className="admin-users__header">
                <h1 className="admin-users__title">Usuarios Registrados</h1>
            </header>
            <DataTable columns={columns} data={users} isLoading={loading} />
        </div>
    );
};

export default AdminUsers;
