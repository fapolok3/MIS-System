import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  FileSpreadsheet,
  Search,
  X,
  Edit,
  Trash2,
  Plus,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Device, CategoryGroup } from '../types';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface BranchReportTabProps {
  devices: Device[];
  categoryGroups: CategoryGroup[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAddDeviceModal?: () => void;
  onOpenEditDeviceModal?: (device: Device) => void;
  onDeleteDevice?: (sl: number) => void;
}

export const BranchReportTab: React.FC<BranchReportTabProps> = ({
  devices,
  categoryGroups,
  searchQuery = '',
  onSearchChange,
  onOpenAddDeviceModal,
  onOpenEditDeviceModal,
  onDeleteDevice,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState('');

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, localSearch, searchQuery]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  // Extract all unique branch / category names
  const allCategoriesSet = new Set<string>();
  categoryGroups.forEach((g) => g.items.forEach((item) => allCategoriesSet.add(item)));
  devices.forEach((d) => {
    if (d.category) allCategoriesSet.add(d.category);
  });
  const categoryList = Array.from(allCategoriesSet).sort();

  // Calculate Overall Statistics
  const totalCount = devices.length;
  const liveCount = devices.filter((d) => d.status === 'LIVE').length;
  const offlineCount = devices.filter((d) => d.status === 'OFFLINE').length;
  const maintenanceCount = devices.filter((d) => d.status === 'MAINTENANCE').length;

  // Filter devices by category, status, and realtime search
  const filteredDevices = devices.filter((d) => {
    // 1. Branch/Category Filter
    if (selectedCategory !== 'ALL') {
      if ((d.category || '').trim().toLowerCase() !== selectedCategory.trim().toLowerCase()) {
        return false;
      }
    }

    // 2. Status Filter
    if (selectedStatus !== 'ALL') {
      if ((d.status || '').toUpperCase() !== selectedStatus.toUpperCase()) {
        return false;
      }
    }

    // 3. Search query
    if (!effectiveSearch) return true;
    const q = effectiveSearch.toLowerCase();
    return (
      (d.id || '').toLowerCase().includes(q) ||
      (d.sol || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q) ||
      (d.category || '').toLowerCase().includes(q) ||
      (d.sim || '').toLowerCase().includes(q) ||
      (d.district || '').toLowerCase().includes(q) ||
      (d.operator || '').toLowerCase().includes(q) ||
      (d.status || '').toLowerCase().includes(q) ||
      (d.floor || '').toLowerCase().includes(q) ||
      (d.placement || '').toLowerCase().includes(q) ||
      (d.bm || '').toLowerCase().includes(q)
    );
  });

  // Calculate paginated slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const headers = [
      'SL',
      'Branch / Category',
      'Status',
      'SOL NO',
      'Location',
      'Device ID',
      'SIM No',
      'Operator',
      'Floor',
      'Placement',
      'Access Type',
      'BM',
      'Price',
      'District',
      'Install Date',
    ];

    const rows = filteredDevices.map((d, index) => [
      index + 1,
      d.category || 'N/A',
      d.status,
      d.sol,
      d.location,
      d.id,
      d.sim,
      d.operator,
      d.floor,
      d.placement,
      d.accessType,
      d.bm,
      d.price,
      d.district,
      d.installDate,
    ]);

    downloadStyledExcel({
      filename: 'All_Branch_Report',
      title: 'All Branch Device Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Devices', value: totalCount },
        { label: 'Live Devices', value: liveCount },
        { label: 'Offline Devices', value: offlineCount },
        { label: 'Maintenance Devices', value: maintenanceCount },
      ],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-1.5 animate-pulse" />
            LIVE
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 mr-1.5" />
            OFFLINE
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mr-1.5" />
            MAINTENANCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            All Branch Device Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive overview & status monitoring across all organizational branches
          </p>
        </div>

        {/* Excel Export Button & Add Device */}
        <div className="flex items-center gap-2">
          {onOpenAddDeviceModal && (
            <button
              onClick={onOpenAddDeviceModal}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Add Device
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedStatus === 'ALL'
              ? 'bg-indigo-50/70 dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Devices</span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('LIVE')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedStatus === 'LIVE'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live Devices</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{liveCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('OFFLINE')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedStatus === 'OFFLINE'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Offline Devices</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{offlineCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('MAINTENANCE')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedStatus === 'MAINTENANCE'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Maintenance</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{maintenanceCount}</div>
        </div>
      </div>

      {/* Filter Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Branch / Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Branch:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Branches ({categoryList.length})</option>
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">🟢 Live</option>
              <option value="OFFLINE">🔴 Offline</option>
              <option value="MAINTENANCE">🟡 Maintenance</option>
            </select>
          </div>

          {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline font-medium cursor-pointer ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Realtime Search Input Box */}
        <div className="relative flex items-center w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search report..."
            value={localSearch}
            onChange={(e) => {
              const val = e.target.value;
              setLocalSearch(val);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition"
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
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="px-3 py-3 text-center w-12">SL</th>
                <th className="px-3 py-3">Branch / Category</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3">SOL NO</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Device ID</th>
                <th className="px-3 py-3">SIM No</th>
                <th className="px-3 py-3">Operator</th>
                <th className="px-3 py-3">Floor / Placement</th>
                <th className="px-3 py-3">BM / District</th>
                {(onOpenEditDeviceModal || onDeleteDevice) && (
                  <th className="px-3 py-3 text-center w-20">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    No branch device entries found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((d, index) => (
                  <tr
                    key={d.sl || `${d.id}-${index}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400 dark:text-slate-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-200">
                      {d.category || 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 text-center">{getStatusBadge(d.status)}</td>
                    <td className="px-3 py-2.5 font-mono text-indigo-600 dark:text-indigo-300 font-medium">
                      {d.sol || '-'}
                    </td>
                    <td className="px-3 py-2.5 max-w-[150px] truncate text-slate-600 dark:text-slate-300" title={d.location}>
                      {d.location || '-'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                      {d.id || '-'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                      {d.sim || '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {d.operator || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                      {d.floor || '-'} / {d.placement || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                      {d.bm || '-'} {d.district ? `(${d.district})` : ''}
                    </td>
                    {(onOpenEditDeviceModal || onDeleteDevice) && (
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {onOpenEditDeviceModal && (
                            <button
                              onClick={() => onOpenEditDeviceModal(d)}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Edit Device"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteDevice && (
                            <button
                              onClick={() => onDeleteDevice(d.sl)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Delete Device"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          totalItems={filteredDevices.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
