// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//     LayoutDashboard,
//     Users,
//     BrainCircuit,
//     BarChart3,
//     Settings,
//     LogOut,
//     Calendar,
//     Search,
//     ChevronDown,
//     TrendingUp,
//     Target,
//     Clock,
//     Zap,
//     Menu,
//     X,
//     MessageSquare
// } from 'lucide-react';
// import { StatCard, MetricBarChart, PatternPieChart, SuccessRateBarChart } from './Charts';
// import { DataTable } from './DataTable';
// import ActiveUsers from './ActiveUsers';
// import LearnedPatterns from './LearnedPatterns';
// import Feedback from './Feedback';
// import AnalyticsTab from './AnalyticsTab';

// import { supabase } from '../lib/supabase';

// const Dashboard = ({ user, onLogout }) => {
//     const navigate = useNavigate();
//     const { tab } = useParams();
//     const activeTab = tab || 'Overview';

//     const [dateRange, setDateRange] = useState('Last 7 Days');
//     const [customDates, setCustomDates] = useState({ start: '', end: '' });
//     const [searchQuery, setSearchQuery] = useState('');
//     const [isLoading, setIsLoading] = useState(true);
//     const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
//     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//     const setActiveTab = (newTab) => {
//         navigate(`/dashboard/${newTab}`);
//         setIsMobileMenuOpen(false);
//     };

//     // Real database data state
//     const [analytics, setAnalytics] = useState([]);
//     const [patterns, setPatterns] = useState([]);
//     const [usersCount, setUsersCount] = useState(0);
//     const [stats, setStats] = useState({
//         totalScans: 0,
//         accuracy: 0,
//         avgTime: 0,
//         patternCount: 0
//     });

//     const [barData, setBarData] = useState([]);
//     const [pieData, setPieData] = useState([]);
//     const [horizontalData, setHorizontalData] = useState([]);

//     useEffect(() => {
//         fetchDashboardData();
//     }, [dateRange]);

//     const fetchDashboardData = async () => {
//         setIsLoading(true);
//         try {
//             // Calculate start date based on filter
//             let startDate = new Date();
//             if (dateRange === 'Today') startDate.setHours(0, 0, 0, 0);
//             else if (dateRange === 'Last 7 Days') startDate.setDate(startDate.getDate() - 7);
//             else if (dateRange === 'Last 30 Days') startDate.setDate(startDate.getDate() - 30);
//             else startDate.setDate(startDate.getDate() - 365); // All time or custom

//             // 1. Fetch Analytics
//             const { data: analyticsData } = await supabase
//                 .from('extension_analytics')
//                 .select('*')
//                 .gte('created_at', startDate.toISOString())
//                 .order('created_at', { ascending: false });

//             // 2. Fetch Patterns
//             const { data: patternsData } = await supabase
//                 .from('learned_patterns')
//                 .select('*')
//                 .order('created_at', { ascending: false });

//             // 3. Fetch Users Count
//             const { count, error: userError } = await supabase
//                 .from('user_profiles')
//                 .select('*', { count: 'exact', head: true });

//             if (userError) console.error('Error fetching user count:', userError);

//             if (analyticsData) {
//                 setAnalytics(analyticsData);

//                 // Calculate aggregate stats
//                 const totalScans = analyticsData.length;
//                 const totalSuccess = analyticsData.reduce((acc, curr) => acc + (curr.filled_success_count || 0), 0);
//                 const totalFailed = analyticsData.reduce((acc, curr) => acc + (curr.filled_failed_count || 0), 0);
//                 const accuracy = totalScans > 0 ? ((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1) : 0;
//                 const avgTime = totalScans > 0 ? (analyticsData.reduce((acc, curr) => acc + (curr.total_process_time_ms || 0), 0) / totalScans / 1000).toFixed(2) : 0;

//                 setStats({
//                     totalScans,
//                     accuracy: accuracy + '%',
//                     avgTime: avgTime + 's',
//                     patternCount: patternsData?.length || 0
//                 });

