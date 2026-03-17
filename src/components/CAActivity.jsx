// import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { DataTable } from './DataTable';
// import {
//     Users,
//     Search,
//     UserCheck,
//     Briefcase,
//     MessageSquare,
//     Zap,
//     BarChart3
// } from 'lucide-react';
// import { format, subDays } from 'date-fns';
// import { X, Copy, Check, Users as UsersIcon } from 'lucide-react';
// import {
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     ResponsiveContainer,
//     Cell,
//     LabelList,
//     AreaChart,
//     Area
// } from 'recharts';

// const atsPlatformIdentifiers = {
//     Greenhouse: ["greenhouse", "grnh.se"],
//     Lever: ["lever.co", "lever-ats"],
//     Workday: ["myworkdayjobs", "workdayjobs", "wd1", "wd2", "wd3", "wd5"],
//     iCIMS: ["icims"],
//     Ashby: ["ashbyhq"],
//     BambooHR: ["bamboohr"],
//     ADP: ["adp"],
//     SAPSuccessFactors: ["successfactors", "career2", "sfcareer"],
//     SmartRecruiters: ["smartrecruiters"],
//     Jobvite: ["jobvite"],
//     Workable: ["workable"],
//     Bullhorn: ["bullhorn", "bhstaffing"],
//     ZohoRecruit: ["zohorecruit", "zoho recruit"],
//     JazzHR: ["applytojob", "jazzhr", "jazz.co"],
//     Pinpoint: ["pinpoint", "pinpointhq"],
//     Recruitee: ["recruitee"],
//     Manatal: ["manatal"]
// };

// const CAActivity = ({ searchQuery: globalSearchQuery, dateRange, customDates }) => {
//     const [caData, setCAData] = useState([]);
//     const [filteredData, setFilteredData] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [stats, setStats] = useState({
//         totalCAs: 0,
//         totalProfiles: 0,
//         totalFeedbacks: 0,
//         totalScans: 0
//     });
//     const [atsBreakdown, setAtsBreakdown] = useState([]);
//     const [chartData, setChartData] = useState([]);
//     const [copySuccess, setCopySuccess] = useState(null); // Used for individual copy feedback now

//     useEffect(() => {
//         fetchCAData();
//     }, [dateRange, customDates]);

//     useEffect(() => {
//         filterAndAggregateData();
//     }, [caData, globalSearchQuery]);

//     const getAtsPlatform = (url) => {
//         if (!url) return "Career portals and staffing agencies";
//         const lowerUrl = url.toLowerCase();
//         for (const [platform, identifiers] of Object.entries(atsPlatformIdentifiers)) {
//             if (identifiers.some(id => lowerUrl.includes(id))) {
//                 return platform;
//             }
//         }
//         return "Career portals and staffing agencies";
//     };

//     const fetchCAData = async () => {
//         setIsLoading(true);
//         try {
//             // Calculate date range start
//             let startDate = new Date(0); // All time default
//             let endDate = new Date();

//             if (dateRange === 'Today') {
//                 startDate = new Date();
//                 startDate.setHours(0, 0, 0, 0);
//                 endDate = new Date();
//                 endDate.setHours(23, 59, 59, 999);
//             } else if (dateRange === 'Last 7 Days') {
//                 startDate = new Date();
//                 startDate.setDate(startDate.getDate() - 7);
//                 startDate.setHours(0, 0, 0, 0);
//             } else if (dateRange === 'Last 30 Days') {
//                 startDate = new Date();
//                 startDate.setDate(startDate.getDate() - 30);
//                 startDate.setHours(0, 0, 0, 0);
//             } else if (dateRange === 'Last 90 Days') {
//                 startDate = new Date();
//                 startDate.setDate(startDate.getDate() - 90);
//                 startDate.setHours(0, 0, 0, 0);
//             } else if (dateRange === 'Custom Range' && customDates?.start && customDates?.end) {
//                 startDate = new Date(customDates.start);
//                 startDate.setHours(0, 0, 0, 0);
//                 endDate = new Date(customDates.end);
//                 endDate.setHours(23, 59, 59, 999);
//             }

//             const startIso = startDate.toISOString();
//             const endIso = endDate.toISOString();

//             // Fetch all required data
//             // We fetch ALL profiles to know assignments
//             const [profilesRes, feedbacksRes, analyticsRes] = await Promise.all([
//                 supabase.from('user_profiles').select('email, ca_name, ca_email, client_name, created_at'),
//                 supabase.from('feedbacks')
//                     .select('email, id, created_at')
//                     .gte('created_at', startIso)
//                     .lte('created_at', endIso),
//                 supabase.from('extension_analytics')
//                     .select('user_email, id, url, total_questions, filled_success_count, created_at')
//                     .gte('created_at', startIso)
//                     .lte('created_at', endIso)
//             ]);

