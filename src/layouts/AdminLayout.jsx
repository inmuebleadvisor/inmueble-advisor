import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/AdminDashboard.css'; // Reusing/Refactoring existing styles or creating new ones

const AdminLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="admin-layout" style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: 'var(--bg-main)', // Using global theme var
            color: 'var(--text-main)'
        }}>
            <AdminSidebar collapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <div className="admin-layout__content" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <AdminHeader />
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    position: 'relative'
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
