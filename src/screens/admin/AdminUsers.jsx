import React, { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import DataTable from '../../components/admin/DataTable';
import { useService } from '../../hooks/useService';

const AdminUsers = () => {
    const { admin } = useService();
    const { data, loading, refresh } = useAdminData();
    const { users } = data;
    const [promoting, setPromoting] = useState(null); // UID of user being promoted

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'admin-badge--admin';
            case 'asesor': return 'admin-badge--advisor';
            default: return 'admin-badge--client';
        }
    };

    const handlePromote = async (user) => {
        if (!confirm(`¿Promover a ${user.firstName} como Asesor?`)) return;

        setPromoting(user.uid);
        try {
            await admin.promoteUser(user.uid);
            alert("Usuario promovido con éxito.");
            refresh(); // Reload data to show updated role
        } catch (error) {
            alert("Error al promover: " + error.message);
        } finally {
            setPromoting(null);
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
            header: 'Acciones', render: row => (
                <div className="admin-actions-group">
                    {(row.role !== 'admin' && row.role !== 'asesor') && (
                        <button
                            onClick={() => handlePromote(row)}
                            disabled={promoting === row.uid}
                            className="action-btn action-btn--assign"
                        >
                            {promoting === row.uid ? 'Promoviendo...' : 'Promover a Asesor'}
                        </button>
                    )}
                </div>
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