//             if (profilesRes.error) throw profilesRes.error;
//             if (feedbacksRes.error) throw feedbacksRes.error;
//             if (analyticsRes.error) throw analyticsRes.error;

//             const profiles = profilesRes.data || [];
//             const feedbacks = feedbacksRes.data || [];
//             const analytics = analyticsRes.data || [];

//             // 1. Create a mapping of User Email -> CA Info (using all profiles)
//             const emailToCA = {};
//             profiles.forEach(p => {
//                 if (p.email) {
//                     emailToCA[p.email] = {
//                         ca_email: p.ca_email || 'Unassigned',
//                         ca_name: p.ca_name || 'Unassigned'
//                     };
//                 }
//             });

//             // 2. Initialize grouped data with all CAs
//             const grouped = {};

//             // Add known CAs from profiles
//             profiles.forEach(p => {
//                 const caEmail = p.ca_email || 'Unassigned';
//                 const caName = p.ca_name || 'Unassigned';

//                 if (!grouped[caEmail]) {
//                     grouped[caEmail] = {
//                         ca_email: caEmail,
//                         ca_name: caName,
//                         profile_all_time_emails: new Set(),
//                         active_profiles_in_range: new Set(), // Track unique users with activity
//                         profile_count: 0,
//                         feedback_count: 0,
//                         scan_count: 0,
//                         client_names: new Set(),
//                         all_scans: [],
//                         last_activity: null
//                     };
//                 }

//                 if (p.email) grouped[caEmail].profile_all_time_emails.add(p.email);
//                 if (p.client_name) grouped[caEmail].client_names.add(p.client_name);

//                 // Initial last_activity from profile creation (if we want that as activity)
//                 if (p.created_at && (!grouped[caEmail].last_activity || new Date(p.created_at) > new Date(grouped[caEmail].last_activity))) {
//                     // Only count profile creation as activity if it's in the range
//                     const pDate = new Date(p.created_at);
//                     if (pDate >= startDate && pDate <= endDate) {
//                         grouped[caEmail].last_activity = p.created_at;
//                         if (p.email) grouped[caEmail].active_profiles_in_range.add(p.email);
//                     }
//                 }
//             });

//             // Always ensure "Unassigned" exists
//             if (!grouped['Unassigned']) {
//                 grouped['Unassigned'] = {
//                     ca_email: 'Unassigned',
//                     ca_name: 'Unassigned',
//                     profile_all_time_emails: new Set(),
//                     active_profiles_in_range: new Set(),
//                     profile_count: 0,
//                     feedback_count: 0,
//                     scan_count: 0,
//                     client_names: new Set(),
//                     all_scans: [],
//                     last_activity: null
//                 };
//             }

//             // 3. attribute activity (feedbacks/scans) to CAs
//             feedbacks.forEach(f => {
//                 const caInfo = emailToCA[f.email] || { ca_email: 'Unassigned', ca_name: 'Unassigned' };
//                 const caEmail = caInfo.ca_email;

//                 if (grouped[caEmail]) {
//                     grouped[caEmail].feedback_count += 1;
//                     if (f.email) grouped[caEmail].active_profiles_in_range.add(f.email);
//                     if (f.created_at && (!grouped[caEmail].last_activity || new Date(f.created_at) > new Date(grouped[caEmail].last_activity))) {
//                         grouped[caEmail].last_activity = f.created_at;
//                     }
//                 }
//             });

//             analytics.forEach(a => {
//                 const caInfo = emailToCA[a.user_email] || { ca_email: 'Unassigned', ca_name: 'Unassigned' };
//                 const caEmail = caInfo.ca_email;

//                 if (grouped[caEmail]) {
//                     grouped[caEmail].scan_count += 1;
//                     if (a.user_email) grouped[caEmail].active_profiles_in_range.add(a.user_email);
//                     grouped[caEmail].all_scans.push(a);
//                     if (a.created_at && (!grouped[caEmail].last_activity || new Date(a.created_at) > new Date(grouped[caEmail].last_activity))) {
//                         grouped[caEmail].last_activity = a.created_at;
//                     }
//                 }
//             });

