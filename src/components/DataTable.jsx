// import React, { useState } from 'react';
// import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// export const DataTable = ({ title, data, columns, onViewAll, showActions = true }) => {
//     const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

//     const handleSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });
//     };

//     const sortedData = React.useMemo(() => {
//         if (!sortConfig.key) return data;

//         return [...data].sort((a, b) => {
//             let aVal = a[sortConfig.key];
//             let bVal = b[sortConfig.key];

//             // Handle cases where value is inside a nested object if needed, 
//             // but for now assume flat keys or handled by render

//             if (aVal === bVal) return 0;
//             if (aVal === null || aVal === undefined) return 1;
//             if (bVal === null || bVal === undefined) return -1;

//             if (typeof aVal === 'string') {
//                 return sortConfig.direction === 'asc'
//                     ? aVal.localeCompare(bVal)
//                     : bVal.localeCompare(aVal);
//             }

//             return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
//         });
//     }, [data, sortConfig]);

//     const SortIcon = ({ columnKey }) => {
//         if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} color="var(--text-muted)" />;
//         return sortConfig.direction === 'asc'
//             ? <ArrowUp size={12} color="var(--primary)" />
//             : <ArrowDown size={12} color="var(--primary)" />;
//     };

//     return (
//         <div className="card" style={{ padding: '0', background: 'var(--bg-card)', borderRadius: '1rem', overflow: 'hidden' }}>
//             {title && (
//                 <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>{title}</h3>
//                     {onViewAll && (
//                         <button
//                             className="btn-primary"
//                             style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
//                             onClick={onViewAll}
//                         >
//                             View All
//                         </button>
//                     )}
//                 </div>
//             )}
//             <div style={{ overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
//                     <thead>
//                         <tr style={{ background: 'var(--bg-main)' }}>
//                             {columns.map((col, idx) => (
//                                 <th
//                                     key={idx}
//                                     onClick={() => typeof col.header === 'string' && col.key && handleSort(col.key)}
//                                     style={{
//                                         padding: '1rem 1.5rem',
//                                         fontSize: '0.75rem',
//                                         fontWeight: '600',
//                                         color: sortConfig.key === col.key ? 'var(--primary)' : 'var(--text-muted)',
//                                         textTransform: 'uppercase',
//                                         letterSpacing: '0.05em',
//                                         cursor: typeof col.header === 'string' && col.key ? 'pointer' : 'default',
//                                         userSelect: 'none',
//                                         transition: 'all 0.2s'
//                                     }}
//                                 >
//                                     {typeof col.header === 'string' ? (
//                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//                                             {col.header}
//                                             {col.key && <SortIcon columnKey={col.key} />}
//                                         </div>
//                                     ) : col.header}
//                                 </th>
//                             ))}
//                             {showActions && <th style={{ padding: '1rem 1.5rem' }}></th>}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {sortedData.map((row, rowIdx) => (
//                             <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
//                                 {columns.map((col, colIdx) => (
//                                     <td key={colIdx} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
//                                         {col.render ? col.render(row[col.key], row) : row[col.key]}
//                                     </td>
//                                 ))}
//                                 {showActions && (
//                                     <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
//                                         <button style={{
//                                             border: 'none',
//                                             background: 'var(--primary-light)',
//                                             color: 'var(--primary)',
//                                             padding: '0.4rem',
//                                             borderRadius: '0.5rem',
//                                             cursor: 'pointer'
//                                         }}>
//                                             <ChevronRight size={16} />
//                                         </button>
//                                     </td>
//                                 )}
//                             </tr>
//                         ))}
//                         {sortedData.length === 0 && (
//                             <tr>
//                                 <td colSpan={columns.length + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
//                                     No data found matching your filters.
//                                 </td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// // Add hover styles via CSS-in-JS or just use the global CSS
// const style = document.createElement('style');
// style.textContent = `
//   .table-row-hover:hover {
//     background-color: var(--primary-light);
//   }
// `;
// document.head.appendChild(style);












import React, { useState } from 'react';
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const DataTable = ({ title, data, columns, onViewAll, onAction, renderExpandable, showActions = true, rowKey = 'id' }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [expandedRowKey, setExpandedRowKey] = useState(null);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleExpand = (key) => {
        setExpandedRowKey(expandedRowKey === key ? null : key);
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [data, sortConfig]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} color="var(--text-muted)" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={12} color="var(--primary)" />
            : <ArrowDown size={12} color="var(--primary)" />;
    };

    return (
        <div className="card" style={{ padding: '0', background: 'var(--bg-card)', borderRadius: '1rem', overflow: 'hidden' }}>
            {title && (
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>{title}</h3>
                    {onViewAll && (
                        <button
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={onViewAll}
                        >
                            View All
                        </button>
                    )}
                </div>
            )}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-main)' }}>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => typeof col.header === 'string' && col.key && handleSort(col.key)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: sortConfig.key === col.key ? 'var(--primary)' : 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        cursor: typeof col.header === 'string' && col.key ? 'pointer' : 'default',
                                        userSelect: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {typeof col.header === 'string' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {col.header}
                                            {col.key && <SortIcon columnKey={col.key} />}
                                        </div>
                                    ) : col.header}
                                </th>
                            ))}
                            {(showActions || renderExpandable) && <th style={{ padding: '1rem 1.5rem' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, rowIdx) => {
                            const isExpanded = expandedRowKey === row[rowKey];
                            return (
                                <React.Fragment key={rowIdx}>
                                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                                            </td>
                                        ))}
                                        {(showActions || renderExpandable) && (
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => {
                                                        if (renderExpandable) {
                                                            toggleExpand(row[rowKey]);
                                                        } else if (onAction) {
                                                            onAction(row);
                                                        }
                                                    }}
                                                    style={{
                                                        border: 'none',
                                                        background: isExpanded ? 'var(--primary)' : 'var(--primary-light)',
                                                        color: isExpanded ? 'white' : 'var(--primary)',
                                                        padding: '0.4rem',
                                                        borderRadius: '0.5rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        transform: isExpanded ? 'rotate(90deg)' : 'none'
                                                    }}
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                    {isExpanded && renderExpandable && (
                                        <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                                            <td colSpan={columns.length + 1} style={{ padding: '0' }}>
                                                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                                    {renderExpandable(row)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No data found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Add hover styles via CSS-in-JS or just use the global CSS
const style = document.createElement('style');
style.textContent = `
  .table-row-hover:hover {
    background-color: var(--primary-light);
  }
`;
document.head.appendChild(style);
