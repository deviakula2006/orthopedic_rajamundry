import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, SearchX } from 'lucide-react';

/**
 * Table — modern data table component
 *
 * Props:
 *   columns      Array<{ key, header, sortable?, render? }>
 *   data         Array<object>
 *   searchKey    string   (legacy — unused in internal search; kept for compat)
 *   emptyMessage string
 *   actions      (row) => ReactNode | null
 *   isLoading    boolean
 *   itemsPerPage number
 */
export const Table = ({
  columns,
  data,
  searchKey = 'name',
  emptyMessage = 'No records found',
  actions = null,
  isLoading = false,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const av = a[sortConfig.key] ?? '';
      const bv = b[sortConfig.key] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);

  const pageData = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, safePage, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
    setCurrentPage(1);
  };

  const colSpan = columns.length + (actions ? 1 : 0);

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortConfig.key !== col.key) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp   className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;
  };

  // Page number buttons — show max 5
  const pageButtons = useMemo(() => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, safePage - delta);
    const right = Math.min(totalPages, safePage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div>
      {/* data-table-wrapper: white card, no overflow:hidden so portal dropdowns escape */}
      <div className="data-table-wrapper">

        {/* Horizontal scroll container */}
        <div style={{ overflowX: 'auto', borderRadius: '12px 12px 0 0' }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.header}
                      <SortIcon col={col} />
                    </div>
                  </th>
                ))}
                {actions && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, idx) => (
                  <tr key={`sk-${idx}`}>
                    {columns.map(col => (
                      <td key={col.key}>
                        <div className="skeleton" style={{ height: 12, width: `${60 + Math.random() * 30}%`, borderRadius: 6 }} />
                      </td>
                    ))}
                    {actions && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <div className="skeleton" style={{ height: 28, width: 28, borderRadius: 6 }} />
                          <div className="skeleton" style={{ height: 28, width: 28, borderRadius: 6 }} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', gap: '0.75rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                        <SearchX style={{ width: 20, height: 20 }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>{emptyMessage}</p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Try adjusting your filters or search.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((row, ri) => (
                  <tr key={row.id ?? ri}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                    {actions && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!isLoading && sortedData.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid #f1f3f4' }}
          >
            <span style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
              {(safePage - 1) * itemsPerPage + 1}–{Math.min(sortedData.length, safePage * itemsPerPage)} of {sortedData.length} entries
            </span>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PagBtn onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} aria-label="Previous page">
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </PagBtn>

                {pageButtons[0] > 1 && (
                  <>
                    <PagBtn onClick={() => setCurrentPage(1)}>1</PagBtn>
                    {pageButtons[0] > 2 && <span style={{ color: '#9ca3af', fontSize: 12, padding: '0 2px' }}>…</span>}
                  </>
                )}

                {pageButtons.map(p => (
                  <PagBtn key={p} onClick={() => setCurrentPage(p)} active={p === safePage}>{p}</PagBtn>
                ))}

                {pageButtons[pageButtons.length - 1] < totalPages && (
                  <>
                    {pageButtons[pageButtons.length - 1] < totalPages - 1 && (
                      <span style={{ color: '#9ca3af', fontSize: 12, padding: '0 2px' }}>…</span>
                    )}
                    <PagBtn onClick={() => setCurrentPage(totalPages)}>{totalPages}</PagBtn>
                  </>
                )}

                <PagBtn onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} aria-label="Next page">
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </PagBtn>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};


// Pagination button helper
const PagBtn = ({ children, onClick, disabled, active, ...rest }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    {...rest}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 28, padding: '0 6px',
      borderRadius: 6,
      fontSize: '0.75rem', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      background: active ? '#2278e8' : 'transparent',
      color: active ? '#ffffff' : '#374151',
      border: active ? 'none' : '1px solid #e5e7eb',
      transition: 'all 100ms',
    }}
    onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = '#f3f4f6'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);
