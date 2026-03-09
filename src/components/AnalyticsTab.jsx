// import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { ChevronDown, ChevronUp } from 'lucide-react';

// const Analytics = ({ searchQuery }) => {
//     const [analytics, setAnalytics] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [expandedUser, setExpandedUser] = useState(null);
//     const [expandedMissedRow, setExpandedMissedRow] = useState(null);

//     useEffect(() => {
//         fetchAnalytics();
//     }, []);

//     const fetchAnalytics = async () => {
//         setIsLoading(true);
//         try {
//             const { data, error } = await supabase
//                 .from('extension_analytics')
//                 .select('*')
//                 .order('created_at', { ascending: false });

//             if (data) setAnalytics(data);
//         } catch (error) {
//             console.error('Error fetching analytics:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Aggregate analytics by date
//     const dateAggregates = analytics.reduce((acc, record) => {
//         const date = new Date(record.created_at).toLocaleDateString('en-GB', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//         if (!acc[date]) {
//             acc[date] = {
//                 date: date,
//                 total_scans: 0,
//                 records: []
//             };
//         }
//         acc[date].total_scans += 1;
//         acc[date].records.push(record);
//         return acc;
//     }, {});

//     const dateList = Object.values(dateAggregates).map(dateGroup => ({
//         ...dateGroup,
//         records: dateGroup.records.filter(record =>
//             (record.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
//             (record.url || '').toLowerCase().includes(searchQuery.toLowerCase())
//         )
//     })).filter(group => group.records.length > 0);

//     const toggleDate = (date) => {
//         setExpandedUser(expandedUser === date ? null : date);
//     };

//     const [showMissedColumn, setShowMissedColumn] = useState(false);

//     // Calculate aggregated stats
//     const stats = React.useMemo(() => {
//         let filteredData = analytics;
//         if (expandedUser) {
//             filteredData = analytics.filter(record => {
//                 const recordDate = new Date(record.created_at).toLocaleDateString('en-GB', {
//                     day: '2-digit',
//                     month: 'short',
//                     year: 'numeric'
//                 });
//                 return recordDate === expandedUser;
//             });
//         }

//         const totalScans = filteredData.length;
//         if (totalScans === 0 && !expandedUser) return null;

//         const sum = (key) => filteredData.reduce((acc, r) => acc + (r[key] || 0), 0);
//         // Special handling for missed_questions which is an array
//         const sumMissed = filteredData.reduce((acc, r) => acc + (Array.isArray(r.missed_questions) ? r.missed_questions.length : 0), 0);

//         // Helper for average time (ms -> seconds string)
//         const avg = (key) => {
//             if (totalScans === 0) return '0s';
//             const totalMs = sum(key);
//             return (totalMs / totalScans / 1000).toFixed(2) + 's';
//         };

//         return [
//             { label: 'Total Scans', value: totalScans },
//             { label: 'Avg Scan Time', value: avg('scan_duration_ms') },
//             { label: 'Total Qs', value: sum('total_questions') },
//             { label: 'Questions mapped by Rules', value: sum('mapped_by_rules') },
//             { label: 'Questions asked to AI', value: sum('ai_questions_count') },
//             { label: 'Total AI Calls', value: sum('ai_calls_count') },
//             { label: 'Patterns Used', value: sum('learned_patterns_used') },
//             { label: 'Avg Mapping Time', value: avg('mapping_duration_ms') },
//             { label: 'Success questions', value: sum('filled_success_count') },
//             { label: 'Failed questions', value: sum('filled_failed_count') },
//             { label: 'Avg Filling Time', value: avg('filling_duration_ms') },
//             { label: 'Avg Total Time', value: avg('total_process_time_ms') },
//             { label: 'Total Missed qustions', value: sumMissed },
//         ];
//     }, [analytics, expandedUser]);

//     const StatCard = ({ label, value }) => (
//         <div style={{
//             background: 'var(--bg-card)',
//             padding: '1rem',
//             borderRadius: '0.75rem',
//             border: '1px solid var(--border)',
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '0.25rem'
//         }}>
//             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
//             <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{value}</span>
//         </div>
//     );

//     if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;

//     return (
//         <div className="fade-in">
//             {/* KPI Cards Section */}
//             <div style={{ marginBottom: '2rem' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
//                     <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//                         {expandedUser ? `Statistics for ${expandedUser}` : 'Overall Statistics'}
//                         {expandedUser && (
//                             <span style={{
//                                 fontSize: '0.65rem',
//                                 padding: '0.25rem 0.5rem',
//                                 background: 'var(--primary-light)',
//                                 color: 'var(--primary)',
//                                 borderRadius: '1rem',
//                                 fontWeight: '700'
//                             }}>
//                                 FILTERED
//                             </span>
//                         )}
//                     </h2>
//                     {expandedUser && (
//                         <button
//                             onClick={() => setExpandedUser(null)}
//                             style={{
//                                 background: 'none',
//                                 border: 'none',
//                                 color: 'var(--primary)',
//                                 fontSize: '0.75rem',
//                                 fontWeight: '600',
//                                 cursor: 'pointer',
//                                 padding: '0.25rem 0.5rem'
//                             }}
//                         >
//                             Clear Filter
//                         </button>
//                     )}
//                 </div>
//                 {stats && (
//                     <div style={{
//                         display: 'grid',
//                         gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
//                         gap: '1rem'
//                     }}>
//                         {stats.map((s, i) => (
//                             <StatCard key={i} label={s.label} value={s.value} />
//                         ))}
//                     </div>
//                 )}
//             </div>