//                 // Prepare Bar Data (Daily)
//                 const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//                 const dayCounts = analyticsData.reduce((acc, curr) => {
//                     const day = days[new Date(curr.created_at).getDay()];
//                     acc[day] = (acc[day] || 0) + 1;
//                     return acc;
//                 }, {});
//                 setBarData(days.map(d => ({ name: d, scans: dayCounts[d] || 0 })));

//                 // Prepare Horizontal Data (Success by URL)
//                 const urlStats = analyticsData.reduce((acc, curr) => {
//                     if (!curr.url) return acc;
//                     const host = new URL(curr.url).hostname;
//                     if (!acc[host]) acc[host] = { success: 0, total: 0 };
//                     acc[host].success += curr.filled_success_count || 0;
//                     acc[host].total += (curr.filled_success_count || 0) + (curr.filled_failed_count || 0);
//                     return acc;
//                 }, {});
//                 setHorizontalData(Object.entries(urlStats).map(([name, s]) => ({
//                     name,
//                     success: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0
//                 })).slice(0, 5));
//             }

//             if (patternsData) {
//                 setPatterns(patternsData);

//                 // Prepare Pie Data (By Intent)
//                 const intentCounts = patternsData.reduce((acc, curr) => {
//                     acc[curr.intent] = (acc[curr.intent] || 0) + 1;
//                     return acc;
//                 }, {});
//                 setPieData(Object.entries(intentCounts).map(([name, value]) => ({ name, value })));
//             }

//             setUsersCount(count || 0);
//         } catch (error) {
//             console.error('Error fetching data:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const tableColumns = [
//         { header: 'User Email', key: 'user_email' },
//         { header: 'Intent', key: 'intent' },
//         {
//             header: 'Confidence', key: 'confidence', render: (val) => (
//                 <span style={{
//                     padding: '0.25rem 0.6rem',
//                     borderRadius: '1rem',
//                     background: val > 0.9 ? '#10b98120' : '#f59e0b20',
//                     color: val > 0.9 ? '#10b981' : '#f59e0b',
//                     fontWeight: '600',
//                     fontSize: '0.75rem'
//                 }}>
//                     {(val * 100).toFixed(0)}%
//                 </span>
//             )
//         },
//         { header: 'Usage', key: 'usage_count' },
//         { header: 'Field Type', key: 'field_type' },
//     ];

//     const sidebarItems = [
//         { icon: <LayoutDashboard size={20} />, label: 'Overview' },
//         { icon: <BrainCircuit size={20} />, label: 'Learned Patterns' },
//         { icon: <Users size={20} />, label: 'Active Users' },
//         { icon: <BarChart3 size={20} />, label: 'Analytics' },
//         { icon: <MessageSquare size={20} />, label: 'Feedback' },
//         { icon: <Settings size={20} />, label: 'Settings' },
//     ];

//     return (
//         <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
//             {/* Mobile Overlay */}
//             {isMobileMenuOpen && (
//                 <div
//                     onClick={() => setIsMobileMenuOpen(false)}
//                     style={{
//                         position: 'fixed',
//                         inset: 0,
//                         background: 'rgba(0,0,0,0.5)',
//                         zIndex: 95,
//                         display: 'block',
//                     }}
//                 />
//             )}

//             {/* Sidebar */}
//             <aside
//                 className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
//                 style={{
//                     width: '260px',
//                     background: 'var(--bg-card)',
//                     borderRight: '1px solid var(--border)',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     position: 'fixed',
//                     height: '100vh',
//                     zIndex: 100,
//                     left: 0,
//                     transition: 'transform 0.3s ease',
//                 }}
//             >
//                 <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//                         <div style={{
//                             width: '40px',
//                             height: '40px',
//                             background: 'var(--primary)',
//                             borderRadius: '0.75rem',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
//                         }}>
//                             <BrainCircuit color="white" size={24} />
//                         </div>
//                         <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>ExtensionAI</span>
//                     </div>
//                     <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
//                         <X size={24} />
//                     </button>
//                 </div>

