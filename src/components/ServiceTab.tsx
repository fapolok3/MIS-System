import React, { useState, useEffect, useMemo } from 'react';
import {
  Headphones,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Search,
  X,
  Upload,
  Eye,
  Activity,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Ticket } from '../types';
import { Pagination } from './Pagination';
import { ConfirmModal } from './Modals/ConfirmModal';
import { downloadStyledExcel } from '../utils/excelExport';

interface ServiceTabProps {
  tickets: Ticket[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenNewTicketModal: () => void;
  onOpenEditTicketModal: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onBulkDeleteTickets?: (ticketIds: string[]) => void;
  onOpenExcelUploadModal?: () => void;
}

export const ServiceTab: React.FC<ServiceTabProps> = ({
  tickets,
  searchQuery = '',
  onSearchChange,
  onOpenNewTicketModal,
  onOpenEditTicketModal,
  onDeleteTicket,
  onBulkDeleteTickets,
  onOpenExcelUploadModal,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter States for Dashboard Cards
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Modals State
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, localSearch, filterStatus, filterPriority]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  // Metrics for interactive Dashboard Cards
  const { statusCounts, criticalHighCount } = useMemo(() => {
    const counts = {
      OPEN: 0,
      ASSIGNED: 0,
      WORKING: 0,
      RESOLVED: 0,
    };
    let critHigh = 0;

    tickets.forEach((t) => {
      const s = (t.status || 'OPEN').toUpperCase();
      if (s === 'OPEN' || s === 'PENDING') {
        counts.OPEN++;
      } else if (s === 'ASSIGNED') {
        counts.ASSIGNED++;
      } else if (s === 'WORKING' || s === 'IN PROGRESS') {
        counts.WORKING++;
      } else if (s === 'RESOLVED' || s === 'CLOSED' || s === 'SOLVED' || s === 'DONE') {
        counts.RESOLVED++;
      } else {
        counts.OPEN++;
      }

      const p = (t.priority || '').toUpperCase();
      if (p === 'CRITICAL' || p === 'HIGH') {
        critHigh++;
      }
    });

    return { statusCounts: counts, criticalHighCount: critHigh };
  }, [tickets]);

  // Filtered dataset
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter from cards
      if (filterStatus !== 'ALL') {
        const s = (t.status || '').toUpperCase();
        if (filterStatus === 'OPEN') {
          if (s !== 'OPEN' && s !== 'PENDING') return false;
        } else if (filterStatus === 'ASSIGNED') {
          if (s !== 'ASSIGNED') return false;
        } else if (filterStatus === 'WORKING') {
          if (s !== 'WORKING' && s !== 'IN PROGRESS') return false;
        } else if (filterStatus === 'RESOLVED') {
          if (s !== 'RESOLVED' && s !== 'CLOSED' && s !== 'SOLVED' && s !== 'DONE') return false;
        }
      }

      // Priority filter from cards
      if (filterPriority === 'HIGH_CRITICAL') {
        const p = (t.priority || '').toUpperCase();
        if (p !== 'CRITICAL' && p !== 'HIGH') return false;
      }

      // Search query
      if (effectiveSearch.trim()) {
        const q = effectiveSearch.toLowerCase();
        const match =
          (t.id || (t as any).ticketNo || '').toLowerCase().includes(q) ||
          (t.deviceId || '').toLowerCase().includes(q) ||
          ((t as any).sol || '').toLowerCase().includes(q) ||
          ((t as any).category || '').toLowerCase().includes(q) ||
          (t.subject || (t as any).issue || '').toLowerCase().includes(q) ||
          (t.issueType || '').toLowerCase().includes(q) ||
          ((t as any).reportedBy || t.from || '').toLowerCase().includes(q) ||
          (t.status || '').toLowerCase().includes(q) ||
          (t.priority || '').toLowerCase().includes(q) ||
          (t.location || '').toLowerCase().includes(q) ||
          (t.tech || '').toLowerCase().includes(q) ||
          (t.remarks || '').toLowerCase().includes(q) ||
          (t.emailDetails || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [tickets, effectiveSearch, filterStatus, filterPriority]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const validSelectedIds = selectedIds.filter((id) =>
    filteredTickets.some((t) => t.id === id)
  );

  const isAllSelected =
    filteredTickets.length > 0 &&
    filteredTickets.every((t) => validSelectedIds.includes(t.id));

  const isSomeSelected =
    filteredTickets.some((t) => validSelectedIds.includes(t.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTickets.map((t) => t.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteRow = (ticket: Ticket) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Service Ticket',
      message: `Are you sure you want to delete service ticket "${ticket.id}"? This action cannot be undone.`,
      onConfirm: () => {
        onDeleteTicket(ticket.id);
        setSelectedIds((prev) => prev.filter((id) => id !== ticket.id));
      },
    });
  };

  const handleBulkDelete = () => {
    if (validSelectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Bulk Delete Service Tickets',
      message: `Are you sure you want to permanently delete the ${validSelectedIds.length} selected service tickets?`,
      onConfirm: () => {
        if (onBulkDeleteTickets) {
          onBulkDeleteTickets(validSelectedIds);
        } else {
          validSelectedIds.forEach((id) => onDeleteTicket(id));
        }
        setSelectedIds([]);
      },
    });
  };

  const handleExportExcel = () => {
    const headers = [
      'SL',
      'Issue Number',
      'Email Subject',
      'Email From',
      'Service Request Date',
      'Request Time',
      'Planned Provide Date',
      'Date to count',
      'Service Provide Date',
      'Device Location',
      'Device ID',
      'Location Type',
      'Issue Type',
      'Challan Received By',
      'Issue Priority',
      'Current Status',
      'Resolution Time (Days)',
      'SLA Threshold (Days)',
      'SLA Status',
      'Technician Details',
      'Remarks',
      'Visit Email Details',
    ];

    const rows = filteredTickets.map((t, index) => [
      index + 1,
      t.id || (t as any).ticketNo || '-',
      t.subject || (t as any).issue || '-',
      t.from || (t as any).reportedBy || '-',
      t.reqDate || '-',
      t.reqTime || '-',
      t.planDate || '-',
      t.countDate || '-',
      t.provDate || '-',
      t.location || '-',
      t.deviceId || '-',
      t.locType || '-',
      t.issueType || (t as any).category || '-',
      t.receivedBy || '-',
      t.priority || 'MEDIUM',
      t.status || 'OPEN',
      t.resTime ?? '-',
      t.slaThreshold ?? '-',
      t.slaStatus || '-',
      t.tech || 'Unassigned',
      t.remarks || '-',
      t.emailDetails || '-',
    ]);

    const openCount = filteredTickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'PENDING'
    ).length;
    const resolvedCount = filteredTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED' || t.status === 'SOLVED'
    ).length;

    downloadStyledExcel({
      title: 'Service Tickets & SLA Report',
      subtitle: 'Helpdesk Support & Maintenance Audit Log',
      filename: 'Service_Tickets_Report.xls',
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Service Tickets', value: filteredTickets.length },
        { label: 'Open Tickets', value: openCount },
        { label: 'Resolved Tickets', value: resolvedCount },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions Toolbar */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-lg flex flex-wrap justify-between items-center gap-3 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center">
            <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
            Service Ticket & SLA Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auto Generated Format: INV-BBL-YYYYMMDD001
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Realtime Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all w-40 sm:w-52 focus:w-60 shadow-xs"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {validSelectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer font-semibold text-xs"
              title="Delete selected service tickets"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({validSelectedIds.length})
            </button>
          )}

          {onOpenExcelUploadModal && (
            <button
              onClick={onOpenExcelUploadModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Bulk import service tickets from Excel file (.xlsx, .xls, .csv)"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Excel
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-transparent"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={onOpenNewTicketModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      {/* Summary Stat Cards - Interactive Dashboard styled like Issue & Job Entry Report */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tickets */}
        <div
          onClick={() => {
            setFilterStatus('ALL');
            setFilterPriority('ALL');
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'ALL' && filterPriority === 'ALL'
              ? 'bg-indigo-50/70 dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Show all service tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tickets</span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {tickets.length}
          </div>
        </div>

        {/* Open */}
        <div
          onClick={() => {
            setFilterPriority('ALL');
            setFilterStatus((prev) => (prev === 'OPEN' ? 'ALL' : 'OPEN'));
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'OPEN'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Filter by Open tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Open</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {statusCounts.OPEN}
          </div>
        </div>

        {/* Assigned */}
        <div
          onClick={() => {
            setFilterPriority('ALL');
            setFilterStatus((prev) => (prev === 'ASSIGNED' ? 'ALL' : 'ASSIGNED'));
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'ASSIGNED'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Filter by Assigned tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Assigned</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {statusCounts.ASSIGNED}
          </div>
        </div>

        {/* Working */}
        <div
          onClick={() => {
            setFilterPriority('ALL');
            setFilterStatus((prev) => (prev === 'WORKING' ? 'ALL' : 'WORKING'));
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'WORKING'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Filter by Working tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Working</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {statusCounts.WORKING}
          </div>
        </div>

        {/* Resolved / Closed */}
        <div
          onClick={() => {
            setFilterPriority('ALL');
            setFilterStatus((prev) => (prev === 'RESOLVED' ? 'ALL' : 'RESOLVED'));
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'RESOLVED'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Filter by Resolved / Closed tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolved / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {statusCounts.RESOLVED}
          </div>
        </div>

        {/* Critical / High */}
        <div
          onClick={() => {
            setFilterStatus('ALL');
            setFilterPriority((prev) => (prev === 'HIGH_CRITICAL' ? 'ALL' : 'HIGH_CRITICAL'));
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterPriority === 'HIGH_CRITICAL'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Filter by Critical & High Priority tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Critical / High</span>
            <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {criticalHighCount}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase font-bold border-b border-slate-200 dark:border-slate-800 text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                    title="Select or deselect all service tickets"
                  />
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Issue Number</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Email Subject</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Email From</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Service Request Date
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Request Time</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Planned Provide Date
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Date to count</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Service Provide Date
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Device Location</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Device ID</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Location Type</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Issue Type</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Challan Received By
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Issue Priority</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Current Status</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Resolution Time (Days)
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  SLA Threshold (Days)
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">SLA Status</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Technician Details
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Remarks</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                  Visit Email Details
                </th>
                <th className="p-2.5 text-center sticky right-0 z-10 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-300 font-mono">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={23}
                    className="text-center p-8 text-slate-500 dark:text-slate-400 font-sans"
                  >
                    No service tickets found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t, tIdx) => {
                  const isSelected = validSelectedIds.includes(t.id);
                  const priorityUpper = (t.priority || '').toUpperCase();
                  const priorityBadge =
                    priorityUpper === 'CRITICAL' ? (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/80 dark:text-rose-200 dark:border-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        CRITICAL
                      </span>
                    ) : priorityUpper === 'HIGH' ? (
                      <span className="bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                        HIGH
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.priority || 'MEDIUM'}
                      </span>
                    );

                  const statusUpper = (t.status || '').toUpperCase();
                  let statusBadgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                  if (statusUpper === 'OPEN' || statusUpper === 'PENDING') {
                    statusBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
                  } else if (statusUpper === 'WORKING' || statusUpper === 'IN PROGRESS') {
                    statusBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
                  } else if (statusUpper === 'ASSIGNED') {
                    statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                  } else if (statusUpper === 'RESOLVED' || statusUpper === 'CLOSED' || statusUpper === 'SOLVED' || statusUpper === 'DONE') {
                    statusBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                  }

                  return (
                    <tr
                      key={`srv-row-${t.id}-${tIdx}`}
                      className={
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(t.id)}
                          className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                        />
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                        {t.id}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-300 max-w-[200px] truncate" title={t.subject}>
                        {t.subject}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-700 dark:text-slate-300">
                        {t.from}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.reqDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.reqTime}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.planDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.countDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.provDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-300">
                        {t.location}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.deviceId}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-300">
                        {t.locType}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-300">
                        {t.issueType}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-300">
                        {t.receivedBy}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {priorityBadge}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${statusBadgeClass}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.resTime}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        {t.slaThreshold}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {t.slaStatus}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-300">
                        {t.tech}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans max-w-xs truncate text-slate-700 dark:text-slate-300" title={t.remarks}>
                        {t.remarks}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-sans max-w-xs truncate text-slate-700 dark:text-slate-300" title={t.emailDetails}>
                        {t.emailDetails}
                      </td>
                      {/* Action System styled identically to Issue & Job Entry Report */}
                      <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingTicket(t)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="View All Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditTicketModal(t)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit Ticket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(t)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Bottom Pagination Bar */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedTickets.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredTickets.length}</span> tickets ({tickets.length} total)
          </div>
          {filteredTickets.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTickets.length / itemsPerPage) || 1}
              totalItems={filteredTickets.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Complete Service Ticket Details Modal (Styled like Issue & Job Entry Report) */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Issue Number: {viewingTicket.id} • Priority: {viewingTicket.priority || 'MEDIUM'} • Status: {viewingTicket.status || 'OPEN'}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Complete Service Ticket Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'Issue Number', val: viewingTicket.id },
                { label: 'Email Subject', val: viewingTicket.subject },
                { label: 'Email From', val: viewingTicket.from },
                { label: 'Service Request Date', val: viewingTicket.reqDate },
                { label: 'Request Time', val: viewingTicket.reqTime },
                { label: 'Planned Provide Date', val: viewingTicket.planDate },
                { label: 'Date to Count', val: viewingTicket.countDate },
                { label: 'Service Provide Date', val: viewingTicket.provDate },
                { label: 'Device Location', val: viewingTicket.location },
                { label: 'Device ID', val: viewingTicket.deviceId },
                { label: 'Location Type', val: viewingTicket.locType },
                { label: 'Issue Type', val: viewingTicket.issueType },
                { label: 'Challan Received By', val: viewingTicket.receivedBy },
                { label: 'Issue Priority', val: viewingTicket.priority },
                { label: 'Current Status', val: viewingTicket.status },
                { label: 'Resolution Time (Days)', val: viewingTicket.resTime },
                { label: 'SLA Threshold (Days)', val: viewingTicket.slaThreshold },
                { label: 'SLA Status', val: viewingTicket.slaStatus },
                { label: 'Technician Details', val: viewingTicket.tech },
                { label: 'Remarks', val: viewingTicket.remarks },
                { label: 'Visit Email Details', val: viewingTicket.emailDetails },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {idx + 1}. {item.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 break-words">
                    {item.val !== undefined && item.val !== null && item.val !== '' ? String(item.val) : '-'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingTicket;
                  setViewingTicket(null);
                  onOpenEditTicketModal(toEdit);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
              >
                Edit This Ticket
              </button>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Ticket Deletion (Single & Bulk) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
