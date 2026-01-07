import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/AdminDashboard.css'; // Reusing/Refactoring existing styles or creating new ones

const AdminLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="admin-layout">
            <AdminSidebar
                collapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className="admin-layout__content">
                <AdminHeader />
                <main className="admin-layout__main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
