import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Plus,
  Trash2,
  Edit,
  FileSpreadsheet,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Server,
  Download,
} from 'lucide-react';
import { SIMItem, Device } from '../types';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface SIMTabProps {
  sims: SIMItem[];
  devices?: Device[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAddSIMModal: () => void;
  onOpenEditSIMModal?: (sim: SIMItem) => void;
  onDeleteSIM: (id: string) => void;
  onBulkDeleteSIMs?: (ids: string[]) => void;
  onSyncAllSimsFromDevices?: () => void;
}

export const SIMTab: React.FC<SIMTabProps> = ({
  sims,
  devices = [],
  searchQuery = '',
  onSearchChange,
  onOpenAddSIMModal,
  onOpenEditSIMModal,
  onDeleteSIM,
  onBulkDeleteSIMs,
  onSyncAllSimsFromDevices,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTab, setAuditTab] = useState<'missing' | 'duplicates' | 'unsynced'>('missing');

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, localSearch]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  // Calculate reconciliation audit stats between Devices and SIMs
  const auditData = useMemo(() => {
    const isValidSIM = (num?: string) => {
      if (!num) return false;
      const clean = num.trim().toLowerCase();
      return (
        clean !== '' &&
        clean !== '-' &&
        clean !== 'n/a' &&
        clean !== 'none' &&
        clean !== 'null' &&
        clean !== 'undefined'
      );
    };

    const devicesMissingSIM: Device[] = [];
    const devicesWithValidSIM: Device[] = [];
    const simToDevicesMap: Record<string, Device[]> = {};

    devices.forEach((d) => {
      if (isValidSIM(d.sim)) {
        devicesWithValidSIM.push(d);
        const cleanNum = d.sim!.trim();
        if (!simToDevicesMap[cleanNum]) {
          simToDevicesMap[cleanNum] = [];
        }
        simToDevicesMap[cleanNum].push(d);
      } else {
        devicesMissingSIM.push(d);
      }
    });

    const duplicateSIMs = Object.entries(simToDevicesMap)
      .filter(([_, devs]) => devs.length > 1)
      .map(([simNumber, devs]) => ({ simNumber, devices: devs }));

    const existingSimNumbers = new Set(
      sims.map((s) => s.simNumber?.trim().toLowerCase()).filter(Boolean)
    );
    const existingAssignedDevs = new Set(
      sims.map((s) => s.assignedDevice?.trim().toLowerCase()).filter(Boolean)
    );

    const unsyncedDevices = devicesWithValidSIM.filter((d) => {
      const hasNum = existingSimNumbers.has(d.sim?.trim().toLowerCase());
      const hasDev = existingAssignedDevs.has(d.id?.trim().toLowerCase());
      return !hasNum && !hasDev;
    });

    const totalDevicesCount = devices.length;
    const totalSimsCount = sims.length;
    const countDiff = totalDevicesCount - totalSimsCount;

    return {
      totalDevices: totalDevicesCount,
      totalSIMs: totalSimsCount,
      countDiff,
      devicesMissingSIM,
      devicesWithValidSIM,
      duplicateSIMs,
      unsyncedDevices,
    };
  }, [devices, sims]);

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

  const handleExportAuditExcel = () => {
    const headers = ['Type / Category', 'SOL', 'Device ID', 'Branch / Location', 'Assigned SIM', 'Status / Issue Reason'];
    const rows: (string | number)[][] = [];

    auditData.devicesMissingSIM.forEach((d) => {
      rows.push([
        'Missing SIM Number',
        d.sol || '-',
        d.id || '-',
        d.location || '-',
        d.sim || 'Empty / None',
        'Device has no valid SIM number registered',
      ]);
    });

    auditData.duplicateSIMs.forEach((dup) => {
      dup.devices.forEach((d) => {
        rows.push([
          'Duplicate SIM Assignment',
          d.sol || '-',
          d.id || '-',
          d.location || '-',
          dup.simNumber,
          `Shares same SIM with ${dup.devices.length} devices`,
        ]);
      });
    });

    downloadStyledExcel({
      title: 'SIM & Device Inventory Discrepancy Audit Report',
      subtitle: 'Discrepancy Analysis (Devices vs SIM Inventory)',
      filename: 'SIM_Discrepancy_Audit_Report.xls',
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Registered Devices', value: auditData.totalDevices },
        { label: 'Total SIM Cards in Inventory', value: auditData.totalSIMs },
        { label: 'Devices Missing SIMs', value: auditData.devicesMissingSIM.length },
        { label: 'Duplicate SIM Groups', value: auditData.duplicateSIMs.length },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Reconciliation Diagnostic Header Bar */}
      {devices.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-lg border ${
                  auditData.countDiff === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}
              >
                {auditData.countDiff === 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Device & SIM Inventory Count Status
                  </h3>
                  {auditData.countDiff === 0 ? (
                    <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      100% Matched ({auditData.totalDevices} Devices = {auditData.totalSIMs} SIMs)
                    </span>
                  ) : (
                    <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      {Math.abs(auditData.countDiff)} Count Difference ({auditData.totalDevices} Devices vs {auditData.totalSIMs} SIMs)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {auditData.countDiff === 0 ? (
                    'Every registered device has an active matching SIM card record in inventory.'
                  ) : (
                    <span>
                      Total Devices is <strong className="text-slate-900 dark:text-white">{auditData.totalDevices}</strong> but SIM Inventory has <strong className="text-slate-900 dark:text-white">{auditData.totalSIMs}</strong>.
                      {auditData.devicesMissingSIM.length > 0 && ` (${auditData.devicesMissingSIM.length} devices have no SIM number recorded).`}
                      {auditData.duplicateSIMs.length > 0 && ` (${auditData.duplicateSIMs.length} duplicate SIM assignments).`}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="View discrepancy details between Devices and SIM Inventory"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Discrepancy Breakdown
              </button>

              {onSyncAllSimsFromDevices && (
                <button
                  onClick={() => onSyncAllSimsFromDevices()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Sync and update SIM inventory from current devices"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync from Devices
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Table Toolbar */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center">
            <Smartphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mr-2" />
            Cellular SIM Inventory & Assignment
          </h2>
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
            {sims.length} SIMs
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Realtime Search Input Box */}
          <div className="relative flex items-center flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search SIMs..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all w-full sm:w-52 focus:w-60 shadow-xs"
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

      {/* Main Table */}
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
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                    No SIM cards registered yet. Click &quot;Sync from Devices&quot; to auto-import all SIMs from registered devices.
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
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-200">
                        {sim.simNumber ? (
                          sim.simNumber
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-normal italic text-[11px]">(Blank)</span>
                        )}
                      </td>
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

      {/* Discrepancy Breakdown & Audit Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Device & SIM Inventory Discrepancy Audit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Why Total Devices ({auditData.totalDevices}) differs from Total SIMs ({auditData.totalSIMs})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Total Devices</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{auditData.totalDevices}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Total SIMs</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{auditData.totalSIMs}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Devices Missing SIMs</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">{auditData.devicesMissingSIM.length}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Duplicate SIM Groups</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">{auditData.duplicateSIMs.length}</span>
              </div>
            </div>

            {/* Audit Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
              <button
                onClick={() => setAuditTab('missing')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  auditTab === 'missing'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Devices Missing SIM ({auditData.devicesMissingSIM.length})
              </button>

              <button
                onClick={() => setAuditTab('duplicates')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  auditTab === 'duplicates'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Duplicate SIMs ({auditData.duplicateSIMs.length})
              </button>

              <button
                onClick={() => setAuditTab('unsynced')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  auditTab === 'unsynced'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Unsynced Devices ({auditData.unsyncedDevices.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-3">
              {auditTab === 'missing' && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    The following <strong className="text-slate-900 dark:text-white">{auditData.devicesMissingSIM.length}</strong> devices do not have a valid SIM number recorded (SIM is empty or &quot;-&quot;):
                  </p>
                  {auditData.devicesMissingSIM.length === 0 ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-semibold text-center">
                      All registered devices currently have valid SIM numbers!
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase font-bold">
                          <tr>
                            <th className="p-2.5">SOL</th>
                            <th className="p-2.5">Device ID</th>
                            <th className="p-2.5">Branch / Location</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Current SIM Field</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-300">
                          {auditData.devicesMissingSIM.map((d, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold">{d.sol || '-'}</td>
                              <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{d.id}</td>
                              <td className="p-2.5">{d.location}</td>
                              <td className="p-2.5">{d.category}</td>
                              <td className="p-2.5">
                                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {d.sim || 'Empty'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {auditTab === 'duplicates' && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    The following SIM numbers are assigned to multiple device records:
                  </p>
                  {auditData.duplicateSIMs.length === 0 ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-semibold text-center">
                      No duplicate SIM assignments found across devices.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditData.duplicateSIMs.map((dup, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                              SIM: {dup.simNumber}
                            </span>
                            <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              Assigned to {dup.devices.length} Devices
                            </span>
                          </div>
                          <div className="space-y-1">
                            {dup.devices.map((d, dIdx) => (
                              <div key={dIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-[11px] pl-2 border-l-2 border-slate-300 dark:border-slate-700">
                                <span className="font-semibold text-slate-900 dark:text-white">Device ID: {d.id}</span>
                                <span>•</span>
                                <span>SOL: {d.sol}</span>
                                <span>•</span>
                                <span>{d.location}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {auditTab === 'unsynced' && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Devices with a valid SIM number that are not currently synced into the SIM Inventory table:
                  </p>
                  {auditData.unsyncedDevices.length === 0 ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-semibold text-center">
                      All devices with valid SIM numbers are synced into SIM inventory.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase font-bold">
                          <tr>
                            <th className="p-2.5">Device ID</th>
                            <th className="p-2.5">Branch</th>
                            <th className="p-2.5">SIM Number</th>
                            <th className="p-2.5">Operator</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-300">
                          {auditData.unsyncedDevices.map((d, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">{d.id}</td>
                              <td className="p-2.5">{d.location}</td>
                              <td className="p-2.5 font-bold">{d.sim}</td>
                              <td className="p-2.5">{d.operator}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              <button
                onClick={handleExportAuditExcel}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" /> Export Audit Report (Excel)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onSyncAllSimsFromDevices && (
                  <button
                    onClick={() => {
                      onSyncAllSimsFromDevices();
                      setIsAuditModalOpen(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sync Existing SIMs
                  </button>
                )}

                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

