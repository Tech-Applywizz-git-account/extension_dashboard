import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const Feedback = ({ searchQuery, dateRange, customDates }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                // Transform screenshot_url to proper Supabase public URLs
                const transformedData = data.map(feedback => {
                    if (feedback.screenshot_url) {
                        // If it's already a full URL, use it as is
                        if (feedback.screenshot_url.startsWith('http')) {
                            return feedback;
                        }

                        // Otherwise, generate public URL from Supabase storage
                        const { data: publicUrlData } = supabase
                            .storage
                            .from('feedback_screenshots')
                            .getPublicUrl(feedback.screenshot_url);

                        return {
                            ...feedback,
                            screenshot_url: publicUrlData?.publicUrl || feedback.screenshot_url
                        };
                    }
                    return feedback;
                });
                setFeedbacks(transformedData);
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Date filtering
    const getDateFilteredFeedbacks = () => {
        if (!dateRange || dateRange === 'All Time') return feedbacks;

        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        if (dateRange === 'Custom Range' && customDates?.start && customDates?.end) {
            startDate = new Date(customDates.start);
            endDate = new Date(customDates.end);
            endDate.setHours(23, 59, 59, 999);
        } else if (dateRange === 'Last 7 Days') {
            startDate.setDate(now.getDate() - 7);
        } else if (dateRange === 'Last 30 Days') {
            startDate.setDate(now.getDate() - 30);
        } else if (dateRange === 'Last 90 Days') {
            startDate.setDate(now.getDate() - 90);
        }

        return feedbacks.filter(f => {
            if (!f.created_at) return false;
            const feedbackDate = new Date(f.created_at);
            return feedbackDate >= startDate && feedbackDate <= endDate;
        });
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedFeedbacks = (feedbackList) => {
        if (!sortConfig.key) return feedbackList;

        return [...feedbackList].sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';

            if (sortConfig.key === 'created_at') {
                return sortConfig.direction === 'asc'
                    ? new Date(aVal) - new Date(bVal)
                    : new Date(bVal) - new Date(aVal);
            }

            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    };

    const dateFilteredFeedbacks = getDateFilteredFeedbacks();

    const searchFilteredFeedbacks = dateFilteredFeedbacks.filter(f =>
        (f.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.feedback_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFeedbacks = getSortedFeedbacks(searchFilteredFeedbacks);

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={12} color="var(--text-muted)" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={12} color="var(--primary)" />
            : <ArrowDown size={12} color="var(--primary)" />;
    };

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading feedbacks...</div>;

    return (
        <div className="fade-in">
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 500px',
                gap: '1.5rem',
                alignItems: 'start',
                overflow: 'hidden'
            }}>
                {/* Left side - Feedback list */}
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
                            Feedbacks ({filteredFeedbacks.length})
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <button
                                onClick={() => handleSort('created_at')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.6rem',
                                    background: sortConfig.key === 'created_at' ? 'var(--primary-light)' : 'var(--bg-main)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Date <SortIcon column="created_at" />
                            </button>
                            <button
                                onClick={() => handleSort('feedback_type')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.6rem',
                                    background: sortConfig.key === 'feedback_type' ? 'var(--primary-light)' : 'var(--bg-main)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Type <SortIcon column="feedback_type" />
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredFeedbacks.map((feedback) => (
                            <div
                                key={feedback.id}
                                onClick={() => setSelectedFeedback(feedback)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    background: selectedFeedback?.id === feedback.id ? 'var(--primary-light)' : 'var(--bg-main)',
                                    transition: 'all 0.2s'
                                }}
                                className="table-row-hover"
                            >
                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                    <MessageSquare size={18} color="var(--primary)" style={{ marginTop: '0.2rem' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                            {feedback.email || 'No email'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            {feedback.feedback_type || 'General'} • {new Date(feedback.created_at).toLocaleDateString()}
                                        </div>
                                        {feedback.description && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {feedback.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredFeedbacks.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No feedbacks found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side - Feedback details */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow)',
                    maxHeight: '70vh',
                    overflow: 'auto'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                        {selectedFeedback ? 'Feedback Details' : 'Select a feedback to view'}
                    </h3>
                    {selectedFeedback ? (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '500' }}>{selectedFeedback.email || 'N/A'}</div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Type</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '500' }}>{selectedFeedback.feedback_type || 'General'}</div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Submitted</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{new Date(selectedFeedback.created_at).toLocaleString()}</div>
                            </div>

                            {selectedFeedback.username && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Username</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{selectedFeedback.username}</div>
                                </div>
                            )}

                            {selectedFeedback.description && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Description</div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-main)',
                                        lineHeight: '1.6',
                                        background: 'var(--bg-main)',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem'
                                    }}>
                                        {selectedFeedback.description}
                                    </div>
                                </div>
                            )}

                            {selectedFeedback.screenshot_url && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Screenshot</div>
                                    <img
                                        src={selectedFeedback.screenshot_url}
                                        alt="Feedback screenshot"
                                        style={{
                                            width: '100%',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--border)'
                                        }}
                                        onError={(e) => {
                                            console.error('Failed to load image:', selectedFeedback.screenshot_url);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div style={{ display: 'none', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '0.5rem' }}>
                                        Screenshot not available
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Click on a feedback from the left to view details and screenshot.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feedback;