//             <div style={{
//                 background: 'var(--bg-card)',
//                 padding: '1.5rem',
//                 borderRadius: '1rem',
//                 boxShadow: 'var(--shadow)',
//                 maxHeight: '70vh',
//                 overflow: 'auto'
//             }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
//                     <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>
//                         Extension Analytics ({dateList.length} dates)
//                     </h3>
//                     <button
//                         onClick={() => setShowMissedColumn(!showMissedColumn)}
//                         style={{
//                             padding: '0.5rem 1rem',
//                             fontSize: '0.75rem',
//                             background: showMissedColumn ? 'var(--primary-light)' : 'var(--bg-main)',
//                             color: showMissedColumn ? 'var(--primary)' : 'var(--text-muted)',
//                             border: '1px solid var(--border)',
//                             borderRadius: '0.5rem',
//                             cursor: 'pointer',
//                             fontWeight: '600'
//                         }}
//                     >
//                         {showMissedColumn ? 'Hide Missed Column' : 'Show Missed Column'}
//                     </button>
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
//                     {dateList.map((dateGroup, idx) => (
//                         <div
//                             key={idx}
//                             style={{
//                                 border: '1px solid var(--border)',
//                                 borderRadius: '0.75rem',
//                                 overflow: 'hidden'
//                             }}
//                         >
//                             {/* Date Header */}
//                             <div
//                                 onClick={() => toggleDate(dateGroup.date)}
//                                 style={{
//                                     padding: '1rem 1.25rem',
//                                     background: expandedUser === dateGroup.date ? 'var(--primary-light)' : 'var(--bg-main)',
//                                     cursor: 'pointer',
//                                     display: 'flex',
//                                     justifyContent: 'space-between',
//                                     alignItems: 'center',
//                                     transition: 'background 0.2s'
//                                 }}
//                                 className="table-row-hover"
//                             >
//                                 <div style={{ flex: 1 }}>
//                                     <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
//                                         {dateGroup.date}
//                                     </div>
//                                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
//                                         {dateGroup.total_scans} scans recorded
//                                     </div>
//                                 </div>
//                                 <div>
//                                     {expandedUser === dateGroup.date ? (
//                                         <ChevronUp size={18} color="var(--primary)" />
//                                     ) : (
//                                         <ChevronDown size={18} color="var(--text-muted)" />
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Expanded Details */}
//                             {expandedUser === dateGroup.date && (
//                                 <div style={{ padding: '1rem', background: 'var(--bg-card)' }}>
//                                     <div style={{ overflowX: 'auto' }}>
//                                         <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
//                                             <thead>
//                                                 <tr style={{ background: 'var(--bg-main)' }}>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>User</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>URL</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Scan Time</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Qs</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By Rules</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By AI</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AI Calls</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Patterns Used</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mapping Time</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Success</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Failed</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Filling Time</th>
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Time</th>
//                                                     {showMissedColumn && <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Missed</th>}
//                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Time</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {dateGroup.records.map((record, ridx) => {
//                                                     const rowKey = `${dateGroup.date}-${ridx}`;
//                                                     const hasMissedQuestions = record.missed_questions && Array.isArray(record.missed_questions) && record.missed_questions.length > 0;
//                                                     const isExpanded = expandedMissedRow === rowKey;

//                                                     return (
//                                                         <React.Fragment key={ridx}>
//                                                             <tr style={{ borderBottom: '1px solid var(--border)' }}>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '500' }}>
//                                                                     {record.user_email || 'Unknown'}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                                                     <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.75rem' }}>
//                                                                         {record.url}
//                                                                     </a>
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
//                                                                     {record.scan_duration_ms ? `${(record.scan_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '600' }}>
//                                                                     {record.total_questions || 0}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
//                                                                     {record.mapped_by_rules || 0}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
//                                                                     {record.ai_questions_count || 0}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
//                                                                     {record.ai_calls_count || 0}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
//                                                                     {record.learned_patterns_used || 0}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
//                                                                     {record.mapping_duration_ms ? `${(record.mapping_duration_ms / 1000).toFixed(2)}s` : '0'}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
//                                                                     <span style={{
//                                                                         background: '#10b98120',
//                                                                         color: '#10b981',
//                                                                         padding: '0.25rem 0.5rem',
//                                                                         borderRadius: '0.5rem',
//                                                                         fontSize: '0.7rem',
//                                                                         fontWeight: '600'
//                                                                     }}>
//                                                                         {record.filled_success_count || 0}
//                                                                     </span>
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
//                                                                     <span style={{
//                                                                         background: '#f59e0b20',
//                                                                         color: '#f59e0b',
//                                                                         padding: '0.25rem 0.5rem',
//                                                                         borderRadius: '0.5rem',
//                                                                         fontSize: '0.7rem',
//                                                                         fontWeight: '600'
//                                                                     }}>
//                                                                         {record.filled_failed_count || 0}
//                                                                     </span>
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
//                                                                     {record.filling_duration_ms ? `${(record.filling_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
//                                                                 </td>
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '600' }}>
//                                                                     {record.total_process_time_ms ? `${(record.total_process_time_ms / 1000).toFixed(2)}s` : 'N/A'}
//                                                                 </td>
//                                                                 {showMissedColumn && (
//                                                                     <td
//                                                                         style={{
//                                                                             padding: '0.75rem',
//                                                                             color: 'var(--text-main)',
//                                                                             textAlign: 'center',
//                                                                             cursor: hasMissedQuestions ? 'pointer' : 'default'
//                                                                         }}
//                                                                         onClick={() => hasMissedQuestions && setExpandedMissedRow(isExpanded ? null : rowKey)}
//                                                                     >
//                                                                         <span style={{
//                                                                             background: (record.missed_questions && record.missed_questions.length > 0) ? '#ef444420' : '#10b98120',
//                                                                             color: (record.missed_questions && record.missed_questions.length > 0) ? '#ef4444' : '#10b981',
//                                                                             padding: '0.25rem 0.5rem',
//                                                                             borderRadius: '0.5rem',
//                                                                             fontSize: '0.7rem',
//                                                                             fontWeight: '600',
//                                                                             display: 'inline-flex',
//                                                                             alignItems: 'center',
//                                                                             gap: '0.25rem'
//                                                                         }}>
//                                                                             {record.missed_questions ? record.missed_questions.length : 0}
//                                                                             {hasMissedQuestions && (
//                                                                                 isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
//                                                                             )}
//                                                                         </span>
//                                                                     </td>
//                                                                 )}
//                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
//                                                                     {new Date(record.created_at).toLocaleTimeString()}
//                                                                 </td>
//                                                             </tr>
//                                                             {isExpanded && hasMissedQuestions && showMissedColumn && (
//                                                                 <tr>
//                                                                     <td colSpan="15" style={{ padding: '0', background: 'var(--bg-main)' }}>
//                                                                         <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
//                                                                             <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
//                                                                                 Missed Questions ({record.missed_questions.length}):
//                                                                             </div>
//                                                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
//                                                                                 {record.missed_questions.map((question, qidx) => (
//                                                                                     <div
//                                                                                         key={qidx}
//                                                                                         style={{
//                                                                                             padding: '0.5rem 0.75rem',
//                                                                                             background: 'var(--bg-card)',
//                                                                                             borderLeft: '2px solid #ef4444',
//                                                                                             borderRadius: '0.375rem',
//                                                                                             fontSize: '0.75rem',
//                                                                                             color: 'var(--text-main)'
//                                                                                         }}
//                                                                                     >
//                                                                                         <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontWeight: '600' }}>
//                                                                                             {qidx + 1}.
//                                                                                         </span>
//                                                                                         {question}
//                                                                                     </div>
//                                                                                 ))}
//                                                                             </div>
//                                                                         </div>
//                                                                     </td>
//                                                                 </tr>
//                                                             )}
//                                                         </React.Fragment>
//                                                     );
//                                                 })}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     ))}

