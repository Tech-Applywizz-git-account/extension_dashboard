import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DataTable } from './DataTable';
import {
    Users,
    Search,
    UserCheck,
    Briefcase,
    MessageSquare,
    Zap,
    BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

const atsPlatformIdentifiers = {
    Greenhouse: ["greenhouse", "grnh.se"],
    Lever: ["lever.co", "lever-ats"],
    Workday: ["myworkdayjobs", "workdayjobs", "wd1", "wd2", "wd3", "wd5"],
    iCIMS: ["icims"],
    Ashby: ["ashbyhq"],
    BambooHR: ["bamboohr"],
    ADP: ["adp"],
    SAPSuccessFactors: ["successfactors", "career2", "sfcareer"],
    SmartRecruiters: ["smartrecruiters"],
    Jobvite: ["jobvite"],
    Workable: ["workable"],
    Bullhorn: ["bullhorn", "bhstaffing"],
    ZohoRecruit: ["zohorecruit", "zoho recruit"],
    JazzHR: ["applytojob", "jazzhr", "jazz.co"],
    Pinpoint: ["pinpoint", "pinpointhq"],
    Recruitee: ["recruitee"],
    Manatal: ["manatal"]
};

const CAActivity = ({ searchQuery: globalSearchQuery }) => {
    const [caData, setCAData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCAs: 0,
        totalProfiles: 0,
        totalFeedbacks: 0,
        totalScans: 0
    });
    const [atsBreakdown, setAtsBreakdown] = useState([]);

    useEffect(() => {
        fetchCAData();
    }, []);

    useEffect(() => {
        filterAndAggregateData();
    }, [caData, globalSearchQuery]);

    const getAtsPlatform = (url) => {
        if (!url) return "Career portals and staffing agencies";
        const lowerUrl = url.toLowerCase();
        for (const [platform, identifiers] of Object.entries(atsPlatformIdentifiers)) {
            if (identifiers.some(id => lowerUrl.includes(id))) {
                return platform;
            }
        }
        return "Career portals and staffing agencies";
    };

    const fetchCAData = async () => {
        setIsLoading(true);
        try {
            const [profilesRes, feedbacksRes, analyticsRes] = await Promise.all([
                supabase.from('user_profiles').select('email, ca_name, ca_email, client_name, created_at'),
                supabase.from('feedbacks').select('email, id'),
                supabase.from('extension_analytics').select('user_email, id, url, total_questions, filled_success_count')
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (feedbacksRes.error) throw feedbacksRes.error;
            if (analyticsRes.error) throw analyticsRes.error;

            const profiles = profilesRes.data || [];
            const feedbacks = feedbacksRes.data || [];
            const analytics = analyticsRes.data || [];

            // Feedback and Analytics count by user email
            const feedbackCountByUser = feedbacks.reduce((acc, f) => {
                if (f.email) acc[f.email] = (acc[f.email] || 0) + 1;
                return acc;
            }, {});

            const analyticsByUser = analytics.reduce((acc, a) => {
                const email = a.user_email;
                if (email) {
                    if (!acc[email]) acc[email] = [];
                    acc[email].push(a);
                }
                return acc;
            }, {});

            // Group by CA Email
            const grouped = profiles.reduce((acc, curr) => {
                const caEmail = curr.ca_email || 'Unassigned';
                const caName = curr.ca_name || 'Unassigned';
                const userEmail = curr.email;

                if (!acc[caEmail]) {
                    acc[caEmail] = {
                        ca_email: caEmail,
                        ca_name: caName,
                        user_emails: new Set(),
                        profile_count: 0,
                        feedback_count: 0,
                        scan_count: 0,
                        client_names: [],
                        all_scans: [], // Store for dynamic ATS breakdown
                        last_activity: curr.created_at
                    };
                }

                acc[caEmail].profile_count += 1;
                if (userEmail) {
                    acc[caEmail].user_emails.add(userEmail);
                    acc[caEmail].feedback_count += (feedbackCountByUser[userEmail] || 0);
                    const userScans = analyticsByUser[userEmail] || [];
                    acc[caEmail].scan_count += userScans.length;
                    acc[caEmail].all_scans.push(...userScans);
                }

                if (curr.client_name) {
                    acc[caEmail].client_names.push(curr.client_name);
                }

                if (curr.created_at && (!acc[caEmail].last_activity || new Date(curr.created_at) > new Date(acc[caEmail].last_activity))) {
                    acc[caEmail].last_activity = curr.created_at;
                }

                return acc;
            }, {});

            const processed = Object.values(grouped).map(ca => ({
                ...ca,
                user_emails: Array.from(ca.user_emails),
                client_names_str: ca.client_names.join(', ')
            }));

            setCAData(processed);

            // Stats
            const totalCAs = Object.keys(grouped).filter(email => email !== 'Unassigned').length;
            const totalProfiles = processed.reduce((sum, ca) => sum + (ca.ca_email !== 'Unassigned' ? ca.profile_count : 0), 0);
            const totalFeedbacks = processed.reduce((sum, ca) => sum + (ca.ca_email !== 'Unassigned' ? ca.feedback_count : 0), 0);
            const totalScans = processed.reduce((sum, ca) => sum + (ca.ca_email !== 'Unassigned' ? ca.scan_count : 0), 0);

            setStats({ totalCAs, totalProfiles, totalFeedbacks, totalScans });

        } catch (error) {
            console.error('Error fetching CA data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAndAggregateData = () => {
        let result = [...caData];
        if (globalSearchQuery) {
            const query = globalSearchQuery.toLowerCase();
            result = result.filter(item =>
                item.ca_name.toLowerCase().includes(query) ||
                item.ca_email.toLowerCase().includes(query) ||
                item.client_names_str.toLowerCase().includes(query)
            );
        }
        setFilteredData(result);

        // Aggregate ATS breakdown based on filtered data
        const atsStats = {};
        result.forEach(ca => {
            ca.all_scans.forEach(scan => {
                const platform = getAtsPlatform(scan.url);
                if (!atsStats[platform]) {
                    atsStats[platform] = { count: 0, total_q: 0, success_q: 0 };
                }
                atsStats[platform].count += 1;
                atsStats[platform].total_q += (scan.total_questions || 0);
                atsStats[platform].success_q += (scan.filled_success_count || 0);
            });
        });

        const sortedAtsBreakdown = Object.entries(atsStats)
            .map(([name, data]) => {
                const successRate = data.total_q > 0 ? ((data.success_q / data.total_q) * 100).toFixed(1) : '0.0';
                return {
                    name,
                    value: data.count,
                    successRate: `${successRate}%`,
                    displayLabel: `${data.count} Scans (${successRate}% Success)`
                };
            })
            .sort((a, b) => b.value - a.value);

        setAtsBreakdown(sortedAtsBreakdown);
    };

    const columns = [
        {
            header: 'CA Name',
            key: 'ca_name',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: val === 'Unassigned' ? '#f3f4f6' : 'var(--primary-light)',
                        color: val === 'Unassigned' ? '#9ca3af' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '0.75rem'
                    }}>
                        {val[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600' }}>{val}</span>
                </div>
            )
        },
        { header: 'CA Email', key: 'ca_email' },
        {
            header: 'Profiles',
            key: 'profile_count',
            render: (val) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '1rem',
                    background: '#eff6ff',
                    color: '#3b82f6',
                    fontWeight: '600',
                    fontSize: '0.75rem'
                }}>
                    {val} Records
                </span>
            )
        },
        {
            header: 'Feedbacks',
            key: 'feedback_count',
            render: (val) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '1rem',
                    background: '#f5f3ff',
                    color: '#8b5cf6',
                    fontWeight: '600',
                    fontSize: '0.75rem'
                }}>
                    {val} Feedbacks
                </span>
            )
        },
        {
            header: 'Scans',
            key: 'scan_count',
            render: (val) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '1rem',
                    background: '#ecfdf5',
                    color: '#10b981',
                    fontWeight: '600',
                    fontSize: '0.75rem'
                }}>
                    {val} Scans
                </span>
            )
        },
        {
            header: 'Last Activity',
            key: 'last_activity',
            render: (val) => val ? format(new Date(val), 'MMM dd, yyyy') : '—'
        }
    ];

    const COLORS = ['#2563eb', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'];

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '600' }}>Loading CA activity...</div>
        </div>
    );

    return (
        <div className="fade-in">
            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={20} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Total CAs</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalCAs}</h3>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Profiles Managed</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalProfiles}</h3>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Total Feedbacks</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalFeedbacks}</h3>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Total Scans</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalScans}</h3>
                    </div>
                </div>
            </div>

            {/* ATS Analytics Graph */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: 'var(--shadow)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <BarChart3 size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>ATS Platform Breakdown</h3>
                </div>
                <div style={{ width: '100%', height: Math.max(300, atsBreakdown.length * 40) }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={atsBreakdown}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: '500' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--bg-main)' }}
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            >
                                <LabelList
                                    dataKey="displayLabel"
                                    position="right"
                                    style={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: '600' }}
                                    offset={10}
                                />
                                {atsBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>CA Activity Breakdown</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Metrics aggregated by CA email across profiles, feedbacks, and analytics</p>
                    </div>
                </div>

                <DataTable
                    data={filteredData}
                    columns={columns}
                    pageSize={10}
                />
            </div>
        </div>
    );
};

export default CAActivity;