//             // Convert active_profiles_in_range size to profile_count
//             const processed = Object.values(grouped).map(ca => ({
//                 ...ca,
//                 profile_count: ca.active_profiles_in_range.size,
//                 client_names_str: Array.from(ca.client_names).join(', ')
//             }));

//             setCAData(processed);
//             prepareChartData(profiles, feedbacks, analytics, dateRange, startDate, endDate);

//             // Stats (Summing up for the cards)
//             const totalCAs = Object.keys(grouped).filter(email => email !== 'Unassigned').length;

//             // For total profiles in range, we should count unique emails across ALL CAs (including Unassigned)
//             const allActiveEmails = new Set();
//             processed.forEach(ca => {
//                 ca.active_profiles_in_range.forEach(email => allActiveEmails.add(email));
//             });

//             const totalProfiles = allActiveEmails.size;
//             const totalFeedbacks = processed.reduce((sum, ca) => sum + (ca.feedback_count || 0), 0);
//             const totalScans = processed.reduce((sum, ca) => sum + (ca.scan_count || 0), 0);

//             setStats({ totalCAs, totalProfiles, totalFeedbacks, totalScans });

//         } catch (error) {
//             console.error('Error fetching CA data:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const prepareChartData = (profiles, feedbacks, analytics, range, start, end) => {
//         let daysToPlan = 7;
//         const now = new Date();

//         if (range === 'Today') daysToPlan = 1;
//         else if (range === 'Last 30 Days') daysToPlan = 30;
//         else if (range === 'Last 90 Days') daysToPlan = 90;
//         else if (range === 'All Time') daysToPlan = 90; // Default to 90 for all-time view
//         else if (range === 'Custom Range' && start && end) {
//             daysToPlan = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
//             if (daysToPlan <= 0) daysToPlan = 1;
//         }

//         const dateList = Array.from({ length: daysToPlan }, (_, i) => {
//             const date = subDays(range === 'Custom Range' ? end : now, i);
//             return format(date, 'MMM dd');
//         }).reverse();

//         const activityCounts = {};

//         profiles.forEach(p => {
//             const dateStr = format(new Date(p.created_at), 'MMM dd');
//             if (dateList.includes(dateStr)) {
//                 if (!activityCounts[dateStr]) activityCounts[dateStr] = { scans: 0, feedbacks: 0, profiles: 0 };
//                 activityCounts[dateStr].profiles += 1;
//             }
//         });

//         feedbacks.forEach(f => {
//             const dateStr = format(new Date(f.created_at), 'MMM dd');
//             if (dateList.includes(dateStr)) {
//                 if (!activityCounts[dateStr]) activityCounts[dateStr] = { scans: 0, feedbacks: 0, profiles: 0 };
//                 activityCounts[dateStr].feedbacks += 1;
//             }
//         });

//         analytics.forEach(a => {
//             const dateStr = format(new Date(a.created_at), 'MMM dd');
//             if (dateList.includes(dateStr)) {
//                 if (!activityCounts[dateStr]) activityCounts[dateStr] = { scans: 0, feedbacks: 0, profiles: 0 };
//                 activityCounts[dateStr].scans += 1;
//             }
//         });

//         const chartPoints = dateList.map(date => ({
//             name: date,
//             scans: activityCounts[date]?.scans || 0,
//             feedbacks: activityCounts[date]?.feedbacks || 0,
//             profiles: activityCounts[date]?.profiles || 0
//         }));

//         setChartData(chartPoints);
//     };

//     const filterAndAggregateData = () => {
//         let result = [...caData];
//         if (globalSearchQuery) {
//             const query = globalSearchQuery.toLowerCase();
//             result = result.filter(item =>
//                 item.ca_name.toLowerCase().includes(query) ||
//                 item.ca_email.toLowerCase().includes(query) ||
//                 item.client_names_str.toLowerCase().includes(query)
//             );
//         }
//         setFilteredData(result);

//         // Aggregate ATS breakdown based on filtered data
//         const atsStats = {};
//         result.forEach(ca => {
//             ca.all_scans.forEach(scan => {
//                 const platform = getAtsPlatform(scan.url);
//                 if (!atsStats[platform]) {
//                     atsStats[platform] = { count: 0, total_q: 0, success_q: 0 };
//                 }
//                 atsStats[platform].count += 1;
//                 atsStats[platform].total_q += (scan.total_questions || 0);
//                 atsStats[platform].success_q += (scan.filled_success_count || 0);
//             });
//         });

