import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [50, 100, 500],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(validCurrentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 px-1 text-xs text-slate-400 font-sans border-t border-slate-800/60">
      {/* Left: Items per page selector & showing count */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const val = Number(e.target.value);
              onItemsPerPageChange(val);
              onPageChange(1);
            }}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option >= 10000 ? 'All' : option}
              </option>
            ))}
            {!pageSizeOptions.includes(100000) && (
              <option value={100000}>All</option>
            )}
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing <span className="text-slate-200 font-bold">{startItem}</span> -{' '}
          <span className="text-slate-200 font-bold">{endItem}</span> of{' '}
          <span className="text-indigo-400 font-bold">{totalItems}</span>
        </div>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center space-x-1.5">
        <span className="text-slate-400 mr-2 text-[11px]">
          Page <span className="text-slate-200 font-bold">{validCurrentPage}</span> of{' '}
          <span className="text-slate-200 font-bold">{totalPages}</span>
        </span>

        <button
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage === 1}
          className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage === 1}
          className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage === totalPages}
          className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={validCurrentPage === totalPages}
          className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
