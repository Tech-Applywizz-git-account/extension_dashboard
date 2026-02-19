import React from 'react';
import { ChevronRight, ArrowUpDown } from 'lucide-react';

export const DataTable = ({ title, data, columns, onViewAll, showActions = true }) => {
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
                                <th key={idx} style={{
                                    padding: '1rem 1.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {typeof col.header === 'string' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {col.header}
                                            <ArrowUpDown size={12} />
                                        </div>
                                    ) : col.header}
                                </th>
                            ))}
                            {showActions && <th style={{ padding: '1rem 1.5rem' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {showActions && (
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <button style={{
                                            border: 'none',
                                            background: 'var(--primary-light)',
                                            color: 'var(--primary)',
                                            padding: '0.4rem',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer'
                                        }}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {data.length === 0 && (
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

// import React from 'react';
// import { ChevronRight, ArrowUpDown } from 'lucide-react';

// export const DataTable = ({ title, data, columns, hideHeader = false }) => {
//     return (
//         <div className="card" style={{ padding: '0', background: 'var(--bg-card)', borderRadius: '1rem', overflow: 'hidden' }}>
//             {title && (
//                 <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>{title}</h3>
//                     <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View All</button>
//                 </div>
//             )}
//             <div style={{ overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
//                     <thead>
//                         <tr style={{ background: 'var(--bg-main)' }}>
//                             {columns.map((col, idx) => (
//                                 <th key={idx} style={{
//                                     padding: '1rem 1.5rem',
//                                     fontSize: '0.75rem',
//                                     fontWeight: '600',
//                                     color: 'var(--text-muted)',
//                                     textTransform: 'uppercase',
//                                     letterSpacing: '0.05em'
//                                 }}>
//                                     {typeof col.header === 'string' ? (
//                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//                                             {col.header}
//                                             <ArrowUpDown size={12} />
//                                         </div>
//                                     ) : col.header}
//                                 </th>
//                             ))}
//                             <th style={{ padding: '1rem 1.5rem' }}></th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {data.map((row, rowIdx) => (
//                             <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
//                                 {columns.map((col, colIdx) => (
//                                     <td key={colIdx} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
//                                         {col.render ? col.render(row[col.key], row) : row[col.key]}
//                                     </td>
//                                 ))}
//                                 <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
//                                     <button style={{
//                                         border: 'none',
//                                         background: 'var(--primary-light)',
//                                         color: 'var(--primary)',
//                                         padding: '0.4rem',
//                                         borderRadius: '0.5rem',
//                                         cursor: 'pointer'
//                                     }}>
//                                         <ChevronRight size={16} />
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                         {data.length === 0 && (
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



