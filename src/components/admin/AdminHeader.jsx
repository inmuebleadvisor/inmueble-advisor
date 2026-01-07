import React from 'react';
import { useUser } from '../../context/UserContext';
// Componente Header sencillo

const AdminHeader = () => {
    const { user } = useUser();

    return (
        <header className="admin-header">
            <div className="admin-header__title">
                Panel de Control
            </div>

            <div className="admin-header__user">
                <div className="admin-header__user-info">
                    <div className="admin-header__user-name">{user?.firstName || 'Admin'}</div>
                    <div className="admin-header__user-role">Administrador</div>
                </div>
                <div className="admin-header__avatar">
                    {user?.firstName?.charAt(0) || 'A'}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
