import React, { useState, useEffect } from 'react';
import { Smartphone, Plus, Trash2, Edit, FileSpreadsheet, Search, X } from 'lucide-react';
import { SIMItem } from '../types';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface SIMTabProps {
  sims: SIMItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAddSIMModal: () => void;
  onOpenEditSIMModal?: (sim: SIMItem) => void;
  onDeleteSIM: (id: string) => void;
  onBulkDeleteSIMs?: (ids: string[]) => void;
}

export const SIMTab: React.FC<SIMTabProps> = ({
  sims,
  searchQuery = '',
  onSearchChange,
  onOpenAddSIMModal,
  onOpenEditSIMModal,
  onDeleteSIM,
  onBulkDeleteSIMs,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, localSearch]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  const filteredSIMs = sims.filter((s) => {
    if (!effectiveSearch.trim()) return true;
    const q = effectiveSearch.toLowerCase();
    return (
      (s.simNumber || '').toLowerCase().includes(q) ||
      (s.operator || '').toLowerCase().includes(q) ||
      (s.assignedDevice || '').toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q) ||
      (s.status || '').toLowerCase().includes(q) ||
      ((s as any).ipAddress || '').toLowerCase().includes(q)
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSIMs = filteredSIMs.slice(startIndex, startIndex + itemsPerPage);

  const validSelectedIds = selectedIds.filter((id) =>
    filteredSIMs.some((s) => s.id === id)
  );

  const isAllSelected =
    filteredSIMs.length > 0 &&
    filteredSIMs.every((s) => validSelectedIds.includes(s.id));

  const isSomeSelected =
    filteredSIMs.some((s) => validSelectedIds.includes(s.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSIMs.map((s) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (validSelectedIds.length === 0) return;
    if (onBulkDeleteSIMs) {
      onBulkDeleteSIMs(validSelectedIds);
    } else {
      validSelectedIds.forEach((id) => onDeleteSIM(id));
    }
    setSelectedIds([]);
  };

  const handleExportExcel = () => {
    const headers = ['SL', 'SIM Number', 'Operator', 'Assigned Device', 'Location', 'Status'];
    const rows = filteredSIMs.map((s, index) => [
      index + 1,
      s.simNumber,
      s.operator,
      s.assignedDevice || 'Unassigned',
      s.location || '-',
      s.status || 'ACTIVE',
    ]);

    const activeCount = filteredSIMs.filter((s) => s.status === 'ACTIVE').length;

    downloadStyledExcel({
      title: 'Cellular SIM Inventory & Assignment Report',
      subtitle: 'Cellular Connectivity Audit Report',
      filename: 'SIM_Inventory_Report.xls',
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total SIM Cards', value: filteredSIMs.length },
        { label: 'Active SIMs', value: activeCount },
        { label: 'Inactive SIMs', value: filteredSIMs.length - activeCount },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-lg flex justify-between items-center shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center">
          <Smartphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mr-2" />
          Cellular SIM Inventory & Assignment
        </h2>
        <div className="flex items-center space-x-2">
          {/* Realtime Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search SIMs..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all w-40 sm:w-52 focus:w-60 shadow-xs"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {validSelectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer font-bold text-xs animate-pulse"
              title="Delete selected SIM cards"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({validSelectedIds.length})
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={onOpenAddSIMModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add SIM
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-4 space-y-3 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                    title="Select or deselect all SIM cards"
                  />
                </th>
                <th className="p-3">SIM Number</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Assigned Device</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-300">
              {sims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500 font-sans">
                    No SIM cards registered.
                  </td>
                </tr>
              ) : (
                paginatedSIMs.map((sim) => {
                  const isSelected = validSelectedIds.includes(sim.id);
                  return (
                    <tr
                      key={sim.id}
                      className={
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(sim.id)}
                          className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{sim.simNumber}</td>
                    <td className="p-3 font-sans font-bold text-blue-600 dark:text-blue-400">
                      {sim.operator}
                    </td>
                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">{sim.assignedDevice}</td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300">{sim.location}</td>
                    <td className="p-3">
                      {sim.status === 'ACTIVE' ? (
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] border border-emerald-300 dark:border-emerald-700/50 font-semibold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] border border-rose-300 dark:border-rose-700/50 font-semibold">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenEditSIMModal && (
                          <button
                            onClick={() => onOpenEditSIMModal(sim)}
                            className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1 border border-indigo-200 dark:border-transparent transition"
                          >
                            <Edit className="w-3 h-3" /> EDIT
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteSIM(sim.id)}
                          className="bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-800 text-rose-700 dark:text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-transparent transition"
                        >
                          <Trash2 className="w-3 h-3" /> DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredSIMs.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              totalItems={filteredSIMs.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