//                     {dateList.length === 0 && (
//                         <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
//                             No analytics data found.
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Analytics;


// // import React, { useState, useEffect } from 'react';
// // import { supabase } from '../lib/supabase';
// // import { ChevronDown, ChevronUp } from 'lucide-react';

// // const Analytics = ({ searchQuery }) => {
// //     const [analytics, setAnalytics] = useState([]);
// //     const [isLoading, setIsLoading] = useState(true);
// //     const [expandedUser, setExpandedUser] = useState(null);
// //     const [expandedMissedRow, setExpandedMissedRow] = useState(null);

// //     useEffect(() => {
// //         fetchAnalytics();
// //     }, []);

// //     const fetchAnalytics = async () => {
// //         setIsLoading(true);
// //         try {
// //             const { data, error } = await supabase
// //                 .from('extension_analytics')
// //                 .select('*')
// //                 .order('created_at', { ascending: false });

// //             if (data) setAnalytics(data);
// //         } catch (error) {
// //             console.error('Error fetching analytics:', error);
// //         } finally {
// //             setIsLoading(false);
// //         }
// //     };

// //     // Aggregate analytics by user_email
// //     const userAggregates = analytics.reduce((acc, record) => {
// //         const email = record.user_email || 'Unknown';
// //         if (!acc[email]) {
// //             acc[email] = {
// //                 user_email: email,
// //                 total_urls: 0,
// //                 records: []
// //             };
// //         }
// //         acc[email].total_urls += 1;
// //         acc[email].records.push(record);
// //         return acc;
// //     }, {});

// //     const userList = Object.values(userAggregates).filter(user =>
// //         user.user_email.toLowerCase().includes(searchQuery.toLowerCase())
// //     );

// //     const toggleUser = (email) => {
// //         setExpandedUser(expandedUser === email ? null : email);
// //     };

// //     const [showMissedColumn, setShowMissedColumn] = useState(false);

// //     // Calculate aggregated stats
// //     const stats = React.useMemo(() => {
// //         const totalScans = analytics.length;
// //         if (totalScans === 0) return null;

// //         const sum = (key) => analytics.reduce((acc, r) => acc + (r[key] || 0), 0);
// //         // Special handling for missed_questions which is an array
// //         const sumMissed = analytics.reduce((acc, r) => acc + (Array.isArray(r.missed_questions) ? r.missed_questions.length : 0), 0);

// //         // Helper for average time (ms -> seconds string)
// //         const avg = (key) => {
// //             if (totalScans === 0) return '0s';
// //             const totalMs = sum(key);
// //             return (totalMs / totalScans / 1000).toFixed(2) + 's';
// //         };

// //         return [
// //             { label: 'Total Scans', value: totalScans },
// //             { label: 'Avg Scan Time', value: avg('scan_duration_ms') },
// //             { label: 'Total Qs', value: sum('total_questions') },
// //             { label: 'Questions mapped by Rules', value: sum('mapped_by_rules') },
// //             { label: 'Questions asked to AI', value: sum('ai_questions_count') },
// //             { label: 'Total AI Calls', value: sum('ai_calls_count') },
// //             { label: 'Patterns Used', value: sum('learned_patterns_used') },
// //             { label: 'Avg Mapping Time', value: avg('mapping_duration_ms') },
// //             { label: 'Success questions', value: sum('filled_success_count') },
// //             { label: 'Failed questions', value: sum('filled_failed_count') },
// //             { label: 'Avg Filling Time', value: avg('filling_duration_ms') },
// //             { label: 'Avg Total Time', value: avg('total_process_time_ms') },
// //             { label: 'Total Missed qustions', value: sumMissed },
// //         ];
// //     }, [analytics]);

// //     const StatCard = ({ label, value }) => (
// //         <div style={{
// //             background: 'var(--bg-card)',
// //             padding: '1rem',
// //             borderRadius: '0.75rem',
// //             border: '1px solid var(--border)',
// //             display: 'flex',
// //             flexDirection: 'column',
// //             gap: '0.25rem'
// //         }}>
// //             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
// //             <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{value}</span>
// //         </div>
// //     );

