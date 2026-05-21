import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, AlertCircle } from 'lucide-react';

export const Table = ({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey = "name",
  filterElement = null,
  emptyMessage = "No records found",
  actions = null,
  isLoading = false,
  itemsPerPage = 5
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle Search & Filtering
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim() !== '') {
      result = result.filter((item) => {
        const value = item[searchKey];
        if (value === undefined || value === null) return false;
        return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchKey, sortConfig]);

  // Handle Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  
  // Reset page when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {filterElement}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-premium">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-slate-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <ChevronsUpDown className="h-3 w-3" />}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: itemsPerPage }).map((_, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 rounded bg-slate-200/80 skeleton w-3/4"></div>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <div className="h-7 w-7 rounded bg-slate-200/80 skeleton"></div>
                      <div className="h-7 w-7 rounded bg-slate-200/80 skeleton"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{emptyMessage}</h4>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Data State
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm font-medium text-slate-700">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredData.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold text-slate-400">
            Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
            {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-hospital-500 text-white shadow-premium'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
