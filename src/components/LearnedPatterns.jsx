import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DataTable } from './DataTable';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const LearnedPatterns = ({ searchQuery }) => {
    const [patterns, setPatterns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'user_email', direction: 'asc' });

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('learned_patterns')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setPatterns(data);
        } catch (error) {
            console.error('Error fetching patterns:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Aggregate patterns by user_email
    const userAggregates = patterns.reduce((acc, pattern) => {
        const email = pattern.user_email || 'Unknown';
        if (!acc[email]) {
            acc[email] = { user_email: email, total_patterns: 0 };
        }
        acc[email].total_patterns += 1;
        return acc;
    }, {});

    const filteredUsers = Object.values(userAggregates).filter(user =>
        user.user_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    const userList = [...filteredUsers].sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';

        if (typeof aVal === 'string') {
            return sortConfig.direction === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }

        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={12} color="var(--text-muted)" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={12} color="var(--primary)" />
            : <ArrowDown size={12} color="var(--primary)" />;
    };

    const userColumns = [
        { header: 'User Email', key: 'user_email' },
        { header: 'Total Learned Patterns', key: 'total_patterns' },
    ];

    const patternColumns = [
        { header: 'Intent', key: 'intent' },
        {
            header: 'Confidence',
            key: 'confidence',
            render: (val) => `${(val * 100).toFixed(0)}%`
        },
        { header: 'Usage', key: 'usage_count' },
        { header: 'Field Type', key: 'field_type' },
        {
            header: 'First Seen',
            key: 'created_at',
            render: (val) => new Date(val).toLocaleDateString()
        },
    ];

    const userPatterns = selectedUser
        ? patterns.filter(p => p.user_email === selectedUser)
        : [];

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading patterns...</div>;

    return (
        <div className="fade-in">
            <div style={{
                display: 'grid',
                gridTemplateColumns: '400px 1fr',
                gap: '1.5rem',
                alignItems: 'start',
                overflow: 'hidden'
            }}>
                {/* Left side - User aggregates */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow)',
                    maxHeight: '70vh',
                    overflow: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>
                            Users ({userList.length})
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <button
                                onClick={() => handleSort('user_email')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.6rem',
                                    background: sortConfig.key === 'user_email' ? 'var(--primary-light)' : 'var(--bg-main)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Email <SortIcon column="user_email" />
                            </button>
                            <button
                                onClick={() => handleSort('total_patterns')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.6rem',
                                    background: sortConfig.key === 'total_patterns' ? 'var(--primary-light)' : 'var(--bg-main)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Count <SortIcon column="total_patterns" />
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-main)' }}>
                                    {userColumns.map((col, idx) => (
                                        <th key={idx} style={{
                                            padding: '1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: 'var(--text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {userList.map((user, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => setSelectedUser(user.user_email)}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            background: selectedUser === user.user_email ? 'var(--primary-light)' : 'transparent'
                                        }}
                                        className="table-row-hover"
                                    >
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                            {user.user_email}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '600' }}>
                                            {user.total_patterns}
                                        </td>
                                    </tr>
                                ))}
                                {userList.length === 0 && (
                                    <tr>
                                        <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right side - Pattern details */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow)',
                    maxHeight: '70vh',
                    overflow: 'auto'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                        {selectedUser ? `Patterns for ${selectedUser}` : 'Select a user to view patterns'}
                    </h3>
                    {selectedUser ? (
                        <DataTable data={userPatterns} columns={patternColumns} hideHeader={false} />
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Click on a user email from the left to view their learned patterns.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LearnedPatterns;
