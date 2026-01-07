import React from 'react';
import { NavLink } from 'react-router-dom';
// Using standard SVG icons for now, later can be replaced with lucide-react or existing library
// Simple inline SVGs for portability

const AdminSidebar = ({ collapsed, toggleCollapse }) => {

    // Helper for NavLink classes
    const getLinkClass = ({ isActive }) =>
        `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`;

    return (
        <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}>
            {/* Header / Logo Area */}
            <div className="admin-sidebar__header">
                <div className="admin-sidebar__brand">
                    {collapsed ? 'IA' : <span>Inmueble Advisor</span>}
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="admin-sidebar__nav">

                <NavLink to="/administrador" end className={getLinkClass}>
                    <span className="admin-sidebar__icon">📊</span>
                    <span className="admin-sidebar__text">Dashboard</span>
                </NavLink>

                <NavLink to="/administrador/leads" className={getLinkClass}>
                    <span className="admin-sidebar__icon">👥</span>
                    <span className="admin-sidebar__text">Gestión de Leads</span>
                </NavLink>

                <NavLink to="/administrador/users" className={getLinkClass}>
                    <span className="admin-sidebar__icon">🛡️</span>
                    <span className="admin-sidebar__text">Usuarios</span>
                </NavLink>

                <NavLink to="/administrador/asesores" className={getLinkClass}>
                    <span className="admin-sidebar__icon">👔</span>
                    <span className="admin-sidebar__text">Gestión Asesores</span>
                </NavLink>

            </nav>

            {/* Footer / Toggle */}
            <div className="admin-sidebar__footer">
                <button onClick={toggleCollapse} className="admin-sidebar__toggle-btn">
                    {collapsed ? '→' : '<< Colapsar'}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
