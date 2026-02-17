import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DataTable } from './DataTable';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Search, UserPlus, Filter, ArrowUpDown } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const ActiveUsers = ({ searchQuery: globalSearchQuery, dateRange, customDates }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    useEffect(() => {
        fetchUsers();
    }, [dateRange, customDates]);

    useEffect(() => {
        filterAndSortUsers();
    }, [users, globalSearchQuery, sortConfig]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            let startDate = new Date();
            let endDate = new Date();

            if (dateRange === 'Custom Range' && customDates?.start && customDates?.end) {
                startDate = new Date(customDates.start);
                endDate = new Date(customDates.end);
                endDate.setHours(23, 59, 59, 999);
            } else {
                if (dateRange === 'Today') startDate.setHours(0, 0, 0, 0);
                else if (dateRange === 'Last 7 Days') startDate.setDate(startDate.getDate() - 7);
                else if (dateRange === 'Last 30 Days') startDate.setDate(startDate.getDate() - 30);
                else startDate.setDate(startDate.getDate() - 365); // All time or custom default
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*');

            console.log('User Profiles Data:', data);
            console.log('User Profiles Error:', error);

            if (error) throw error;

            const processedUsers = data
                .filter(user => {
                    if (dateRange === 'All Time' && !customDates?.start) return true;
                    if (!user.updated_at) return false;
                    const userDate = new Date(user.updated_at);
                    return userDate >= startDate && userDate <= endDate;
                })
                .map(user => {
                    const pData = user.profile_data || {};
                    // Handle camelCase firstName/lastName from profile_data
                    const firstName = pData.firstName || pData.first_name || '';
                    const lastName = pData.lastName || pData.last_name || pData.lastname || '';
                    return {
                        email: user.email,
                        name: `${firstName} ${lastName}`.trim() || 'No Name Provided',
                        firstName,
                        lastName,
                        createdAt: user.updated_at,
                        ...pData
                    };
                });

            console.log('Processed Users Count:', processedUsers.length);
            setUsers(processedUsers);
            prepareChartData(processedUsers, dateRange, startDate, endDate);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const prepareChartData = (userData, range, start, end) => {
        let daysToPlan = 7;
        const now = new Date();

        if (range === 'Today') daysToPlan = 1;
        else if (range === 'Last 30 Days') daysToPlan = 30;
        else if (range === 'All Time') daysToPlan = 90;
        else if (range === 'Custom Range' && start && end) {
            daysToPlan = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (daysToPlan <= 0) daysToPlan = 1;
        }

        const dateList = Array.from({ length: daysToPlan }, (_, i) => {
            const date = subDays(range === 'Custom Range' ? end : now, i);
            return format(date, 'MMM dd');
        }).reverse();

        const dataCounts = userData.reduce((acc, user) => {
            const dateStr = format(new Date(user.createdAt), 'MMM dd');
            acc[dateStr] = (acc[dateStr] || 0) + 1;
            return acc;
        }, {});

        const chartPoints = dateList.map(date => ({
            name: date,
            users: dataCounts[date] || 0
        }));

        setChartData(chartPoints);
    };

    const filterAndSortUsers = () => {
        let result = [...users];

        // Global Search
        if (globalSearchQuery) {
            const query = globalSearchQuery.toLowerCase();
            result = result.filter(user =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            );
        }

        // Sorting
        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'createdAt') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredUsers(result);
    };

    const toggleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const columns = [
        {
            header: (
                <div onClick={() => toggleSort('name')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Name <ArrowUpDown size={14} />
                </div>
            ),
            key: 'name'
        },
        {
            header: (
                <div onClick={() => toggleSort('email')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Email <ArrowUpDown size={14} />
                </div>
            ),
            key: 'email'
        },
        {
            header: (
                <div onClick={() => toggleSort('createdAt')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Joined <ArrowUpDown size={14} />
                </div>
            ),
            key: 'createdAt',
            render: (val) => format(new Date(val), 'MMM dd, yyyy HH:mm')
        },
    ];

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</div>;

    return (
        <div className="fade-in">
            {/* Chart Section */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: 'var(--shadow)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>User Sign-ups Trend</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Overview of user activity for {dateRange.toLowerCase()}</p>
                    </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="users"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Section */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: 'var(--shadow)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>User Directory</h3>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            borderRadius: '2rem',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}>
                            {filteredUsers.length} Users
                        </span>
                    </div>
                </div>

                <DataTable
                    data={filteredUsers}
                    columns={columns}
                    pageSize={10}
                />
            </div>
        </div>
    );
};

export default ActiveUsers;
