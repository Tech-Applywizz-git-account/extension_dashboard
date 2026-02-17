import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// StatCard Component
export const StatCard = ({ title, value, change, icon, color }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>{title}</span>
            <div style={{ color: color, background: `${color}15`, padding: '0.5rem', borderRadius: '0.5rem' }}>
                {icon}
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{value}</h3>
            <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: change.startsWith('+') ? 'var(--success)' : 'var(--error)'
            }}>
                {change}
            </span>
        </div>
    </div>
);

// Vertical Bar Chart Component
export const MetricBarChart = ({ data }) => (
    <div className="card" style={{ height: '350px' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600' }}>Daily Scan Activity</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                    cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="scans" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

// Pie Chart Component
export const PatternPieChart = ({ data }) => {
    const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    return (
        <div className="card" style={{ height: '350px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600' }}>Questions by Type</h3>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// Horizontal Bar Chart
export const SuccessRateBarChart = ({ data }) => (
    <div className="card" style={{ height: '350px' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600' }}>Success Rate by URL</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={80} />
                <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                    cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="success" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);