//         const sortedAtsBreakdown = Object.entries(atsStats)
//             .map(([name, data]) => {
//                 const successRate = data.total_q > 0 ? ((data.success_q / data.total_q) * 100).toFixed(1) : '0.0';
//                 return {
//                     name,
//                     value: data.count,
//                     successRate: `${successRate}%`,
//                     displayLabel: `${data.count} Scans (${successRate}% Success)`
//                 };
//             })
//             .sort((a, b) => b.value - a.value);

//         setAtsBreakdown(sortedAtsBreakdown);
//     };

//     const columns = [
//         {
//             header: 'S.No',
//             key: 's_no',
//             render: (_, __, idx) => <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</span>
//         },
//         {
//             header: 'CA Name',
//             key: 'ca_name',
//             render: (val) => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//                     <div style={{
//                         width: '32px',
//                         height: '32px',
//                         borderRadius: '50%',
//                         background: val === 'Unassigned' ? '#f3f4f6' : 'var(--primary-light)',
//                         color: val === 'Unassigned' ? '#9ca3af' : 'var(--primary)',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         fontWeight: '600',
//                         fontSize: '0.75rem'
//                     }}>
//                         {val[0].toUpperCase()}
//                     </div>
//                     <span style={{ fontWeight: '600' }}>{val}</span>
//                 </div>
//             )
//         },
//         { header: 'CA Email', key: 'ca_email' },
//         {
//             header: 'Active Profiles',
//             key: 'profile_count',
//             render: (val) => (
//                 <span style={{
//                     padding: '0.25rem 0.6rem',
//                     borderRadius: '1rem',
//                     background: '#eff6ff',
//                     color: '#3b82f6',
//                     fontWeight: '600',
//                     fontSize: '0.75rem'
//                 }}>
//                     {val} Profiles used
//                 </span>
//             )
//         },
//         {
//             header: 'Feedbacks',
//             key: 'feedback_count',
//             render: (val) => (
//                 <span style={{
//                     padding: '0.25rem 0.6rem',
//                     borderRadius: '1rem',
//                     background: '#f5f3ff',
//                     color: '#8b5cf6',
//                     fontWeight: '600',
//                     fontSize: '0.75rem'
//                 }}>
//                     {val} Feedbacks
//                 </span>
//             )
//         },
//         {
//             header: 'Scans',
//             key: 'scan_count',
//             render: (val) => (
//                 <span style={{
//                     padding: '0.25rem 0.6rem',
//                     borderRadius: '1rem',
//                     background: '#ecfdf5',
//                     color: '#10b981',
//                     fontWeight: '600',
//                     fontSize: '0.75rem'
//                 }}>
//                     {val} Scans
//                 </span>
//             )
//         },
//         {
//             header: 'Last Activity',
//             key: 'last_activity',
//             render: (val) => val ? format(new Date(val), 'MMM dd, yyyy') : '—'
//         }
//     ];

//     const COLORS = ['#2563eb', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'];

//     const handleCopyEmails = (emails) => {
//         navigator.clipboard.writeText(emails.join('\n'));
//         setCopySuccess('all');
//         setTimeout(() => setCopySuccess(null), 2000);
//     };

//     const renderExpandableRow = (ca) => {
//         const emails = Array.from(ca.profile_all_time_emails || []);

//         return (
//             <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//                         <div style={{
//                             width: '32px',
//                             height: '32px',
//                             borderRadius: '0.5rem',
//                             background: 'var(--primary-light)',
//                             color: 'var(--primary)',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center'
//                         }}>
//                             <UsersIcon size={16} />
//                         </div>
//                         <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
//                             Assigned User Profiles ({emails.length})
//                         </h4>
//                     </div>
//                     {emails.length > 0 && (
//                         <button
//                             onClick={() => handleCopyEmails(emails)}
//                             style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '0.4rem',
//                                 padding: '0.4rem 0.8rem',
//                                 borderRadius: '0.5rem',
//                                 fontSize: '0.75rem',
//                                 fontWeight: '600',
//                                 background: copySuccess === 'all' ? '#10b981' : 'var(--primary-light)',
//                                 color: copySuccess === 'all' ? 'white' : 'var(--primary)',
//                                 border: 'none',
//                                 cursor: 'pointer',
//                                 transition: 'all 0.2s'
//                             }}
//                         >
//                             {copySuccess === 'all' ? <Check size={14} /> : <Copy size={14} />}
//                             {copySuccess === 'all' ? 'Copied!' : 'Copy All'}
//                         </button>
//                     )}
//                 </div>