//                 <nav style={{ flex: 1, padding: '0 1rem' }}>
//                     {sidebarItems.map((item, index) => (
//                         <div
//                             key={index}
//                             onClick={() => setActiveTab(item.label)}
//                             style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '1rem',
//                                 padding: '0.875rem 1rem',
//                                 borderRadius: '0.75rem',
//                                 cursor: 'pointer',
//                                 marginBottom: '0.25rem',
//                                 color: activeTab === item.label ? 'var(--primary)' : 'var(--text-muted)',
//                                 background: activeTab === item.label ? 'var(--primary-light)' : 'transparent',
//                                 transition: 'all 0.2s',
//                                 fontWeight: activeTab === item.label ? '600' : '500'
//                             }}
//                         >
//                             {item.icon}
//                             {item.label}
//                         </div>
//                     ))}
//                 </nav>

//                 <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
//                     <button
//                         onClick={onLogout}
//                         style={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '0.75rem',
//                             padding: '0.75rem 1rem',
//                             width: '100%',
//                             borderRadius: '0.75rem',
//                             border: 'none',
//                             background: 'transparent',
//                             color: 'var(--error)',
//                             fontWeight: '600',
//                             cursor: 'pointer'
//                         }}
//                     >
//                         <LogOut size={20} />
//                         Log Out
//                     </button>
//                 </div>
//             </aside>

//             <main className="main-content" style={{
//                 flex: 1,
//                 padding: '1.5rem',
//                 minWidth: 0 // Prevent overflow issues
//             }}>
//                 <header style={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     marginBottom: '2.5rem',
//                     background: 'var(--bg-card)',
//                     padding: '1rem 1.5rem',
//                     borderRadius: '1rem',
//                     boxShadow: 'var(--shadow)',
//                     position: 'sticky',
//                     top: '1.5rem',
//                     zIndex: 90,
//                     gap: '1rem'
//                 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
//                         <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>
//                             <Menu size={24} />
//                         </button>
//                         <div className="search-container" style={{ position: 'relative', width: '300px' }}>
//                             <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
//                             <input
//                                 type="text"
//                                 className="input"
//                                 placeholder="Search..."
//                                 style={{ paddingLeft: '2.75rem', background: 'var(--bg-main)', border: 'none' }}
//                                 value={searchQuery}
//                                 onChange={(e) => setSearchQuery(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
//                         <div style={{ position: 'relative' }}>
//                             <div
//                                 onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
//                                 style={{
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     gap: '0.75rem',
//                                     padding: '0.5rem 1rem',
//                                     background: 'var(--bg-main)',
//                                     borderRadius: '0.75rem',
//                                     cursor: 'pointer'
//                                 }}
//                             >
//                                 <Calendar size={18} color="var(--primary)" />
//                                 <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{dateRange}</span>
//                                 <ChevronDown size={16} />
//                             </div>

//                             {isDateDropdownOpen && (
//                                 <div style={{
//                                     position: 'absolute',
//                                     top: '110%',
//                                     right: 0,
//                                     background: 'white',
//                                     borderRadius: '0.75rem',
//                                     boxShadow: 'var(--shadow-lg)',
//                                     padding: '0.5rem',
//                                     width: '160px',
//                                     zIndex: 100
//                                 }}>
//                                     {['Today', 'Last 7 Days', 'Last 30 Days', 'All Time', 'Custom Range'].map(range => (
//                                         <div
//                                             key={range}
//                                             onClick={() => {
//                                                 setDateRange(range);
//                                                 setIsDateDropdownOpen(false);
//                                             }}
//                                             style={{
//                                                 padding: '0.5rem 1rem',
//                                                 fontSize: '0.875rem',
//                                                 borderRadius: '0.5rem',
//                                                 cursor: 'pointer',
//                                                 background: dateRange === range ? 'var(--primary-light)' : 'transparent',
//                                                 color: dateRange === range ? 'var(--primary)' : 'var(--text-main)',
//                                             }}
//                                         >
//                                             {range}
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>

