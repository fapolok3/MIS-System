import React, { useState, useEffect } from 'react';
import { Cpu, Plus, FileSpreadsheet, Upload, Edit, Trash2, Search, X } from 'lucide-react';
import { Device } from '../types';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface DevicesTabProps {
  activeCategory: string;
  devices: Device[];
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  onOpenAddDeviceModal: () => void;
  onOpenEditDeviceModal: (device: Device) => void;
  onDeleteDevice: (sl: number) => void;
  onBulkDeleteDevices?: (sls: number[]) => void;
  onOpenExcelUploadModal?: () => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  activeCategory,
  devices,
  searchQuery,
  onSearchChange,
  onOpenAddDeviceModal,
  onOpenEditDeviceModal,
  onDeleteDevice,
  onBulkDeleteDevices,
  onOpenExcelUploadModal,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'OFFLINE' | 'MAINTENANCE'>('ALL');
  const [selectedSls, setSelectedSls] = useState<number[]>([]);

  // Reset page and selections when category, status filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSls([]);
  }, [activeCategory, searchQuery, localSearch, statusFilter]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  // Filter devices by category, status, and search query
  const filteredDevices = devices.filter((d) => {
    const matchesCategory =
      (d.category || '').trim().toLowerCase() === (activeCategory || '').trim().toLowerCase();
    if (!matchesCategory) return false;

    if (statusFilter !== 'ALL' && (d.status || '').toUpperCase() !== statusFilter) {
      return false;
    }

    if (!effectiveSearch.trim()) return true;
    const q = effectiveSearch.toLowerCase().trim();
    return (
      (d.id || (d as any).deviceId || '').toLowerCase().includes(q) ||
      (d.sol || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q) ||
      (d.sim || '').toLowerCase().includes(q) ||
      (d.district || '').toLowerCase().includes(q) ||
      (d.operator || '').toLowerCase().includes(q) ||
      (d.status || '').toLowerCase().includes(q) ||
      (d.floor || '').toLowerCase().includes(q) ||
      (d.placement || '').toLowerCase().includes(q) ||
      (d.accessType || '').toLowerCase().includes(q) ||
      (d.bm || '').toLowerCase().includes(q)
    );
  });

  // Calculate paginated slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  // Selected SLs filtered by devices currently visible in this category filter
  const validSelectedSls = selectedSls.filter((sl) =>
    filteredDevices.some((d) => d.sl === sl)
  );

  const isAllSelected =
    filteredDevices.length > 0 &&
    filteredDevices.every((d) => validSelectedSls.includes(d.sl));

  const isSomeSelected =
    filteredDevices.some((d) => validSelectedSls.includes(d.sl)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSls([]);
    } else {
      setSelectedSls(filteredDevices.map((d) => d.sl));
    }
  };

  const handleSelectOne = (sl: number) => {
    setSelectedSls((prev) =>
      prev.includes(sl) ? prev.filter((id) => id !== sl) : [...prev, sl]
    );
  };

  const handleBulkDelete = () => {
    if (validSelectedSls.length === 0) return;
    if (onBulkDeleteDevices) {
      onBulkDeleteDevices(validSelectedSls);
    } else {
      validSelectedSls.forEach((sl) => onDeleteDevice(sl));
    }
    setSelectedSls([]);
  };

  const isHeadOffice = (activeCategory || '').trim().toLowerCase() === 'all head office units';

  const handleExportExcel = () => {
    const headers = [
      'SL',
      'Category',
      'Status',
      'SOL NO',
      'Location',
      'Device ID',
      'SIM No',
      'Operator',
      'Floor',
      'Placement',
      'Access Type',
      isHeadOffice ? 'Department' : 'BM',
      'Price',
      isHeadOffice ? 'Division' : 'District',
      'Install Date',
    ];

    const rows = filteredDevices.map((d, index) => [
      index + 1,
      d.category || activeCategory,
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

    const liveCount = filteredDevices.filter((d) => d.status === 'LIVE').length;
    const offlineCount = filteredDevices.filter((d) => d.status === 'OFFLINE').length;

    downloadStyledExcel({
      title: `${activeCategory} Devices Inventory`,
      subtitle: `Device Registry for ${activeCategory} Category`,
      filename: `${activeCategory.replace(/\s+/g, '_')}_Devices_Report.xls`,
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Registered Devices', value: filteredDevices.length },
        { label: 'Live Devices', value: liveCount },
        { label: 'Offline / Maintenance', value: offlineCount },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center">
            <Cpu className="w-4 h-4 text-indigo-400 mr-2" />
            Category:{' '}
            <span className="text-indigo-400 ml-1">{activeCategory}</span> Devices
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Items:{' '}
            <span className="font-bold text-slate-200">
              {filteredDevices.length}
            </span>{' '}
            Registered Devices
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold items-center">
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer shadow-inner font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="LIVE">🟢 Live</option>
            <option value="OFFLINE">🔴 Offline</option>
            <option value="MAINTENANCE">🟡 Maintenance</option>
          </select>

          {/* Realtime Search Input Box before Add Device */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeCategory}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 text-slate-100 placeholder-slate-500 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all w-44 sm:w-56 focus:w-64 shadow-inner"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {validSelectedSls.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer font-bold animate-pulse"
              title="Delete selected entries"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({validSelectedSls.length})
            </button>
          )}

          <button
            onClick={onOpenAddDeviceModal}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Device
          </button>
          {onOpenExcelUploadModal && (
            <button
              onClick={onOpenExcelUploadModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload from Excel
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
            <thead className="bg-slate-950 text-slate-300 uppercase font-bold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-slate-800 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                    title="Select or deselect all items in this category"
                  />
                </th>
                <th className="p-2.5 border-r border-slate-800">SL</th>
                <th className="p-2.5 border-r border-slate-800">Status</th>
                <th className="p-2.5 border-r border-slate-800 bg-indigo-950/50 text-indigo-300">
                  SOL NO
                </th>
                <th className="p-2.5 border-r border-slate-800">Location</th>
                <th className="p-2.5 border-r border-slate-800">Device ID</th>
                <th className="p-2.5 border-r border-slate-800">SIM No</th>
                <th className="p-2.5 border-r border-slate-800">Operator</th>
                <th className="p-2.5 border-r border-slate-800">Floor</th>
                <th className="p-2.5 border-r border-slate-800">Placement</th>
                <th className="p-2.5 border-r border-slate-800">Access Type</th>
                <th className="p-2.5 border-r border-slate-800">
                  {isHeadOffice ? 'Department' : 'BM'}
                </th>
                <th className="p-2.5 border-r border-slate-800">Price</th>
                <th className="p-2.5 border-r border-slate-800">
                  {isHeadOffice ? 'Division' : 'District'}
                </th>
                <th className="p-2.5 border-r border-slate-800">Install Date</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan={16}
                    className="text-center p-4 text-slate-500 font-sans"
                  >
                    No devices found in {activeCategory}
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((item, idx) => {
                  const globalIdx = startIndex + idx;
                  const isSelected = validSelectedSls.includes(item.sl);
                  const statusBadge =
                    item.status === 'LIVE' ? (
                      <span className="bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded text-[10px]">
                        LIVE
                      </span>
                    ) : item.status === 'OFFLINE' ? (
                      <span className="bg-rose-900/50 text-rose-300 border border-rose-700/50 px-2 py-0.5 rounded text-[10px]">
                        OFFLINE
                      </span>
                    ) : (
                      <span className="bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px]">
                        MAINTENANCE
                      </span>
                    );

                  const operatorColor =
                    item.operator === 'GP'
                      ? 'text-blue-400'
                      : item.operator === 'Robi'
                      ? 'text-rose-400'
                      : item.operator === 'Banglalink'
                      ? 'text-amber-400'
                      : 'text-emerald-400';

                  return (
                    <tr
                      key={item.sl}
                      className={
                        isSelected
                          ? 'bg-indigo-950/40 hover:bg-indigo-900/50'
                          : 'hover:bg-slate-800/40'
                      }
                    >
                      <td className="p-2.5 border-r border-slate-800 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.sl)}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                        />
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-bold">
                        {globalIdx + 1}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {statusBadge}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-bold bg-indigo-950/30 text-indigo-300">
                        {item.sol}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.location}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-bold text-indigo-400">
                        {item.id}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {item.sim || '-'}
                      </td>
                      <td
                        className={`p-2.5 border-r border-slate-800 font-sans font-bold ${operatorColor}`}
                      >
                        {item.operator}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.floor || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.placement || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.accessType || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.bm || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {item.price || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.district || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {item.installDate || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenEditDeviceModal(item)}
                            className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> EDIT
                          </button>
                          <button
                            onClick={() => onDeleteDevice(item.sl)}
                            className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
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
        {filteredDevices.length > 0 && (
          <div className="px-4 pb-3 bg-slate-900/60 border-t border-slate-800">
            <Pagination
              totalItems={filteredDevices.length}
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