//                 {emails.length > 0 ? (
//                     <div style={{
//                         display: 'grid',
//                         gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
//                         gap: '0.75rem'
//                     }}>
//                         {emails.map((email, idx) => (
//                             <div key={idx} style={{
//                                 padding: '0.75rem 1rem',
//                                 background: 'white',
//                                 borderRadius: '0.75rem',
//                                 fontSize: '0.875rem',
//                                 color: 'var(--text-main)',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'space-between',
//                                 border: '1px solid var(--border)',
//                                 boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
//                             }}>
//                                 <span style={{ fontWeight: '500' }}>{email}</span>
//                                 <button
//                                     onClick={() => {
//                                         navigator.clipboard.writeText(email);
//                                         setCopySuccess(email);
//                                         setTimeout(() => setCopySuccess(null), 2000);
//                                     }}
//                                     style={{
//                                         background: 'transparent',
//                                         border: 'none',
//                                         color: copySuccess === email ? '#10b981' : 'var(--text-muted)',
//                                         cursor: 'pointer',
//                                         transition: 'all 0.2s'
//                                     }}
//                                     title="Copy email"
//                                 >
//                                     {copySuccess === email ? <Check size={14} /> : <Copy size={14} />}
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', background: 'white', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
//                         No profiles found for this CA.
//                     </div>
//                 )}
//                 <style>{`
//                     @keyframes fadeIn {
//                         from { opacity: 0; transform: translateY(-10px); }
//                         to { opacity: 1; transform: translateY(0); }
//                     }
//                 `}</style>
//             </div>
//         );
//     };

//     if (isLoading) return (
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
//             <div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '600' }}>Loading CA activity...</div>
//         </div>
//     );

//     return (
//         <div className="fade-in">
//             {/* Stats Grid */}
//             <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
//                 gap: '1.5rem',
//                 marginBottom: '2rem'
//             }}>
//                 <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
//                     <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <UserCheck size={20} />
//                     </div>
//                     <div>
//                         <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Total CAs</p>
//                         <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalCAs}</h3>
//                     </div>
//                 </div>
//                 <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
//                     <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <Briefcase size={20} />
//                     </div>
//                     <div>
//                         <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Profiles Managed</p>
//                         <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalProfiles}</h3>
//                     </div>
//                 </div>
//                 <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
//                     <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <MessageSquare size={20} />
//                     </div>
//                     <div>
//                         <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Total Feedbacks</p>
//                         <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalFeedbacks}</h3>
//                     </div>
//                 </div>
//                 <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
//                     <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <Zap size={20} />
//                     </div>
//                     <div>
//                         <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>Total Scans</p>
//                         <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{stats.totalScans}</h3>
//                     </div>
//                 </div>
//             </div>

//             {/* Activity Trend Chart */}
//             <div style={{
//                 background: 'var(--bg-card)',
//                 padding: '1.5rem',
//                 borderRadius: '1rem',
//                 boxShadow: 'var(--shadow)',
//                 marginBottom: '2rem'
//             }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//                         <BarChart3 size={20} color="var(--primary)" />
//                         <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>Activity Trend</h3>
//                     </div>
//                 </div>
//                 <div style={{ width: '100%', height: 300 }}>
//                     <ResponsiveContainer>
//                         <AreaChart data={chartData}>
//                             <defs>
//                                 <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
//                                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
//                                     <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
//                                 </linearGradient>
//                                 <linearGradient id="colorFeedbacks" x1="0" y1="0" x2="0" y2="1">
//                                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
//                                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
//                                 </linearGradient>
//                                 <linearGradient id="colorProfiles" x1="0" y1="0" x2="0" y2="1">
//                                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
//                                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
//                                 </linearGradient>
//                             </defs>
//                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
//                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
//                             <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
//                             <Tooltip
//                                 contentStyle={{
//                                     background: 'var(--bg-card)',
//                                     border: '1px solid var(--border)',
//                                     borderRadius: '0.5rem',
//                                     boxShadow: 'var(--shadow-md)'
//                                 }}
//                             />
//                             <Area
//                                 type="monotone"
//                                 dataKey="scans"
//                                 stroke="#10b981"
//                                 strokeWidth={2}
//                                 fillOpacity={1}
//                                 fill="url(#colorScans)"
//                                 name="Scans"
//                             />
//                             <Area
//                                 type="monotone"
//                                 dataKey="feedbacks"
//                                 stroke="#8b5cf6"
//                                 strokeWidth={2}
//                                 fillOpacity={1}
//                                 fill="url(#colorFeedbacks)"
//                                 name="Feedbacks"
//                             />
//                             <Area
//                                 type="monotone"
//                                 dataKey="profiles"
//                                 stroke="#3b82f6"
//                                 strokeWidth={2}
//                                 fillOpacity={1}
//                                 fill="url(#colorProfiles)"
//                                 name="Profiles"
//                             />
//                         </AreaChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>

