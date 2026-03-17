import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown, ChevronRight, User, Users } from 'lucide-react';

// ─── SQL Like matching helper ──────────────────────────────────────────────
// In SQL: % is zero or more characters, _ is exactly one character.
// These are ILIKE (case-insensitive).
function sqlLike(str, pattern) {
    if (!str || !pattern) return false;
    // Escape regex special characters except % and _
    let p = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // Replace SQL wildcards with Regex wildcards
    p = p.replace(/%/g, '.*').replace(/_/g, '.');
    const regex = new RegExp(`^${p}$`, 'i');
    return regex.test(str);
}

// ─── URL platform classifier (mirrors SQL ILIKE patterns) ───────────────────
function classifyUrl(url) {
    if (!url) return null;

    // Greenhouse patterns
    if (['%greenhouse%', '%gh_%', '%ghid%', '%grh_src%'].some(p => sqlLike(url, p))) {
        return 'Greenhouse';
    }
    // Lever patterns
    if (['%lever.co%', '%lever%', '%leverhire%'].some(p => sqlLike(url, p))) {
        return 'Lever';
    }
    // Ashby patterns
    if (['%ashby%', '%ashbyhq%'].some(p => sqlLike(url, p))) {
        return 'Ashby';
    }

    return null;
}

// ─── Colour for success percentage ──────────────────────────────────────────
function successColor(pct) {
    if (pct === null) return { color: 'var(--text-muted)', bg: 'transparent' };
    if (pct >= 80) return { color: '#10b981', bg: '#10b98118' };
    if (pct >= 50) return { color: '#f59e0b', bg: '#f59e0b18' };
    return { color: '#ef4444', bg: '#ef444418' };
}

function fmtMs(ms) {
    if (ms == null || ms === 0) return '—';
    return (ms / 1000).toFixed(2) + 's';
}

