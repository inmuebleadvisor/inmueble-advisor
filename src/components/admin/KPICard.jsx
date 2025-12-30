import React from 'react';
import '../../styles/AdminDashboard.css'; // Correct path from src/components/admin/

const KPICard = ({ title, value, subtext, icon, color = 'blue' }) => {
    // Mapping colors to classes or styles
    const colorMap = {
        blue: { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
        red: { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
        green: { border: '#10b981', bg: '#ecfdf5', text: '#047857' },
        yellow: { border: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
    };

    const theme = colorMap[color] || colorMap.blue;

    return (
        <div className="kpi-card" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: `1px solid var(--border-subtle)`,
            borderLeft: `4px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {value}
            </div>

            {subtext && (
                <div style={{ fontSize: '0.85rem', color: theme.text }}>
                    {subtext}
                </div>
            )}
        </div>
    );
};

export default KPICard;
