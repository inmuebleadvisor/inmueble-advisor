import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Users, UserCheck, Briefcase } from 'lucide-react';

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
                    <BarChart2 className="admin-sidebar__icon" />
                    <span className="admin-sidebar__text">Analíticas</span>
                </NavLink>

                <NavLink to="/administrador/leads" className={getLinkClass}>
                    <Users className="admin-sidebar__icon" />
                    <span className="admin-sidebar__text">Gestión de Leads</span>
                </NavLink>

                <NavLink to="/administrador/users" className={getLinkClass}>
                    <UserCheck className="admin-sidebar__icon" />
                    <span className="admin-sidebar__text">Usuarios</span>
                </NavLink>

                <NavLink to="/administrador/asesores" className={getLinkClass}>
                    <Briefcase className="admin-sidebar__icon" />
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