// //     if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;

// //     return (
// //         <div className="fade-in">
// //             {/* KPI Cards Grid */}
// //             {stats && (
// //                 <div style={{
// //                     display: 'grid',
// //                     gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
// //                     gap: '1rem',
// //                     marginBottom: '2rem'
// //                 }}>
// //                     {stats.map((s, i) => (
// //                         <StatCard key={i} label={s.label} value={s.value} />
// //                     ))}
// //                 </div>
// //             )}

// //             <div style={{
// //                 background: 'var(--bg-card)',
// //                 padding: '1.5rem',
// //                 borderRadius: '1rem',
// //                 boxShadow: 'var(--shadow)',
// //                 maxHeight: '70vh',
// //                 overflow: 'auto'
// //             }}>
// //                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
// //                     <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>
// //                         Extension Analytics ({userList.length} users)
// //                     </h3>
// //                     <button
// //                         onClick={() => setShowMissedColumn(!showMissedColumn)}
// //                         style={{
// //                             padding: '0.5rem 1rem',
// //                             fontSize: '0.75rem',
// //                             background: showMissedColumn ? 'var(--primary-light)' : 'var(--bg-main)',
// //                             color: showMissedColumn ? 'var(--primary)' : 'var(--text-muted)',
// //                             border: '1px solid var(--border)',
// //                             borderRadius: '0.5rem',
// //                             cursor: 'pointer',
// //                             fontWeight: '600'
// //                         }}
// //                     >
// //                         {showMissedColumn ? 'Hide Missed Column' : 'Show Missed Column'}
// //                     </button>
// //                 </div>

// //                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
// //                     {userList.map((user, idx) => (
// //                         <div
// //                             key={idx}
// //                             style={{
// //                                 border: '1px solid var(--border)',
// //                                 borderRadius: '0.75rem',
// //                                 overflow: 'hidden'
// //                             }}
// //                         >
// //                             {/* User Header */}
// //                             <div
// //                                 onClick={() => toggleUser(user.user_email)}
// //                                 style={{
// //                                     padding: '1rem 1.25rem',
// //                                     background: expandedUser === user.user_email ? 'var(--primary-light)' : 'var(--bg-main)',
// //                                     cursor: 'pointer',
// //                                     display: 'flex',
// //                                     justifyContent: 'space-between',
// //                                     alignItems: 'center',
// //                                     transition: 'background 0.2s'
// //                                 }}
// //                                 className="table-row-hover"
// //                             >
// //                                 <div style={{ flex: 1 }}>
// //                                     <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
// //                                         {user.user_email}
// //                                     </div>
// //                                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
// //                                         {user.total_urls} applications filled
// //                                     </div>
// //                                 </div>
// //                                 <div>
// //                                     {expandedUser === user.user_email ? (
// //                                         <ChevronUp size={18} color="var(--primary)" />
// //                                     ) : (
// //                                         <ChevronDown size={18} color="var(--text-muted)" />
// //                                     )}
// //                                 </div>
// //                             </div>

// //                             {/* Expanded Details */}
// //                             {expandedUser === user.user_email && (
// //                                 <div style={{ padding: '1rem', background: 'var(--bg-card)' }}>
// //                                     <div style={{ overflowX: 'auto' }}>
// //                                         <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
// //                                             <thead>
// //                                                 <tr style={{ background: 'var(--bg-main)' }}>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>URL</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Scan Time</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Qs</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By Rules</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By AI</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AI Calls</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Patterns Used</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mapping Time</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Success</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Failed</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Filling Time</th>
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Time</th>
// //                                                     {showMissedColumn && <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Missed</th>}
// //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date</th>
// //                                                 </tr>
// //                                             </thead>
// //                                             <tbody>
// //                                                 {user.records.map((record, ridx) => {
// //                                                     const rowKey = `${user.user_email}-${ridx}`;
// //                                                     const hasMissedQuestions = record.missed_questions && Array.isArray(record.missed_questions) && record.missed_questions.length > 0;
// //                                                     const isExpanded = expandedMissedRow === rowKey;

