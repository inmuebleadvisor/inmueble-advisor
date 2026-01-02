import React from 'react';
import { NavLink } from 'react-router-dom';
// Using standard SVG icons for now, later can be replaced with lucide-react or existing library
// Simple inline SVGs for portability

const AdminSidebar = ({ collapsed, toggleCollapse }) => {

    // Helper for NavLink classes
    const getLinkClass = ({ isActive }) =>
        `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`;

    return (
        <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`} style={{
            width: collapsed ? '80px' : '260px',
            backgroundColor: 'var(--bg-secondary)', // Theme aware
            borderRight: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10
        }}>
            {/* Header / Logo Area */}
            <div className="admin-sidebar__header" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                {collapsed ? <span style={{ fontSize: '1.5rem' }}>IA</span> : <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>Inmueble Advisor</span>}
            </div>

            {/* Navigation Links */}
            <nav className="admin-sidebar__nav" style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>

                <NavLink to="/administrador" end className={getLinkClass} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                    <span>📊</span> {/* Placeholder Icon */}
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>

                <NavLink to="/administrador/leads" className={getLinkClass} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                    <span>👥</span>
                    {!collapsed && <span>Gestión de Leads</span>}
                </NavLink>

                <NavLink to="/administrador/users" className={getLinkClass} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                    <span>🛡️</span>
                    {!collapsed && <span>Usuarios</span>}
                </NavLink>

                <NavLink to="/administrador/asesores" className={getLinkClass} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                    <span>👔</span>
                    {!collapsed && <span>Gestión Asesores</span>}
                </NavLink>

            </nav>

            {/* Footer / Toggle */}
            <div className="admin-sidebar__footer" style={{ padding: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={toggleCollapse} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '5px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                    {collapsed ? '→' : '<< Colapsar'}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