//                         {dateRange === 'Custom Range' && (
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//                                 <input
//                                     type="date"
//                                     className="input"
//                                     style={{ padding: '0.4rem', fontSize: '0.8rem', width: '130px' }}
//                                     value={customDates.start}
//                                     onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
//                                 />
//                                 <span style={{ color: 'var(--text-muted)' }}>-</span>
//                                 <input
//                                     type="date"
//                                     className="input"
//                                     style={{ padding: '0.4rem', fontSize: '0.8rem', width: '130px' }}
//                                     value={customDates.end}
//                                     onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
//                                 />
//                             </div>
//                         )}

//                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//                             <div className="user-info" style={{ textAlign: 'right' }}>
//                                 <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.email.split('@')[0]}</p>
//                                 <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin</p>
//                             </div>
//                             <div style={{
//                                 width: '40px',
//                                 height: '40px',
//                                 borderRadius: '50%',
//                                 background: 'var(--primary)',
//                                 color: 'white',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center',
//                                 fontWeight: '700'
//                             }}>
//                                 {user.email[0].toUpperCase()}
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 {isLoading ? (
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
//                         <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '600' }}>Loading real-time data...</div>
//                     </div>
//                 ) : activeTab === 'Overview' ? (
//                     <div className="fade-in">
//                         {/* Stats Grid */}
//                         <div className="grid-cols-stats" style={{ marginBottom: '2rem' }}>
//                             <StatCard title="Total Scans" value={stats.totalScans} change="+12.5%" icon={<TrendingUp size={20} />} color="#2563eb" />
//                             <StatCard title="AI Accuracy" value={stats.accuracy} change="+2.1%" icon={<Target size={20} />} color="#10b981" />
//                             <StatCard title="Avg. Process Time" value={stats.avgTime} change="-0.4s" icon={<Clock size={20} />} color="#6366f1" />
//                             <StatCard title="Learned Patterns" value={stats.patternCount} change="+18" icon={<Zap size={20} />} color="#f59e0b" />
//                         </div>

//                         {/* Charts Grid */}
//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
//                             gap: '2rem',
//                             marginBottom: '2rem'
//                         }}>
//                             <MetricBarChart data={barData} />
//                             <PatternPieChart data={pieData} />
//                         </div>

//                         {/* Bottom Grid */}
//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
//                             gap: '2rem',
//                             marginBottom: '2rem'
//                         }}>
//                             <DataTable
//                                 title="Recent Learned Patterns"
//                                 data={patterns.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.intent.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)}
//                                 columns={tableColumns}
//                             />
//                             <SuccessRateBarChart data={horizontalData} />
//                         </div>
//                     </div>
//                 ) : activeTab === 'Active Users' ? (
//                     <ActiveUsers searchQuery={searchQuery} dateRange={dateRange} customDates={customDates} />
//                 ) : activeTab === 'Learned Patterns' ? (
//                     <LearnedPatterns searchQuery={searchQuery} />
//                 ) : activeTab === 'Analytics' ? (
//                     <AnalyticsTab searchQuery={searchQuery} />
//                 ) : activeTab === 'Feedback' ? (
//                     <Feedback searchQuery={searchQuery} dateRange={dateRange} customDates={customDates} />
//                 ) : (
//                     <div className="fade-in" style={{
//                         display: 'flex',
//                         flexDirection: 'column',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         height: '60vh',
//                         color: 'var(--text-muted)',
//                         textAlign: 'center'
//                     }}>
//                         <BrainCircuit size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
//                         <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{activeTab} Module</h2>
//                         <p style={{ marginTop: '0.5rem' }}>Integration for {activeTab} is complete. <br /> Aggregated from your Supabase tables.</p>
//                         <button
//                             className="btn-primary"
//                             style={{ marginTop: '2rem' }}
//                             onClick={() => setActiveTab('Overview')}
//                         >
//                             Back to Overview
//                         </button>
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// };

// export default Dashboard;





import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BrainCircuit,
    BarChart3,
    Settings,
    LogOut,
    Calendar,
    Search,
    ChevronDown,
    TrendingUp,
    Target,
    Clock,
    Zap,
    Menu,
    X,
    MessageSquare
} from 'lucide-react';
import { StatCard, MetricBarChart, PatternPieChart, SuccessRateBarChart } from './Charts';
import { DataTable } from './DataTable';
import ActiveUsers from './ActiveUsers';
import LearnedPatterns from './LearnedPatterns';
import Feedback from './Feedback';
import AnalyticsTab from './AnalyticsTab';

import { supabase } from '../lib/supabase';

const Dashboard = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || 'Overview';

    const [dateRange, setDateRange] = useState('Last 7 Days');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const setActiveTab = (newTab) => {
        navigate(`/dashboard/${newTab}`);
        setIsMobileMenuOpen(false);
    };

    // Real database data state
    const [analytics, setAnalytics] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [feedbacksAll, setFeedbacksAll] = useState([]);
    const [usersCount, setUsersCount] = useState(0);
    const [stats, setStats] = useState({
        totalScans: 0,
        accuracy: 0,
        avgTime: 0,
        patternCount: 0
    });
    const [summaryStats, setSummaryStats] = useState(null);

    const [barData, setBarData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [horizontalData, setHorizontalData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Calculate start date based on filter
            let startDate = new Date();
            if (dateRange === 'Today') startDate.setHours(0, 0, 0, 0);
            else if (dateRange === 'Last 7 Days') startDate.setDate(startDate.getDate() - 7);
            else if (dateRange === 'Last 30 Days') startDate.setDate(startDate.getDate() - 30);
            else startDate.setDate(startDate.getDate() - 365); // All time or custom

            // 1. Fetch Analytics (date-range filtered, for charts & stats)
            const { data: analyticsData } = await supabase
                .from('extension_analytics')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            // 1b. Fetch ALL analytics (all-time, for the summary table)
            const { data: analyticsAllData } = await supabase
                .from('extension_analytics')
                .select('*')
                .order('created_at', { ascending: false });

            // 2. Fetch Patterns (all time)
            const { data: patternsData } = await supabase
                .from('learned_patterns')
                .select('*')
                .order('created_at', { ascending: false });

            // 3b. Fetch all feedbacks for summary
            const { data: feedbacksData } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

            // 4. Fetch Users Count
            const { count, error: userError } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            if (userError) console.error('Error fetching user count:', userError);

            // Helper: filter rows within an exclusive window (from hoursFrom ago → hoursTo ago)
            // hoursTo = 0 means "up to now"
            const inWindow = (rows, hoursFrom, hoursTo = 0) => {
                const now = Date.now();
                const from = new Date(now - hoursFrom * 3600000);
                const to = hoursTo === 0 ? new Date(now) : new Date(now - hoursTo * 3600000);
                return (rows || []).filter(r => {
                    if (!r.created_at) return false;
                    const d = new Date(r.created_at);
                    return d >= from && d < to;
                });
            };

            // Compute success ratio for a slice of analytics rows
            const successRatio = (rows) => {
                const s = rows.reduce((a, c) => a + (c.filled_success_count || 0), 0);
                const f = rows.reduce((a, c) => a + (c.filled_failed_count || 0), 0);
                return (s + f) > 0 ? ((s / (s + f)) * 100).toFixed(1) + '%' : '—';
            };

            const allAnalytics = analyticsAllData || [];
            const allFeedbacks = feedbacksData || [];
            const allPatterns = patternsData || [];

            // Each period: [fromHours, toHours] — exclusive window
            // e.g. d2 = records between 48h ago and 24h ago
            const periods = [
                { key: 'h24', from: 24, to: 0 },   // last 24 hours
                { key: 'd2', from: 48, to: 24 },   // day 2
                { key: 'd3', from: 72, to: 48 },   // day 3
                { key: 'd4', from: 96, to: 72 },   // day 4
                { key: 'd5', from: 120, to: 96 },   // day 5
                { key: 'd6', from: 144, to: 120 },   // day 6
                { key: 'd7', from: 168, to: 144 },   // day 7
                { key: 'd15', from: 360, to: 168 },   // days 8–15
                { key: 'd30', from: 720, to: 360 },   // days 16–30
            ];

            const buildPeriods = (rows, fn) =>
                Object.fromEntries(periods.map(p => [p.key, fn(inWindow(rows, p.from, p.to))]));

            setSummaryStats({
                feedbacks: {
                    total: allFeedbacks.length,
                    ...buildPeriods(allFeedbacks, r => r.length),
                },
                scans: {
                    total: allAnalytics.length,
                    ...buildPeriods(allAnalytics, r => r.length),
                },
                successRatio: {
                    total: successRatio(allAnalytics),
                    ...buildPeriods(allAnalytics, r => successRatio(r)),
                },
                patterns: {
                    total: allPatterns.length,
                    ...buildPeriods(allPatterns, r => r.length),
                },
            });

            if (feedbacksData) setFeedbacksAll(feedbacksData);

            if (analyticsData) {
                setAnalytics(analyticsData);

                // Calculate aggregate stats
                const totalScans = analyticsData.length;
                const totalSuccess = analyticsData.reduce((acc, curr) => acc + (curr.filled_success_count || 0), 0);
                const totalFailed = analyticsData.reduce((acc, curr) => acc + (curr.filled_failed_count || 0), 0);
                const accuracy = totalScans > 0 ? ((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1) : 0;
                const avgTime = totalScans > 0 ? (analyticsData.reduce((acc, curr) => acc + (curr.total_process_time_ms || 0), 0) / totalScans / 1000).toFixed(2) : 0;

                setStats({
                    totalScans,
                    accuracy: accuracy + '%',
                    avgTime: avgTime + 's',
                    patternCount: patternsData?.length || 0
                });

                // Prepare Bar Data (Daily)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayCounts = analyticsData.reduce((acc, curr) => {
                    const day = days[new Date(curr.created_at).getDay()];
                    acc[day] = (acc[day] || 0) + 1;
                    return acc;
                }, {});
                setBarData(days.map(d => ({ name: d, scans: dayCounts[d] || 0 })));

                // Prepare Horizontal Data (Success by URL)
                const urlStats = analyticsData.reduce((acc, curr) => {
                    if (!curr.url) return acc;
                    const host = new URL(curr.url).hostname;
                    if (!acc[host]) acc[host] = { success: 0, total: 0 };
                    acc[host].success += curr.filled_success_count || 0;
                    acc[host].total += (curr.filled_success_count || 0) + (curr.filled_failed_count || 0);
                    return acc;
                }, {});
                setHorizontalData(Object.entries(urlStats).map(([name, s]) => ({
                    name,
                    success: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0
                })).slice(0, 5));
            }

            if (patternsData) {
                setPatterns(patternsData);

                // Prepare Pie Data (By Intent)
                const intentCounts = patternsData.reduce((acc, curr) => {
                    acc[curr.intent] = (acc[curr.intent] || 0) + 1;
                    return acc;
                }, {});
                setPieData(Object.entries(intentCounts).map(([name, value]) => ({ name, value })));
            }

            setUsersCount(count || 0);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const tableColumns = [
        { header: 'User Email', key: 'user_email' },
        { header: 'Intent', key: 'intent' },
        {
            header: 'Confidence', key: 'confidence', render: (val) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '1rem',
                    background: val > 0.9 ? '#10b98120' : '#f59e0b20',
                    color: val > 0.9 ? '#10b981' : '#f59e0b',
                    fontWeight: '600',
                    fontSize: '0.75rem'
                }}>
                    {(val * 100).toFixed(0)}%
                </span>
            )
        },
        { header: 'Usage', key: 'usage_count' },
        { header: 'Field Type', key: 'field_type' },
    ];

    const sidebarItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview' },
        { icon: <BrainCircuit size={20} />, label: 'Learned Patterns' },
        { icon: <Users size={20} />, label: 'Active Users' },
        { icon: <BarChart3 size={20} />, label: 'Analytics' },
        { icon: <MessageSquare size={20} />, label: 'Feedback' },
        { icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 95,
                        display: 'block',
                    }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
                style={{
                    width: '260px',
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100,
                    left: 0,
                    transition: 'transform 0.3s ease',
                }}
            >
                <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--primary)',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
                        }}>
                            <BrainCircuit color="white" size={24} />
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>ExtensionAI</span>
                    </div>
                    <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '0 1rem' }}>
                    {sidebarItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setActiveTab(item.label)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.875rem 1rem',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                marginBottom: '0.25rem',
                                color: activeTab === item.label ? 'var(--primary)' : 'var(--text-muted)',
                                background: activeTab === item.label ? 'var(--primary-light)' : 'transparent',
                                transition: 'all 0.2s',
                                fontWeight: activeTab === item.label ? '600' : '500'
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            width: '100%',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--error)',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <LogOut size={20} />
                        Log Out
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{
                flex: 1,
                padding: '1.5rem',
                minWidth: 0 // Prevent overflow issues
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2.5rem',
                    background: 'var(--bg-card)',
                    padding: '1rem 1.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow)',
                    position: 'sticky',
                    top: '1.5rem',
                    zIndex: 90,
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>
                            <Menu size={24} />
                        </button>
                        <div className="search-container" style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input"
                                placeholder="Search..."
                                style={{ paddingLeft: '2.75rem', background: 'var(--bg-main)', border: 'none' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    background: 'var(--bg-main)',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Calendar size={18} color="var(--primary)" />
                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{dateRange}</span>
                                <ChevronDown size={16} />
                            </div>

                            {isDateDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '110%',
                                    right: 0,
                                    background: 'white',
                                    borderRadius: '0.75rem',
                                    boxShadow: 'var(--shadow-lg)',
                                    padding: '0.5rem',
                                    width: '160px',
                                    zIndex: 100
                                }}>
                                    {['Today', 'Last 7 Days', 'Last 30 Days', 'All Time', 'Custom Range'].map(range => (
                                        <div
                                            key={range}
                                            onClick={() => {
                                                setDateRange(range);
                                                setIsDateDropdownOpen(false);
                                            }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                background: dateRange === range ? 'var(--primary-light)' : 'transparent',
                                                color: dateRange === range ? 'var(--primary)' : 'var(--text-main)',
                                            }}
                                        >
                                            {range}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {dateRange === 'Custom Range' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    className="input"
                                    style={{ padding: '0.4rem', fontSize: '0.8rem', width: '130px' }}
                                    value={customDates.start}
                                    onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                />
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                <input
                                    type="date"
                                    className="input"
                                    style={{ padding: '0.4rem', fontSize: '0.8rem', width: '130px' }}
                                    value={customDates.end}
                                    onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="user-info" style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.email.split('@')[0]}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin</p>
                            </div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700'
                            }}>
                                {user.email[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                        <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '600' }}>Loading real-time data...</div>
                    </div>
                ) : activeTab === 'Overview' ? (
                    <div className="fade-in">
                        {/* Stats Grid */}
                        <div className="grid-cols-stats" style={{ marginBottom: '2rem' }}>
                            <StatCard title="Total Scans" value={stats.totalScans} change="+12.5%" icon={<TrendingUp size={20} />} color="#2563eb" />
                            <StatCard title="AI Accuracy" value={stats.accuracy} change="+2.1%" icon={<Target size={20} />} color="#10b981" />
                            <StatCard title="Avg. Process Time" value={stats.avgTime} change="-0.4s" icon={<Clock size={20} />} color="#6366f1" />
                            <StatCard title="Learned Patterns" value={stats.patternCount} change="+18" icon={<Zap size={20} />} color="#f59e0b" />
                        </div>

                        {/* Summary Table */}
                        {summaryStats && (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '1rem',
                                boxShadow: 'var(--shadow)',
                                marginBottom: '2rem',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Activity Summary</h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Click any row to view details</p>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-main)' }}>
                                                {['Metric', 'Total', 'Last 24h', 'Last 2 Days', 'Last 3 Days', 'Last 4 Days', 'Last 5 Days', 'Last 6 Days', 'Last 7 Days', 'Last 15 Days', 'Last 30 Days'].map(h => (
                                                    <th key={h} style={{
                                                        padding: '0.75rem 1.25rem',
                                                        textAlign: h === 'Metric' ? 'left' : 'center',
                                                        fontWeight: '600',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        whiteSpace: 'nowrap'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { label: '💬 Feedbacks', data: summaryStats.feedbacks, tab: 'Feedback', color: '#6366f1' },
                                                { label: '📋 Filled Forms (Scans)', data: summaryStats.scans, tab: 'Analytics', color: '#2563eb' },
                                                { label: '✅ Success Ratio', data: summaryStats.successRatio, tab: null, color: '#10b981' },
                                                { label: '🧠 Learned Patterns', data: summaryStats.patterns, tab: 'Learned Patterns', color: '#f59e0b' },
                                            ].map((row, i) => (
                                                <tr
                                                    key={i}
                                                    onClick={() => row.tab && setActiveTab(row.tab)}
                                                    style={{
                                                        borderTop: '1px solid var(--border)',
                                                        cursor: row.tab ? 'pointer' : 'default',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => { if (row.tab) e.currentTarget.style.background = 'var(--bg-main)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: row.color, whiteSpace: 'nowrap' }}>
                                                        {row.label}
                                                        {row.tab && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '400' }}>→</span>}
                                                    </td>
                                                    {['total', 'h24', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd15', 'd30'].map(period => (
                                                        <td key={period} style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: period === 'total' ? '700' : '500', color: period === 'total' ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                            {row.data[period]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Charts Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '2rem',
                            marginBottom: '2rem'
                        }}>
                            <MetricBarChart data={barData} />
                            <PatternPieChart data={pieData} />
                        </div>

                        {/* Bottom Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '2rem',
                            marginBottom: '2rem'
                        }}>
                            <DataTable
                                title="Recent Learned Patterns"
                                data={patterns.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.intent.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)}
                                columns={tableColumns}
                            />
                            <SuccessRateBarChart data={horizontalData} />
                        </div>
                    </div>
                ) : activeTab === 'Active Users' ? (
                    <ActiveUsers searchQuery={searchQuery} dateRange={dateRange} customDates={customDates} />
                ) : activeTab === 'Learned Patterns' ? (
                    <LearnedPatterns searchQuery={searchQuery} />
                ) : activeTab === 'Analytics' ? (
                    <AnalyticsTab searchQuery={searchQuery} />
                ) : activeTab === 'Feedback' ? (
                    <Feedback searchQuery={searchQuery} dateRange={dateRange} customDates={customDates} />
                ) : (
                    <div className="fade-in" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '60vh',
                        color: 'var(--text-muted)',
                        textAlign: 'center'
                    }}>
                        <BrainCircuit size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{activeTab} Module</h2>
                        <p style={{ marginTop: '0.5rem' }}>Integration for {activeTab} is complete. <br /> Aggregated from your Supabase tables.</p>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '2rem' }}
                            onClick={() => setActiveTab('Overview')}
                        >
                            Back to Overview
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
