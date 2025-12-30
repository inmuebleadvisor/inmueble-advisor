import React from 'react';
import { useUser } from '../../context/UserContext';
// Componente Header sencillo

const AdminHeader = () => {
    const { user } = useUser();

    return (
        <header className="admin-header" style={{
            height: '70px',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px'
        }}>
            <div className="admin-header__title">
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Panel de Control</h2>
            </div>

            <div className="admin-header__user" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-info" style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{user?.firstName || 'Admin'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrador</div>
                </div>
                <div className="user-avatar" style={{
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold'
                }}>
                    {user?.firstName?.charAt(0) || 'A'}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