// //                                                     return (
// //                                                         <React.Fragment key={ridx}>
// //                                                             <tr style={{ borderBottom: '1px solid var(--border)' }}>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// //                                                                     <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.75rem' }}>
// //                                                                         {record.url}
// //                                                                     </a>
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
// //                                                                     {record.scan_duration_ms ? `${(record.scan_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '600' }}>
// //                                                                     {record.total_questions || 0}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// //                                                                     {record.mapped_by_rules || 0}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// //                                                                     {record.ai_questions_count || 0}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// //                                                                     {record.ai_calls_count || 0}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// //                                                                     {record.learned_patterns_used || 0}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
// //                                                                     {record.mapping_duration_ms ? `${(record.mapping_duration_ms / 1000).toFixed(2)}s` : '0'}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
// //                                                                     <span style={{
// //                                                                         background: '#10b98120',
// //                                                                         color: '#10b981',
// //                                                                         padding: '0.25rem 0.5rem',
// //                                                                         borderRadius: '0.5rem',
// //                                                                         fontSize: '0.7rem',
// //                                                                         fontWeight: '600'
// //                                                                     }}>
// //                                                                         {record.filled_success_count || 0}
// //                                                                     </span>
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
// //                                                                     <span style={{
// //                                                                         background: '#f59e0b20',
// //                                                                         color: '#f59e0b',
// //                                                                         padding: '0.25rem 0.5rem',
// //                                                                         borderRadius: '0.5rem',
// //                                                                         fontSize: '0.7rem',
// //                                                                         fontWeight: '600'
// //                                                                     }}>
// //                                                                         {record.filled_failed_count || 0}
// //                                                                     </span>
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
// //                                                                     {record.filling_duration_ms ? `${(record.filling_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
// //                                                                 </td>
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '600' }}>
// //                                                                     {record.total_process_time_ms ? `${(record.total_process_time_ms / 1000).toFixed(2)}s` : 'N/A'}
// //                                                                 </td>
// //                                                                 {showMissedColumn && (
// //                                                                     <td
// //                                                                         style={{
// //                                                                             padding: '0.75rem',
// //                                                                             color: 'var(--text-main)',
// //                                                                             textAlign: 'center',
// //                                                                             cursor: hasMissedQuestions ? 'pointer' : 'default'
// //                                                                         }}
// //                                                                         onClick={() => hasMissedQuestions && setExpandedMissedRow(isExpanded ? null : rowKey)}
// //                                                                     >
// //                                                                         <span style={{
// //                                                                             background: (record.missed_questions && record.missed_questions.length > 0) ? '#ef444420' : '#10b98120',
// //                                                                             color: (record.missed_questions && record.missed_questions.length > 0) ? '#ef4444' : '#10b981',
// //                                                                             padding: '0.25rem 0.5rem',
// //                                                                             borderRadius: '0.5rem',
// //                                                                             fontSize: '0.7rem',
// //                                                                             fontWeight: '600',
// //                                                                             display: 'inline-flex',
// //                                                                             alignItems: 'center',
// //                                                                             gap: '0.25rem'
// //                                                                         }}>
// //                                                                             {record.missed_questions ? record.missed_questions.length : 0}
// //                                                                             {hasMissedQuestions && (
// //                                                                                 isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
// //                                                                             )}
// //                                                                         </span>
// //                                                                     </td>
// //                                                                 )}
// //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
// //                                                                     {new Date(record.created_at).toLocaleString()}
// //                                                                 </td>
// //                                                             </tr>
// //                                                             {isExpanded && hasMissedQuestions && showMissedColumn && (
// //                                                                 <tr>
// //                                                                     <td colSpan="14" style={{ padding: '0', background: 'var(--bg-main)' }}>
// //                                                                         <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
// //                                                                             <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
// //                                                                                 Missed Questions ({record.missed_questions.length}):
// //                                                                             </div>
// //                                                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
// //                                                                                 {record.missed_questions.map((question, qidx) => (
// //                                                                                     <div
// //                                                                                         key={qidx}
// //                                                                                         style={{
// //                                                                                             padding: '0.5rem 0.75rem',
// //                                                                                             background: 'var(--bg-card)',
// //                                                                                             borderLeft: '2px solid #ef4444',
// //                                                                                             borderRadius: '0.375rem',
// //                                                                                             fontSize: '0.75rem',
// //                                                                                             color: 'var(--text-main)'
// //                                                                                         }}
// //                                                                                     >
// //                                                                                         <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontWeight: '600' }}>
// //                                                                                             {qidx + 1}.
// //                                                                                         </span>
// //                                                                                         {question}
// //                                                                                     </div>
// //                                                                                 ))}
// //                                                                             </div>
// //                                                                         </div>
// //                                                                     </td>
// //                                                                 </tr>
// //                                                             )}
// //                                                         </React.Fragment>
// //                                                     );
// //                                                 })}
// //                                             </tbody>
// //                                         </table>
// //                                     </div>
// //                                 </div>
// //                             )}
// //                         </div>
// //                     ))}

// //                     {userList.length === 0 && (
// //                         <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
// //                             No analytics data found.
// //                         </div>
// //                     )}
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default Analytics;




// // // import React, { useState, useEffect } from 'react';
// // // import { supabase } from '../lib/supabase';
// // // import { ChevronDown, ChevronUp } from 'lucide-react';

// // // const Analytics = ({ searchQuery }) => {
// // //     const [analytics, setAnalytics] = useState([]);
// // //     const [isLoading, setIsLoading] = useState(true);
// // //     const [expandedUser, setExpandedUser] = useState(null);
// // //     const [expandedMissedRow, setExpandedMissedRow] = useState(null);

// // //     useEffect(() => {
// // //         fetchAnalytics();
// // //     }, []);

// // //     const fetchAnalytics = async () => {
// // //         setIsLoading(true);
// // //         try {
// // //             const { data, error } = await supabase
// // //                 .from('extension_analytics')
// // //                 .select('*')
// // //                 .order('created_at', { ascending: false });

// // //             if (data) setAnalytics(data);
// // //         } catch (error) {
// // //             console.error('Error fetching analytics:', error);
// // //         } finally {
// // //             setIsLoading(false);
// // //         }
// // //     };

// // //     // Aggregate analytics by user_email
// // //     const userAggregates = analytics.reduce((acc, record) => {
// // //         const email = record.user_email || 'Unknown';
// // //         if (!acc[email]) {
// // //             acc[email] = {
// // //                 user_email: email,
// // //                 total_urls: 0,
// // //                 records: []
// // //             };
// // //         }
// // //         acc[email].total_urls += 1;
// // //         acc[email].records.push(record);
// // //         return acc;
// // //     }, {});

// // //     const userList = Object.values(userAggregates).filter(user =>
// // //         user.user_email.toLowerCase().includes(searchQuery.toLowerCase())
// // //     );

// // //     const toggleUser = (email) => {
// // //         setExpandedUser(expandedUser === email ? null : email);
// // //     };

// // //     if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;

// // //     return (
// // //         <div className="fade-in">
// // //             <div style={{
// // //                 background: 'var(--bg-card)',
// // //                 padding: '1.5rem',
// // //                 borderRadius: '1rem',
// // //                 boxShadow: 'var(--shadow)',
// // //                 maxHeight: '70vh',
// // //                 overflow: 'auto'
// // //             }}>
// // //                 <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
// // //                     Extension Analytics ({userList.length} users)
// // //                 </h3>