//             {/* ATS Analytics Graph */}
//             <div style={{
//                 background: 'var(--bg-card)',
//                 padding: '1.5rem',
//                 borderRadius: '1rem',
//                 boxShadow: 'var(--shadow)',
//                 marginBottom: '2rem'
//             }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
//                     <BarChart3 size={20} color="var(--primary)" />
//                     <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>ATS Platform Breakdown</h3>
//                 </div>
//                 <div style={{ width: '100%', height: Math.max(300, atsBreakdown.length * 40) }}>
//                     <ResponsiveContainer>
//                         <BarChart
//                             data={atsBreakdown}
//                             layout="vertical"
//                             margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
//                         >
//                             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
//                             <XAxis type="number" hide />
//                             <YAxis
//                                 type="category"
//                                 dataKey="name"
//                                 width={120}
//                                 axisLine={false}
//                                 tickLine={false}
//                                 tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: '500' }}
//                             />
//                             <Tooltip
//                                 cursor={{ fill: 'var(--bg-main)' }}
//                                 contentStyle={{
//                                     background: 'var(--bg-card)',
//                                     border: '1px solid var(--border)',
//                                     borderRadius: '0.5rem',
//                                     boxShadow: 'var(--shadow-md)'
//                                 }}
//                             />
//                             <Bar
//                                 dataKey="value"
//                                 radius={[0, 4, 4, 0]}
//                                 barSize={20}
//                             >
//                                 <LabelList
//                                     dataKey="displayLabel"
//                                     position="right"
//                                     style={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: '600' }}
//                                     offset={10}
//                                 />
//                                 {atsBreakdown.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                             </Bar>
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>

//             {/* Table Section */}
//             <div style={{
//                 background: 'var(--bg-card)',
//                 padding: '1.5rem',
//                 borderRadius: '1rem',
//                 boxShadow: 'var(--shadow)'
//             }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
//                     <div>
//                         <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>CA Activity Breakdown</h3>
//                         <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Metrics aggregated by CA email across profiles, feedbacks, and analytics</p>
//                     </div>
//                 </div>

//                 <DataTable
//                     data={filteredData}
//                     columns={columns}
//                     pageSize={10}
//                     rowKey="ca_email"
//                     renderExpandable={renderExpandableRow}
//                 />
//             </div>
//         </div>
//     );
// };

// export default CAActivity;







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
import { format, subDays } from 'date-fns';
import { X, Copy, Check, Users as UsersIcon } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
    AreaChart,
    Area
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