// ─── Per-row table ───────────────────────────────────────────────────────────
function PlatformTable({ records }) {
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedRecords = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            let aVal, bVal;

            switch (sortConfig.key) {
                case 'url':
                    aVal = (a.url || '').toLowerCase();
                    bVal = (b.url || '').toLowerCase();
                    break;
                case 'ca':
                    aVal = (a._caName || '').toLowerCase();
                    bVal = (b._caName || '').toLowerCase();
                    break;
                case 'scan':
                    aVal = a.scan_duration_ms || 0;
                    bVal = b.scan_duration_ms || 0;
                    break;
                case 'map':
                    aVal = a.mapping_duration_ms || 0;
                    bVal = b.mapping_duration_ms || 0;
                    break;
                case 'fill':
                    aVal = a.filling_duration_ms || 0;
                    bVal = b.filling_duration_ms || 0;
                    break;
                case 'total_time':
                    aVal = (a.scan_duration_ms || 0) + (a.mapping_duration_ms || 0) + (a.filling_duration_ms || 0);
                    bVal = (b.scan_duration_ms || 0) + (b.mapping_duration_ms || 0) + (b.filling_duration_ms || 0);
                    break;
                case 'total_qs':
                    aVal = a.total_questions || 0;
                    bVal = b.total_questions || 0;
                    break;
                case 'success':
                    aVal = a.filled_success_count || 0;
                    bVal = b.filled_success_count || 0;
                    break;
                case 'failed':
                    aVal = a.filled_failed_count || 0;
                    bVal = b.filled_failed_count || 0;
                    break;
                case 'pct':
                    const aTot = (a.filled_success_count || 0) + (a.filled_failed_count || 0);
                    const bTot = (b.filled_success_count || 0) + (b.filled_failed_count || 0);
                    aVal = aTot > 0 ? (a.filled_success_count / aTot) : -1;
                    bVal = bTot > 0 ? (b.filled_success_count / bTot) : -1;
                    break;
                case 'date':
                case 'created_at':
                    aVal = new Date(a.created_at).getTime();
                    bVal = new Date(b.created_at).getTime();
                    break;
                default:
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sorted = getSortedRecords(records);

    if (sorted.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No records found.
            </div>
        );
    }

    const thStyle = {
        padding: '0.65rem 0.85rem',
        textAlign: 'left',
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        background: 'var(--bg-card)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s',
        borderBottom: '1px solid var(--border)',
    };

    const SortIcon = ({ column }) => {
        const active = sortConfig.key === column;
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                opacity: active ? 1 : 0.3,
                transition: 'all 0.2s'
            }}>
                {active ? (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                ) : (
                    <ArrowUpDown size={12} />
                )}
            </span>
        );
    };

    return (
        <div style={{ overflow: 'auto', maxHeight: '65vh', borderRadius: '0 0 1rem 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.78rem' }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, cursor: 'default' }}>#</th>
                        <th style={thStyle} onClick={() => handleSort('url')}>
                            URL <SortIcon column="url" />
                        </th>
                        <th style={thStyle} onClick={() => handleSort('ca')}>
                            CA Name <SortIcon column="ca" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('scan')}>
                            Scan Time <SortIcon column="scan" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('map')}>
                            Map Time <SortIcon column="map" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('fill')}>
                            Fill Time <SortIcon column="fill" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('total_time')}>
                            Total Time <SortIcon column="total_time" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('total_qs')}>
                            Total Qs <SortIcon column="total_qs" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('success')}>
                            ✅ Success <SortIcon column="success" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('failed')}>
                            ❌ Failed <SortIcon column="failed" />
                        </th>
                        <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('pct')}>
                            Success % <SortIcon column="pct" />
                        </th>
                        <th style={thStyle} onClick={() => handleSort('created_at')}>
                            Date <SortIcon column="created_at" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((r, i) => {
                        const total = (r.filled_success_count || 0) + (r.filled_failed_count || 0);
                        const pct = total > 0
                            ? Math.round((r.filled_success_count / total) * 100)
                            : null;
                        const { color, bg } = successColor(pct);
                        const totalMs = (r.scan_duration_ms || 0) + (r.mapping_duration_ms || 0) + (r.filling_duration_ms || 0);

                        const tdStyle = {
                            padding: '0.6rem 0.85rem',
                            borderBottom: '1px solid var(--border)',
                        };

                        return (
                            <tr
                                key={r.id || i}
                                style={{ transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontWeight: '500' }}>
                                    {i + 1}
                                </td>
                                <td style={{ ...tdStyle, maxWidth: '300px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'var(--primary)',
                                                textDecoration: 'none',
                                                fontSize: '0.75rem',
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '220px',
                                            }}
                                            title={r.url}
                                        >
                                            {r.url}
                                        </a>
                                        <ExternalLink size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.3rem' }}>
                                        {r.user_name && (
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                                {r.user_name}
                                            </div>
                                        )}
                                        {r.user_email && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                {r.user_email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ ...tdStyle, color: 'var(--text-main)', fontWeight: '600' }}>
                                    {r._caName || 'Unassigned'}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {fmtMs(r.scan_duration_ms)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {fmtMs(r.mapping_duration_ms)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {fmtMs(r.filling_duration_ms)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {fmtMs(totalMs || r.total_process_time_ms)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600', color: 'var(--text-main)' }}>
                                    {r.total_questions ?? '—'}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={{
                                        background: '#10b98118',
                                        color: '#10b981',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '700',
                                        fontSize: '0.75rem',
                                    }}>
                                        {r.filled_success_count ?? 0}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={{
                                        background: '#ef444418',
                                        color: '#ef4444',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '700',
                                        fontSize: '0.75rem',
                                    }}>
                                        {r.filled_failed_count ?? 0}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    {pct !== null ? (
                                        <span style={{
                                            background: bg,
                                            color: color,
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '0.5rem',
                                            fontWeight: '700',
                                            fontSize: '0.75rem',
                                        }}>
                                            {pct}%
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                    )}
                                </td>
                                <td style={{ ...tdStyle, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                                    {new Date(r.created_at).toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Summary stat cards ──────────────────────────────────────────────────────
function SummaryCards({ records }) {
    if (records.length === 0) return null;

    const totalApps = records.length;
    const totalUsers = new Set(records.map(r => r.user_email)).size;
    const totalQ = records.reduce((a, r) => a + (r.total_questions || 0), 0);
    const totalSuccess = records.reduce((a, r) => a + (r.filled_success_count || 0), 0);
    const totalFailed = records.reduce((a, r) => a + (r.filled_failed_count || 0), 0);
    const totalDone = totalSuccess + totalFailed;
    const successPct = totalDone > 0 ? Math.round((totalSuccess / totalDone) * 100) : null;
    const avgScan = records.reduce((a, r) => a + (r.scan_duration_ms || 0), 0) / (totalApps || 1);
    const avgMap = records.reduce((a, r) => a + (r.mapping_duration_ms || 0), 0) / (totalApps || 1);
    const avgFill = records.reduce((a, r) => a + (r.filling_duration_ms || 0), 0) / (totalApps || 1);
    const avgTotal = avgScan + avgMap + avgFill;

    const { color: pctColor, bg: pctBg } = successColor(successPct);

    const cards = [
        { label: 'Applications', value: totalApps, color: '#2563eb' },
        { label: 'Active Users', value: totalUsers, color: '#ec4899' },
        { label: 'Total Qs', value: totalQ, color: '#6366f1' },
        { label: 'Success Qs', value: totalSuccess, color: '#10b981' },
        { label: 'Failed Qs', value: totalFailed, color: '#ef4444' },
        { label: 'Avg Scan', value: fmtMs(avgScan), color: '#8b5cf6' },
        { label: 'Avg Map', value: fmtMs(avgMap), color: '#f59e0b' },
        { label: 'Avg Fill', value: fmtMs(avgFill), color: '#06b6d4' },
        { label: 'Avg Total', value: fmtMs(avgTotal), color: '#0ea5e9' },
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem',
        }}>
            {cards.map(c => (
                <div key={c.label} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {c.label}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: c.color }}>
                        {c.value}
                    </span>
                </div>
            ))}
            {/* Success % card with dynamic colour */}
            <div style={{
                background: pctBg || 'var(--bg-card)',
                border: `1px solid ${pctColor}40`,
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
            }}>
                <span style={{ fontSize: '0.65rem', color: pctColor, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Success Rate
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: pctColor }}>
                    {successPct !== null ? `${successPct}%` : '—'}
                </span>
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────
const PLATFORMS = ['All', 'Greenhouse', 'Lever', 'Ashby'];

const PLATFORM_META = {
    Greenhouse: { emoji: '🌱', accent: '#10b981' },
    Lever: { emoji: '🔗', accent: '#6366f1' },
    Ashby: { emoji: '🏢', accent: '#f59e0b' },
    All: { emoji: '🗂️', accent: '#2563eb' },
};

const ATSPlatforms = ({ dateRange, customDates }) => {
    const [data, setData] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activePlatform, setActivePlatform] = useState('All');
    const [viewMode, setViewMode] = useState('all'); // 'all' or 'user'
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        fetchData();
    }, [dateRange, customDates]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let startDate = new Date();
            let endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            if (dateRange === 'Today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'Yesterday') {
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateRange === 'Last 7 Days') {
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'Last 30 Days') {
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'Custom Range' && customDates?.start && customDates?.end) {
                startDate = new Date(customDates.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(customDates.end);
                endDate.setHours(23, 59, 59, 999);
            } else {
                startDate.setDate(startDate.getDate() - 365);
                startDate.setHours(0, 0, 0, 0);
            }

            // Fetch both analytics and profiles in parallel
            const [analyticsRes, profilesRes] = await Promise.all([
                supabase
                    .from('extension_analytics')
                    .select('id, url, user_email, user_name, created_at, scan_duration_ms, mapping_duration_ms, filling_duration_ms, total_process_time_ms, total_questions, filled_success_count, filled_failed_count')
                    .or('url.ilike.%greenhouse%,url.ilike.%gh_%,url.ilike.%ghid%,url.ilike.%grh_src%,url.ilike.%lever.co%,url.ilike.%lever%,url.ilike.%leverhire%,url.ilike.%ashby%,url.ilike.%ashbyhq%')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(5000),
                supabase
                    .from('user_profiles')
                    .select('email, ca_name')
            ]);

            if (analyticsRes.error) throw analyticsRes.error;
            if (profilesRes.error) throw profilesRes.error;

            // Map profiles for quick lookup
            const profileMap = {};
            (profilesRes.data || []).forEach(p => {
                if (p.email) profileMap[p.email.toLowerCase()] = p.ca_name || 'Unassigned';
            });
            setProfiles(profileMap);

            // Keep only ATS rows and enrich with CA name
            const atsRows = (analyticsRes.data || [])
                .map(r => ({
                    ...r,
                    _platform: classifyUrl(r.url),
                    _caName: profileMap[(r.user_email || '').toLowerCase()] || 'Unassigned'
                }))
                .filter(r => r._platform !== null);

            setData(atsRows);
        } catch (err) {
            console.error('ATSPlatforms fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredData = activePlatform === 'All'
        ? data
        : data.filter(r => r._platform === activePlatform);

    // Grouping logic for 'By User' view
    const getGroupedData = () => {
        const groups = {};
        filteredData.forEach(r => {
            const ca = r._caName;
            const user = r.user_email || 'Unknown User';
            const userName = r.user_name || user;

            if (!groups[ca]) groups[ca] = { users: {}, totalApps: 0, successCount: 0, failedCount: 0 };
            if (!groups[ca].users[user]) groups[ca].users[user] = { name: userName, records: [], successCount: 0, failedCount: 0 };

            groups[ca].users[user].records.push(r);
            groups[ca].users[user].successCount += (r.filled_success_count || 0);
            groups[ca].users[user].failedCount += (r.filled_failed_count || 0);

            groups[ca].totalApps++;
            groups[ca].successCount += (r.filled_success_count || 0);
            groups[ca].failedCount += (r.filled_failed_count || 0);
        });
        return groups;
    };

    const countFor = (p) => p === 'All' ? data.length : data.filter(r => r._platform === p).length;

    const meta = PLATFORM_META[activePlatform];

    const groupedData = getGroupedData();

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                        🏢 ATS Platforms
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Greenhouse · Lever · Ashby — URL-based classification from analytics
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* View Toggle */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-main)',
                        padding: '0.25rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border)'
                    }}>
                        <button
                            onClick={() => setViewMode('all')}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: viewMode === 'all' ? 'white' : 'transparent',
                                color: viewMode === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                                boxShadow: viewMode === 'all' ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Users size={14} />
                            All
                        </button>
                        <button
                            onClick={() => setViewMode('user')}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: viewMode === 'user' ? 'white' : 'transparent',
                                color: viewMode === 'user' ? 'var(--primary)' : 'var(--text-muted)',
                                boxShadow: viewMode === 'user' ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <User size={14} />
                            By User
                            <span style={{
                                marginLeft: '0.2rem',
                                fontSize: '0.65rem',
                                opacity: 0.8
                            }}>
                                ({new Set(filteredData.map(r => r.user_email)).size})
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.65rem',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                        }}
                    >
                        <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Platform Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => {
                    const { emoji, accent } = PLATFORM_META[p];
                    const active = activePlatform === p;
                    return (
                        <button
                            key={p}
                            onClick={() => setActivePlatform(p)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1.1rem',
                                borderRadius: '2rem',
                                border: active ? `2px solid ${accent}` : '1px solid var(--border)',
                                background: active ? `${accent}15` : 'var(--bg-card)',
                                color: active ? accent : 'var(--text-muted)',
                                fontWeight: active ? '700' : '500',
                                fontSize: '0.83rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <span>{emoji}</span>
                            {p}
                            <span style={{
                                background: active ? accent : 'var(--bg-main)',
                                color: active ? 'white' : 'var(--text-muted)',
                                borderRadius: '1rem',
                                padding: '0.1rem 0.5rem',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                            }}>
                                {countFor(p)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="text-gradient" style={{ fontSize: '1rem', fontWeight: '600' }}>Loading ATS data…</div>
                </div>
            ) : (
                <>
                    {/* Summary cards for active platform/filter */}
                    <SummaryCards records={filteredData} />

                    {viewMode === 'all' ? (
                        /* Main table card - Flat View */
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '1rem',
                            boxShadow: 'var(--shadow)',
                            overflow: 'hidden',
                            border: `1px solid ${meta.accent}30`,
                        }}>
                            {/* Table header bar */}
                            <div style={{
                                padding: '1rem 1.25rem',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: `${meta.accent}08`,
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                        {meta.emoji} {activePlatform} Applications
                                    </h3>
                                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {/* Legend */}
                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem' }}>
                                    {[['#10b981', '≥80% green'], ['#f59e0b', '50–79% yellow'], ['#ef4444', '<50% red']].map(([c, lbl]) => (
                                        <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
                                            {lbl}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Table body populated via PlatformTable */}
                            <PlatformTable records={filteredData} />
                        </div>
                    ) : (
                        /* Grouped View */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries(groupedData)
                                .sort(([_, a], [__, b]) => {
                                    const aRatio = a.successCount + a.failedCount > 0 ? a.successCount / (a.successCount + a.failedCount) : 1;
                                    const bRatio = b.successCount + b.failedCount > 0 ? b.successCount / (b.successCount + b.failedCount) : 1;
                                    return aRatio - bRatio;
                                })
                                .map(([ca, caData]) => (
                                    <div key={ca} style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--border)',
                                        overflow: 'hidden'
                                    }}>
                                        <div
                                            onClick={() => toggleGroup(ca)}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                background: 'var(--bg-main)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <ChevronRight
                                                    size={18}
                                                    style={{
                                                        transform: expandedGroups[ca] ? 'rotate(90deg)' : 'none',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                />
                                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                    {ca}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    background: 'var(--primary-light)',
                                                    color: 'var(--primary)',
                                                    padding: '0.1rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    fontWeight: '700'
                                                }}>
                                                    {caData.totalApps} Apps
                                                </span>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    background: '#ec489915',
                                                    color: '#ec4899',
                                                    padding: '0.1rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    fontWeight: '700'
                                                }}>
                                                    {Object.keys(caData.users).length} Users
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                                Success Rate: <span style={{ color: '#10b981' }}>{caData.successCount + caData.failedCount > 0 ? Math.round((caData.successCount / (caData.successCount + caData.failedCount)) * 100) : 0}%</span>
                                            </div>
                                        </div>

                                        {expandedGroups[ca] && (
                                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                                {Object.entries(caData.users)
                                                    .sort(([_, a], [__, b]) => {
                                                        const aRatio = a.successCount + a.failedCount > 0 ? a.successCount / (a.successCount + a.failedCount) : 1;
                                                        const bRatio = b.successCount + b.failedCount > 0 ? b.successCount / (b.successCount + b.failedCount) : 1;
                                                        return aRatio - bRatio;
                                                    })
                                                    .map(([userEmail, userData]) => (
                                                        <div key={userEmail} style={{ borderBottom: '1px solid var(--border)', lastChild: { borderBottom: 'none' } }}>
                                                            <div
                                                                onClick={() => toggleGroup(`${ca}-${userEmail}`)}
                                                                style={{
                                                                    padding: '0.75rem 1.25rem 0.75rem 2.5rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    cursor: 'pointer',
                                                                    background: 'white'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <ChevronRight
                                                                        size={16}
                                                                        style={{
                                                                            transform: expandedGroups[`${ca}-${userEmail}`] ? 'rotate(90deg)' : 'none',
                                                                            transition: 'transform 0.2s'
                                                                        }}
                                                                    />
                                                                    <div>
                                                                        <div style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-main)' }}>{userData.name}</div>
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{userEmail}</div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                    {userData.records.length} applications · <span style={{ color: '#10b981', fontWeight: '700' }}>{userData.successCount + userData.failedCount > 0 ? Math.round((userData.successCount / (userData.successCount + userData.failedCount)) * 100) : 0}% Success</span>
                                                                </div>
                                                            </div>

                                                            {expandedGroups[`${ca}-${userEmail}`] && (
                                                                <div style={{ padding: '0 0.5rem 0.5rem 1rem', background: 'var(--bg-main)' }}>
                                                                    <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                                        <PlatformTable records={userData.records} searchQuery={searchQuery} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ATSPlatforms;