// // //                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
// // //                     {userList.map((user, idx) => (
// // //                         <div
// // //                             key={idx}
// // //                             style={{
// // //                                 border: '1px solid var(--border)',
// // //                                 borderRadius: '0.75rem',
// // //                                 overflow: 'hidden'
// // //                             }}
// // //                         >
// // //                             {/* User Header */}
// // //                             <div
// // //                                 onClick={() => toggleUser(user.user_email)}
// // //                                 style={{
// // //                                     padding: '1rem 1.25rem',
// // //                                     background: expandedUser === user.user_email ? 'var(--primary-light)' : 'var(--bg-main)',
// // //                                     cursor: 'pointer',
// // //                                     display: 'flex',
// // //                                     justifyContent: 'space-between',
// // //                                     alignItems: 'center',
// // //                                     transition: 'background 0.2s'
// // //                                 }}
// // //                                 className="table-row-hover"
// // //                             >
// // //                                 <div style={{ flex: 1 }}>
// // //                                     <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
// // //                                         {user.user_email}
// // //                                     </div>
// // //                                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
// // //                                         {user.total_urls} applications filled
// // //                                     </div>
// // //                                 </div>
// // //                                 <div>
// // //                                     {expandedUser === user.user_email ? (
// // //                                         <ChevronUp size={18} color="var(--primary)" />
// // //                                     ) : (
// // //                                         <ChevronDown size={18} color="var(--text-muted)" />
// // //                                     )}
// // //                                 </div>
// // //                             </div>

// // //                             {/* Expanded Details */}
// // //                             {expandedUser === user.user_email && (
// // //                                 <div style={{ padding: '1rem', background: 'var(--bg-card)' }}>
// // //                                     <div style={{ overflowX: 'auto' }}>
// // //                                         <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
// // //                                             <thead>
// // //                                                 <tr style={{ background: 'var(--bg-main)' }}>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>URL</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Scan Time</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Qs</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By Rules</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By AI</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AI Calls</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Patterns Used</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mapping Time</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Success</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Failed</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Filling Time</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Time</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Missed</th>
// // //                                                     <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date</th>
// // //                                                 </tr>
// // //                                             </thead>
// // //                                             <tbody>
// // //                                                 {user.records.map((record, ridx) => {
// // //                                                     const rowKey = `${user.user_email}-${ridx}`;
// // //                                                     const hasMissedQuestions = record.missed_questions && Array.isArray(record.missed_questions) && record.missed_questions.length > 0;
// // //                                                     const isExpanded = expandedMissedRow === rowKey;

// // //                                                     return (
// // //                                                         <React.Fragment key={ridx}>
// // //                                                             <tr style={{ borderBottom: '1px solid var(--border)' }}>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // //                                                                     <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.75rem' }}>
// // //                                                                         {record.url}
// // //                                                                     </a>
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
// // //                                                                     {record.scan_duration_ms ? `${(record.scan_duration_ms/1000).toFixed(2)}s` : 'N/A'}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '600' }}>
// // //                                                                     {record.total_questions || 0}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// // //                                                                     {record.mapped_by_rules || 0}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// // //                                                                     {record.ai_questions_count || 0}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// // //                                                                     {record.ai_calls_count || 0}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
// // //                                                                     {record.learned_patterns_used || 0}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
// // //                                                                     {record.mapping_duration_ms ? `${(record.mapping_duration_ms / 1000).toFixed(2)}s` : '0'}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
// // //                                                                     <span style={{
// // //                                                                         background: '#10b98120',
// // //                                                                         color: '#10b981',
// // //                                                                         padding: '0.25rem 0.5rem',
// // //                                                                         borderRadius: '0.5rem',
// // //                                                                         fontSize: '0.7rem',
// // //                                                                         fontWeight: '600'
// // //                                                                     }}>
// // //                                                                         {record.filled_success_count || 0}
// // //                                                                     </span>
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
// // //                                                                     <span style={{
// // //                                                                         background: '#f59e0b20',
// // //                                                                         color: '#f59e0b',
// // //                                                                         padding: '0.25rem 0.5rem',
// // //                                                                         borderRadius: '0.5rem',
// // //                                                                         fontSize: '0.7rem',
// // //                                                                         fontWeight: '600'
// // //                                                                     }}>
// // //                                                                         {record.filled_failed_count || 0}
// // //                                                                     </span>
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
// // //                                                                     {record.filling_duration_ms ? `${(record.filling_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '600' }}>
// // //                                                                     {record.total_process_time_ms ? `${(record.total_process_time_ms / 1000).toFixed(2)}s` : 'N/A'}
// // //                                                                 </td>
// // //                                                                 <td
// // //                                                                     style={{
// // //                                                                         padding: '0.75rem',
// // //                                                                         color: 'var(--text-main)',
// // //                                                                         textAlign: 'center',
// // //                                                                         cursor: hasMissedQuestions ? 'pointer' : 'default'
// // //                                                                     }}
// // //                                                                     onClick={() => hasMissedQuestions && setExpandedMissedRow(isExpanded ? null : rowKey)}
// // //                                                                 >
// // //                                                                     <span style={{
// // //                                                                         background: record.missed_questions > 0 ? '#ef444420' : '#10b98120',
// // //                                                                         color: record.missed_questions > 0 ? '#ef4444' : '#10b981',
// // //                                                                         padding: '0.25rem 0.5rem',
// // //                                                                         borderRadius: '0.5rem',
// // //                                                                         fontSize: '0.7rem',
// // //                                                                         fontWeight: '600',
// // //                                                                         display: 'inline-flex',
// // //                                                                         alignItems: 'center',
// // //                                                                         gap: '0.25rem'
// // //                                                                     }}>
// // //                                                                         {record.missed_questions || 0}
// // //                                                                         {hasMissedQuestions && (
// // //                                                                             isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
// // //                                                                         )}
// // //                                                                     </span>
// // //                                                                 </td>
// // //                                                                 <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
// // //                                                                     {new Date(record.created_at).toLocaleString()}
// // //                                                                 </td>
// // //                                                             </tr>
// // //                                                             {isExpanded && hasMissedQuestions && (
// // //                                                                 <tr>
// // //                                                                     <td colSpan="14" style={{ padding: '0', background: 'var(--bg-main)' }}>
// // //                                                                         <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
// // //                                                                             <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
// // //                                                                                 Missed Questions ({record.missed_questions.length}):
// // //                                                                             </div>
// // //                                                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
// // //                                                                                 {record.missed_questions.map((question, qidx) => (
// // //                                                                                     <div
// // //                                                                                         key={qidx}
// // //                                                                                         style={{
// // //                                                                                             padding: '0.5rem 0.75rem',
// // //                                                                                             background: 'var(--bg-card)',
// // //                                                                                             borderLeft: '2px solid #ef4444',
// // //                                                                                             borderRadius: '0.375rem',
// // //                                                                                             fontSize: '0.75rem',
// // //                                                                                             color: 'var(--text-main)'
// // //                                                                                         }}
// // //                                                                                     >
// // //                                                                                         <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontWeight: '600' }}>
// // //                                                                                             {qidx + 1}.
// // //                                                                                         </span>
// // //                                                                                         {question}
// // //                                                                                     </div>
// // //                                                                                 ))}
// // //                                                                             </div>
// // //                                                                         </div>
// // //                                                                     </td>
// // //                                                                 </tr>
// // //                                                             )}
// // //                                                         </React.Fragment>
// // //                                                     );
// // //                                                 })}
// // //                                             </tbody>
// // //                                         </table>
// // //                                     </div>
// // //                                 </div>
// // //                             )}
// // //                         </div>
// // //                     ))}