const CAActivity = ({ searchQuery: globalSearchQuery, dateRange, customDates }) => {
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
    const [chartData, setChartData] = useState([]);
    const [copySuccess, setCopySuccess] = useState(null); // Used for individual copy feedback now

    useEffect(() => {
        fetchCAData();
    }, [dateRange, customDates]);

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
            // Calculate date range start
            let startDate = new Date(0); // All time default
            let endDate = new Date();

            if (dateRange === 'Today') {
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
            } else if (dateRange === 'Yesterday') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setDate(endDate.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateRange === 'Last 7 Days') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'Last 30 Days') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'Last 90 Days') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 90);
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'Custom Range' && customDates?.start && customDates?.end) {
                startDate = new Date(customDates.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(customDates.end);
                endDate.setHours(23, 59, 59, 999);
            }

            const startIso = startDate.toISOString();
            const endIso = endDate.toISOString();

            // Fetch all required data
            // We fetch ALL profiles to know assignments
            const [profilesRes, feedbacksRes, analyticsRes] = await Promise.all([
                supabase.from('user_profiles').select('email, ca_name, ca_email, client_name, created_at'),
                supabase.from('feedbacks')
                    .select('email, id, created_at')
                    .gte('created_at', startIso)
                    .lte('created_at', endIso),
                supabase.from('extension_analytics')
                    .select('user_email, id, url, total_questions, filled_success_count, created_at')
                    .gte('created_at', startIso)
                    .lte('created_at', endIso)
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (feedbacksRes.error) throw feedbacksRes.error;
            if (analyticsRes.error) throw analyticsRes.error;

            const profiles = profilesRes.data || [];
            const feedbacks = feedbacksRes.data || [];
            const analytics = analyticsRes.data || [];

            // 1. Create a mapping of User Email -> CA Info (using all profiles)
            const emailToCA = {};
            profiles.forEach(p => {
                if (p.email) {
                    emailToCA[p.email] = {
                        ca_email: p.ca_email || 'Unassigned',
                        ca_name: p.ca_name || 'Unassigned'
                    };
                }
            });

            // 2. Initialize grouped data with all CAs
            const grouped = {};

            // Add known CAs from profiles
            profiles.forEach(p => {
                const caEmail = p.ca_email || 'Unassigned';
                const caName = p.ca_name || 'Unassigned';

                if (!grouped[caEmail]) {
                    grouped[caEmail] = {
                        ca_email: caEmail,
                        ca_name: caName,
                        profile_all_time_emails: new Set(),
                        active_profiles_in_range: new Set(), // Track unique users with activity
                        profile_count: 0,
                        feedback_count: 0,
                        scan_count: 0,
                        client_names: new Set(),
                        all_scans: [],
                        last_activity: null
                    };
                }

                if (p.email) grouped[caEmail].profile_all_time_emails.add(p.email);
                if (p.client_name) grouped[caEmail].client_names.add(p.client_name);

                // Initial last_activity from profile creation (if we want that as activity)
                if (p.created_at && (!grouped[caEmail].last_activity || new Date(p.created_at) > new Date(grouped[caEmail].last_activity))) {
                    // Only count profile creation as activity if it's in the range
                    const pDate = new Date(p.created_at);
                    if (pDate >= startDate && pDate <= endDate) {
                        grouped[caEmail].last_activity = p.created_at;
                        if (p.email) grouped[caEmail].active_profiles_in_range.add(p.email);
                    }
                }
            });

            // Always ensure "Unassigned" exists
            if (!grouped['Unassigned']) {
                grouped['Unassigned'] = {
                    ca_email: 'Unassigned',
                    ca_name: 'Unassigned',
                    profile_all_time_emails: new Set(),
                    active_profiles_in_range: new Set(),
                    profile_count: 0,
                    feedback_count: 0,
                    scan_count: 0,
                    client_names: new Set(),
                    all_scans: [],
                    last_activity: null
                };
            }

            // 3. attribute activity (feedbacks/scans) to CAs
            feedbacks.forEach(f => {
                const caInfo = emailToCA[f.email] || { ca_email: 'Unassigned', ca_name: 'Unassigned' };
                const caEmail = caInfo.ca_email;

                if (grouped[caEmail]) {
                    grouped[caEmail].feedback_count += 1;
                    if (f.email) grouped[caEmail].active_profiles_in_range.add(f.email);
                    if (f.created_at && (!grouped[caEmail].last_activity || new Date(f.created_at) > new Date(grouped[caEmail].last_activity))) {
                        grouped[caEmail].last_activity = f.created_at;
                    }
                }
            });

            analytics.forEach(a => {
                const caInfo = emailToCA[a.user_email] || { ca_email: 'Unassigned', ca_name: 'Unassigned' };
                const caEmail = caInfo.ca_email;

                if (grouped[caEmail]) {
                    grouped[caEmail].scan_count += 1;
                    if (a.user_email) grouped[caEmail].active_profiles_in_range.add(a.user_email);
                    grouped[caEmail].all_scans.push(a);
                    if (a.created_at && (!grouped[caEmail].last_activity || new Date(a.created_at) > new Date(grouped[caEmail].last_activity))) {
                        grouped[caEmail].last_activity = a.created_at;
                    }
                }
            });

            // Convert active_profiles_in_range size to profile_count
            const processed = Object.values(grouped).map(ca => ({
                ...ca,
                profile_count: ca.active_profiles_in_range.size,
                client_names_str: Array.from(ca.client_names).join(', ')
            }));

            setCAData(processed);
            prepareChartData(profiles, feedbacks, analytics, dateRange, startDate, endDate);

            // Stats (Summing up for the cards)
            const totalCAs = Object.keys(grouped).filter(email => email !== 'Unassigned').length;

            // For total profiles in range, we should count unique emails across ALL CAs (including Unassigned)
            const allActiveEmails = new Set();
            processed.forEach(ca => {
                ca.active_profiles_in_range.forEach(email => allActiveEmails.add(email));
            });

            const totalProfiles = allActiveEmails.size;
            const totalFeedbacks = processed.reduce((sum, ca) => sum + (ca.feedback_count || 0), 0);
            const totalScans = processed.reduce((sum, ca) => sum + (ca.scan_count || 0), 0);

            setStats({ totalCAs, totalProfiles, totalFeedbacks, totalScans });

        } catch (error) {
            console.error('Error fetching CA data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const prepareChartData = (profiles, feedbacks, analytics, range, start, end) => {
        let daysToPlan = 7;
        const now = new Date();

        if (range === 'Today') daysToPlan = 1;
        else if (range === 'Last 30 Days') daysToPlan = 30;
        else if (range === 'Last 90 Days') daysToPlan = 90;
        else if (range === 'All Time') daysToPlan = 90; // Default to 90 for all-time view
        else if (range === 'Custom Range' && start && end) {
            daysToPlan = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (daysToPlan <= 0) daysToPlan = 1;
        }

        const dateList = Array.from({ length: daysToPlan }, (_, i) => {
            const date = subDays(range === 'Custom Range' ? end : now, i);
            return format(date, 'MMM dd');
        }).reverse();

        const activityCounts = {};

        profiles.forEach(p => {
            const dateStr = format(new Date(p.created_at), 'MMM dd');
            if (dateList.includes(dateStr)) {
                if (!activityCounts[dateStr]) activityCounts[dateStr] = { scans: 0, feedbacks: 0, profiles: 0 };
                activityCounts[dateStr].profiles += 1;
            }
        });

        feedbacks.forEach(f => {
            const dateStr = format(new Date(f.created_at), 'MMM dd');
            if (dateList.includes(dateStr)) {
                if (!activityCounts[dateStr]) activityCounts[dateStr] = { scans: 0, feedbacks: 0, profiles: 0 };
                activityCounts[dateStr].feedbacks += 1;
            }
        });

        analytics.forEach(a => {
            const dateStr = format(new Date(a.created_at), 'MMM dd');
            if (dateList.includes(dateStr)) {
                if (!activityCounts[dateStr]) activityCounts[dateStr] = { scans: 0, feedbacks: 0, profiles: 0 };
                activityCounts[dateStr].scans += 1;
            }
        });

        const chartPoints = dateList.map(date => ({
            name: date,
            scans: activityCounts[date]?.scans || 0,
            feedbacks: activityCounts[date]?.feedbacks || 0,
            profiles: activityCounts[date]?.profiles || 0
        }));

        setChartData(chartPoints);
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
            header: 'S.No',
            key: 's_no',
            render: (_, __, idx) => <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</span>
        },
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
            header: 'Active Profiles',
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
                    {val} Profiles used
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

    const handleCopyEmails = (emails) => {
        navigator.clipboard.writeText(emails.join('\n'));
        setCopySuccess('all');
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const renderExpandableRow = (ca) => {
        const emails = Array.from(ca.profile_all_time_emails || []);

        return (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '0.5rem',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <UsersIcon size={16} />
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                            Assigned User Profiles ({emails.length})
                        </h4>
                    </div>
                    {emails.length > 0 && (
                        <button
                            onClick={() => handleCopyEmails(emails)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: copySuccess === 'all' ? '#10b981' : 'var(--primary-light)',
                                color: copySuccess === 'all' ? 'white' : 'var(--primary)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copySuccess === 'all' ? <Check size={14} /> : <Copy size={14} />}
                            {copySuccess === 'all' ? 'Copied!' : 'Copy All'}
                        </button>
                    )}
                </div>

                {emails.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '0.75rem'
                    }}>
                        {emails.map((email, idx) => (
                            <div key={idx} style={{
                                padding: '0.75rem 1rem',
                                background: 'white',
                                borderRadius: '0.75rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-main)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid var(--border)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ fontWeight: '500' }}>{email}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(email);
                                        setCopySuccess(email);
                                        setTimeout(() => setCopySuccess(null), 2000);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: copySuccess === email ? '#10b981' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Copy email"
                                >
                                    {copySuccess === email ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', background: 'white', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                        No profiles found for this CA.
                    </div>
                )}
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        );
    };

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

            {/* Activity Trend Chart */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: 'var(--shadow)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>Activity Trend</h3>
                    </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFeedbacks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProfiles" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                                dataKey="scans"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorScans)"
                                name="Scans"
                            />
                            <Area
                                type="monotone"
                                dataKey="feedbacks"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorFeedbacks)"
                                name="Feedbacks"
                            />
                            <Area
                                type="monotone"
                                dataKey="profiles"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorProfiles)"
                                name="Profiles"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
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
                    rowKey="ca_email"
                    renderExpandable={renderExpandableRow}
                />
            </div>
        </div>
    );
};

export default CAActivity;