// // //                     {userList.length === 0 && (
// // //                         <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
// // //                             No analytics data found.
// // //                         </div>
// // //                     )}
// // //                 </div>
// // //             </div>
// // //         </div>
// // //     );
// // // };

// // // export default Analytics;









import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Analytics = ({ searchQuery, dateRange, customDates }) => {
    const [analytics, setAnalytics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const [expandedMissedRow, setExpandedMissedRow] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, customDates]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            // Calculate start and end dates based on filter (Sync with Dashboard.jsx)
            let startDate = new Date();
            let endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            if (dateRange === 'Today') {
                startDate.setHours(0, 0, 0, 0);
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
                startDate.setDate(startDate.getDate() - 365); // Default or All Time
                startDate.setHours(0, 0, 0, 0);
            }

            const { data, error } = await supabase
                .from('extension_analytics')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false });

            if (data) setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Aggregate analytics by date
    const dateAggregates = analytics.reduce((acc, record) => {
        const date = new Date(record.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        if (!acc[date]) {
            acc[date] = {
                date: date,
                total_scans: 0,
                records: []
            };
        }
        acc[date].total_scans += 1;
        acc[date].records.push(record);
        return acc;
    }, {});

    const dateList = Object.values(dateAggregates).map(dateGroup => ({
        ...dateGroup,
        records: dateGroup.records.filter(record =>
            (record.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (record.url || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.records.length > 0);

    const toggleDate = (date) => {
        setExpandedUser(expandedUser === date ? null : date);
    };

    const [showMissedColumn, setShowMissedColumn] = useState(false);

    // Calculate aggregated stats
    const stats = React.useMemo(() => {
        let filteredData = analytics;
        if (expandedUser) {
            filteredData = analytics.filter(record => {
                const recordDate = new Date(record.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
                return recordDate === expandedUser;
            });
        }

        const totalScans = filteredData.length;
        if (totalScans === 0 && !expandedUser) return null;

        const sum = (key) => filteredData.reduce((acc, r) => acc + (r[key] || 0), 0);
        // Special handling for missed_questions which is an array
        const sumMissed = filteredData.reduce((acc, r) => acc + (Array.isArray(r.missed_questions) ? r.missed_questions.length : 0), 0);

        // Helper for average time (ms -> seconds string)
        const avg = (key) => {
            if (totalScans === 0) return '0s';
            const totalMs = sum(key);
            return (totalMs / totalScans / 1000).toFixed(2) + 's';
        };

        return [
            { label: 'Total Scans', value: totalScans },
            { label: 'Avg Scan Time', value: avg('scan_duration_ms') },
            { label: 'Total Qs', value: sum('total_questions') },
            { label: 'Questions mapped by Rules', value: sum('mapped_by_rules') },
            { label: 'Questions asked to AI', value: sum('ai_questions_count') },
            { label: 'Total AI Calls', value: sum('ai_calls_count') },
            { label: 'Patterns Used', value: sum('learned_patterns_used') },
            { label: 'Avg Mapping Time', value: avg('mapping_duration_ms') },
            { label: 'Success questions', value: sum('filled_success_count') },
            { label: 'Failed questions', value: sum('filled_failed_count') },
            { label: 'Avg Filling Time', value: avg('filling_duration_ms') },
            { label: 'Avg Total Time', value: avg('total_process_time_ms') },
            { label: 'Total Missed qustions', value: sumMissed },
        ];
    }, [analytics, expandedUser]);

    const StatCard = ({ label, value }) => (
        <div style={{
            background: 'var(--bg-card)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
        }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{value}</span>
        </div>
    );

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;

    return (
        <div className="fade-in">
            {/* KPI Cards Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {expandedUser ? `Statistics for ${expandedUser}` : 'Overall Statistics'}
                        {expandedUser && (
                            <span style={{
                                fontSize: '0.65rem',
                                padding: '0.25rem 0.5rem',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                borderRadius: '1rem',
                                fontWeight: '700'
                            }}>
                                FILTERED
                            </span>
                        )}
                    </h2>
                    {expandedUser && (
                        <button
                            onClick={() => setExpandedUser(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem'
                            }}
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '1rem'
                    }}>
                        {stats.map((s, i) => (
                            <StatCard key={i} label={s.label} value={s.value} />
                        ))}
                    </div>
                )}
            </div>

            <div style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: 'var(--shadow)',
                maxHeight: '70vh',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        Extension Analytics ({dateList.length} dates)
                    </h3>
                    <button
                        onClick={() => setShowMissedColumn(!showMissedColumn)}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            background: showMissedColumn ? 'var(--primary-light)' : 'var(--bg-main)',
                            color: showMissedColumn ? 'var(--primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {showMissedColumn ? 'Hide Missed Column' : 'Show Missed Column'}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {dateList.map((dateGroup, idx) => (
                        <div
                            key={idx}
                            style={{
                                border: '1px solid var(--border)',
                                borderRadius: '0.75rem',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Date Header */}
                            <div
                                onClick={() => toggleDate(dateGroup.date)}
                                style={{
                                    padding: '1rem 1.25rem',
                                    background: expandedUser === dateGroup.date ? 'var(--primary-light)' : 'var(--bg-main)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background 0.2s'
                                }}
                                className="table-row-hover"
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                        {dateGroup.date}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {dateGroup.total_scans} scans recorded
                                    </div>
                                </div>
                                <div>
                                    {expandedUser === dateGroup.date ? (
                                        <ChevronUp size={18} color="var(--primary)" />
                                    ) : (
                                        <ChevronDown size={18} color="var(--text-muted)" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedUser === dateGroup.date && (
                                <div style={{ padding: '1rem', background: 'var(--bg-card)' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-main)' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>User</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>URL</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Scan Time</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Qs</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By Rules</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>By AI</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AI Calls</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Patterns Used</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mapping Time</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Success</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Failed</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Filling Time</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Time</th>
                                                    {showMissedColumn && <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Missed</th>}
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dateGroup.records.map((record, ridx) => {
                                                    const rowKey = `${dateGroup.date}-${ridx}`;
                                                    const hasMissedQuestions = record.missed_questions && Array.isArray(record.missed_questions) && record.missed_questions.length > 0;
                                                    const isExpanded = expandedMissedRow === rowKey;

                                                    return (
                                                        <React.Fragment key={ridx}>
                                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '500' }}>
                                                                    {record.user_email || 'Unknown'}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.75rem' }}>
                                                                        {record.url}
                                                                    </a>
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                                                    {record.scan_duration_ms ? `${(record.scan_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '600' }}>
                                                                    {record.total_questions || 0}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
                                                                    {record.mapped_by_rules || 0}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
                                                                    {record.ai_questions_count || 0}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
                                                                    {record.ai_calls_count || 0}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'center' }}>
                                                                    {record.learned_patterns_used || 0}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                                                    {record.mapping_duration_ms ? `${(record.mapping_duration_ms / 1000).toFixed(2)}s` : '0'}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
                                                                    <span style={{
                                                                        background: '#10b98120',
                                                                        color: '#10b981',
                                                                        padding: '0.25rem 0.5rem',
                                                                        borderRadius: '0.5rem',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        {record.filled_success_count || 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>
                                                                    <span style={{
                                                                        background: '#f59e0b20',
                                                                        color: '#f59e0b',
                                                                        padding: '0.25rem 0.5rem',
                                                                        borderRadius: '0.5rem',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        {record.filled_failed_count || 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                                                    {record.filling_duration_ms ? `${(record.filling_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                                                                </td>
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '600' }}>
                                                                    {record.total_process_time_ms ? `${(record.total_process_time_ms / 1000).toFixed(2)}s` : 'N/A'}
                                                                </td>
                                                                {showMissedColumn && (
                                                                    <td
                                                                        style={{
                                                                            padding: '0.75rem',
                                                                            color: 'var(--text-main)',
                                                                            textAlign: 'center',
                                                                            cursor: hasMissedQuestions ? 'pointer' : 'default'
                                                                        }}
                                                                        onClick={() => hasMissedQuestions && setExpandedMissedRow(isExpanded ? null : rowKey)}
                                                                    >
                                                                        <span style={{
                                                                            background: (record.missed_questions && record.missed_questions.length > 0) ? '#ef444420' : '#10b98120',
                                                                            color: (record.missed_questions && record.missed_questions.length > 0) ? '#ef4444' : '#10b981',
                                                                            padding: '0.25rem 0.5rem',
                                                                            borderRadius: '0.5rem',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: '600',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.25rem'
                                                                        }}>
                                                                            {record.missed_questions ? record.missed_questions.length : 0}
                                                                            {hasMissedQuestions && (
                                                                                isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                                                            )}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td style={{ padding: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                                                                    {new Date(record.created_at).toLocaleTimeString()}
                                                                </td>
                                                            </tr>
                                                            {isExpanded && hasMissedQuestions && showMissedColumn && (
                                                                <tr>
                                                                    <td colSpan="15" style={{ padding: '0', background: 'var(--bg-main)' }}>
                                                                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                                                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                                                                                Missed Questions ({record.missed_questions.length}):
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                                {record.missed_questions.map((question, qidx) => (
                                                                                    <div
                                                                                        key={qidx}
                                                                                        style={{
                                                                                            padding: '0.5rem 0.75rem',
                                                                                            background: 'var(--bg-card)',
                                                                                            borderLeft: '2px solid #ef4444',
                                                                                            borderRadius: '0.375rem',
                                                                                            fontSize: '0.75rem',
                                                                                            color: 'var(--text-main)'
                                                                                        }}
                                                                                    >
                                                                                        <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontWeight: '600' }}>
                                                                                            {qidx + 1}.
                                                                                        </span>
                                                                                        {question}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {dateList.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No analytics data found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;


