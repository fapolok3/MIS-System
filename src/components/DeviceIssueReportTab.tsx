import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  Search,
  FileSpreadsheet,
  Plus,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DeviceSupportTicket } from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

const STANDARD_ISSUE_TYPES = [
  'Sim Connectivity',
  'Display Damage',
  'Beeper Problem',
  'Location Shift',
  'Power connectivity',
  'Push Button',
  'Debug Mood',
  'Sensor',
];

interface DeviceIssueReportTabProps {
  tickets: DeviceSupportTicket[];
  onSaveTicket: (ticket: DeviceSupportTicket) => void;
  onDeleteTicket: (id: string) => void;
  onBulkDeleteTickets?: (ids: string[]) => void;
  onNavigateToTracker: () => void;
}

export const DeviceIssueReportTab: React.FC<DeviceIssueReportTabProps> = ({
  tickets,
  onSaveTicket,
  onDeleteTicket,
  onBulkDeleteTickets,
  onNavigateToTracker,
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterResponsibility, setFilterResponsibility] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRepeat, setFilterRepeat] = useState<'ALL' | 'REPEATED' | 'SINGLE'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals State
  const [viewingTicket, setViewingTicket] = useState<DeviceSupportTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<DeviceSupportTicket | null>(null);

  // Edit Modal form internal state
  const [editForm, setEditForm] = useState<{
    deviceId: string;
    contactDate: string;
    lastCommunication: string;
    deviceLocation: string;
    selectedIssues: string[];
    otherIssue: string;
    responsibility: string;
    probableSolvingDate: string;
    ticketStatus: string;
    odooId: string;
    remarks: string;
  }>({
    deviceId: '',
    contactDate: '',
    lastCommunication: '',
    deviceLocation: '',
    selectedIssues: [],
    otherIssue: '',
    responsibility: 'ITL',
    probableSolvingDate: '',
    ticketStatus: 'No',
    odooId: '',
    remarks: '',
  });

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

  // Calculate monthly location frequency helper
  const getMonthlyCount = (location: string, dateStr: string) => {
    if (!location || !dateStr) return 1;
    const ym = dateStr.substring(0, 7);
    return tickets.filter(
      (t) =>
        (t.deviceLocation || '').toLowerCase().trim() === location.toLowerCase().trim() &&
        (t.contactDate || '').substring(0, 7) === ym
    ).length;
  };

  // Available unique months list for filtering
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.contactDate && t.contactDate.length >= 7) {
        set.add(t.contactDate.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [tickets]);

  // KPI & Summary Calculations (from user HTML)
  const totalTickets = tickets.length;
  const uniqueLocationsCount = useMemo(() => {
    const locSet = new Set(
      tickets.map((t) => (t.deviceLocation || '').toLowerCase().trim()).filter(Boolean)
    );
    return locSet.size;
  }, [tickets]);

  const monthlyRepeatedCount = useMemo(() => {
    let count = 0;
    tickets.forEach((t) => {
      if (getMonthlyCount(t.deviceLocation, t.contactDate) > 1) {
        count++;
      }
    });
    return count;
  }, [tickets]);

  const odooTicketsCount = useMemo(() => {
    return tickets.filter((t) => (t.ticketStatus || '').toLowerCase() === 'yes').length;
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (t.deviceId || '').toLowerCase().includes(q) ||
          (t.deviceLocation || '').toLowerCase().includes(q) ||
          (t.issueType || '').toLowerCase().includes(q) ||
          (t.odooId || '').toLowerCase().includes(q) ||
          (t.remarks || '').toLowerCase().includes(q) ||
          (t.responsibility || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Month Filter
      if (filterMonth !== 'ALL') {
        if (!t.contactDate || !t.contactDate.startsWith(filterMonth)) {
          return false;
        }
      }

      // 3. Responsibility Filter
      if (filterResponsibility !== 'ALL') {
        if ((t.responsibility || '').toUpperCase() !== filterResponsibility.toUpperCase()) {
          return false;
        }
      }

      // 4. Ticket Status Raised Filter
      if (filterStatus !== 'ALL') {
        if ((t.ticketStatus || '').toUpperCase() !== filterStatus.toUpperCase()) {
          return false;
        }
      }

      // 5. Repeat Location Filter
      if (filterRepeat !== 'ALL') {
        const monthlyCount = getMonthlyCount(t.deviceLocation, t.contactDate);
        if (filterRepeat === 'REPEATED' && monthlyCount <= 1) return false;
        if (filterRepeat === 'SINGLE' && monthlyCount > 1) return false;
      }

      return true;
    });
  }, [tickets, searchQuery, filterMonth, filterResponsibility, filterStatus, filterRepeat]);

  // Paginated Tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Select all on page
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedTickets.map((t) => t.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedTickets.map((t) => t.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const isAllOnPageSelected =
    paginatedTickets.length > 0 &&
    paginatedTickets.every((t) => selectedIds.includes(t.id));

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Edit Modal
  const openEditModal = (t: DeviceSupportTicket) => {
    setEditingTicket(t);
    const issues = (t.issueType || '').split(',').map((s) => s.trim()).filter(Boolean);
    const standardMatches = issues.filter((i) => STANDARD_ISSUE_TYPES.includes(i));
    const otherMatches = issues.filter((i) => !STANDARD_ISSUE_TYPES.includes(i));

    setEditForm({
      deviceId: t.deviceId,
      contactDate: t.contactDate,
      lastCommunication: t.lastCommunication,
      deviceLocation: t.deviceLocation,
      selectedIssues: standardMatches,
      otherIssue: otherMatches.join(', '),
      responsibility: t.responsibility || 'ITL',
      probableSolvingDate: t.probableSolvingDate === 'N/A' ? '' : t.probableSolvingDate,
      ticketStatus: t.ticketStatus || 'No',
      odooId: t.odooId === 'N/A' ? '' : t.odooId,
      remarks: t.remarks === 'N/A' ? '' : t.remarks,
    });
  };

  const handleSaveEditedTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    const allIssues = [...editForm.selectedIssues];
    if (editForm.otherIssue.trim()) {
      allIssues.push(editForm.otherIssue.trim());
    }

    if (allIssues.length === 0) {
      alert('Please select at least one Device Issue Type.');
      return;
    }

    if (editForm.ticketStatus === 'Yes' && !editForm.odooId.trim()) {
      alert('Please enter the ODOO ID when Ticket Status Raised is Yes.');
      return;
    }

    const updated: DeviceSupportTicket = {
      ...editingTicket,
      deviceId: editForm.deviceId.trim(),
      contactDate: editForm.contactDate,
      lastCommunication: editForm.lastCommunication,
      deviceLocation: editForm.deviceLocation.trim(),
      issueType: allIssues.join(', '),
      responsibility: editForm.responsibility,
      probableSolvingDate: editForm.probableSolvingDate || 'N/A',
      ticketStatus: editForm.ticketStatus,
      odooId: editForm.ticketStatus === 'Yes' ? editForm.odooId.trim() : 'N/A',
      remarks: editForm.remarks.trim() || 'N/A',
      updatedAt: new Date().toISOString(),
    };

    onSaveTicket(updated);
    setEditingTicket(null);
  };

  // Single Delete
  const handleDeleteRow = (ticket: DeviceSupportTicket) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Ticket Record',
      message: `Are you sure you want to delete ticket record #${ticket.slNo} (${ticket.deviceId} - ${ticket.deviceLocation})?`,
      onConfirm: () => {
        onDeleteTicket(ticket.id);
        setSelectedIds((prev) => prev.filter((id) => id !== ticket.id));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Selected Ticket Records',
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected ticket record(s)? This action cannot be undone.`,
      onConfirm: () => {
        if (onBulkDeleteTickets) {
          onBulkDeleteTickets(selectedIds);
        } else {
          selectedIds.forEach((id) => onDeleteTicket(id));
        }
        setSelectedIds([]);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Excel Export
  const handleExportExcel = () => {
    if (filteredTickets.length === 0) {
      alert('No ticket records match current filter criteria to export.');
      return;
    }

    const headers = [
      'SL No',
      'Device ID',
      'Contact Date',
      'Last Communication',
      'Device Location',
      'Monthly Visits',
      'Device Issue Type',
      'Responsibility',
      'Probable Solving Date',
      'Ticket Status Raised',
      'ODOO ID',
      'Remarks',
    ];

    const rows = filteredTickets.map((t, index) => {
      const monthlyCount = getMonthlyCount(t.deviceLocation, t.contactDate);
      return [
        index + 1,
        t.deviceId,
        t.contactDate,
        t.lastCommunication,
        t.deviceLocation,
        `${monthlyCount} visit(s) in ${t.contactDate ? t.contactDate.substring(0, 7) : '-'}`,
        t.issueType,
        t.responsibility,
        t.probableSolvingDate,
        t.ticketStatus,
        t.odooId,
        t.remarks,
      ];
    });

    downloadStyledExcel({
      filename: `Device_Issues_Report_${new Date().toISOString().split('T')[0]}`,
      title: 'Device Support & Ticket Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()} | Filter: ${filterMonth === 'ALL' ? 'All Months' : filterMonth}`,
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Tickets', value: totalTickets },
        { label: 'Active Locations', value: uniqueLocationsCount },
        { label: 'Monthly Repeated Visits', value: monthlyRepeatedCount },
        { label: 'Tickets Raised (ODOO)', value: odooTicketsCount },
      ],
    });
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterMonth('ALL');
    setFilterResponsibility('ALL');
    setFilterStatus('ALL');
    setFilterRepeat('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI & Summary Counters from user HTML */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tickets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Support Tickets
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalTickets}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Logged hardware issues</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Locations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Locations
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {uniqueLocationsCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Unique branches & offices</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Monthly Repeated Visits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Monthly Repeated Visits
            </p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {monthlyRepeatedCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">&gt; 1 visit in same month</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tickets Raised (ODOO) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tickets Raised (ODOO)
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {odooTicketsCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Forwarded to ODOO portal</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card with Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar Section */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileBarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Device Issue & Support Report
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Location repetition frequency computed per month automatically with ODOO tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onNavigateToTracker}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Ticket</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export filtered records to MS Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Export Excel</span>
              </button>

              {selectedIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                    title={`Delete ${selectedIds.length} selected record(s)`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="Deselect all records"
                  >
                    Deselect All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search location, ID, issue..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Month Filter */}
            <div>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Contact Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Month: {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsibility Filter */}
            <div>
              <select
                value={filterResponsibility}
                onChange={(e) => {
                  setFilterResponsibility(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Responsibilities</option>
                <option value="ITL">ITL (Inovace Tech)</option>
                <option value="BBPLC">BBPLC (Internal)</option>
              </select>
            </div>

            {/* Ticket Status Raised Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Ticket Statuses</option>
                <option value="YES">Yes (ODOO Raised)</option>
                <option value="NO">No (Not Raised)</option>
              </select>
            </div>

            {/* Repetition Filter */}
            <div>
              <select
                value={filterRepeat}
                onChange={(e) => {
                  setFilterRepeat(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Visit Counts</option>
                <option value="REPEATED">Repeated Visits (&gt; 1)</option>
                <option value="SINGLE">Single Visits (1 only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="px-3 py-3 w-10 text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 w-12 text-center whitespace-nowrap">SL</th>
                <th className="px-3 py-3 min-w-[200px] whitespace-nowrap">Location & Monthly Frequency</th>
                <th className="px-3 py-3 whitespace-nowrap">Device ID</th>
                <th className="px-3 py-3 min-w-[180px] whitespace-nowrap">Issue Types</th>
                <th className="px-3 py-3 whitespace-nowrap">Dates (Contact / Solve)</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Resp.</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Ticket / ODOO</th>
                <th className="px-3 py-3 min-w-[160px] whitespace-nowrap">Remarks</th>
                <th className="px-3 py-3 text-center sticky right-0 z-10 bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 whitespace-nowrap">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    No device support ticket entries found matching filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t, index) => {
                  const isSelected = selectedIds.includes(t.id);
                  const monthlyCount = getMonthlyCount(t.deviceLocation, t.contactDate);

                  return (
                    <tr
                      key={`dir-ticket-${t.id}-${index}`}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(t.id)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center font-mono text-slate-400 font-medium whitespace-nowrap">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Location & Monthly Frequency */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span title={t.deviceLocation}>
                            {t.deviceLocation}
                          </span>
                        </div>
                        <div className="mt-1 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] border whitespace-nowrap ${
                              monthlyCount > 3
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-900 font-bold'
                                : monthlyCount > 1
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-900 font-bold'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {monthlyCount} visit{monthlyCount > 1 ? 's' : ''} in{' '}
                            {t.contactDate ? t.contactDate.substring(0, 7) : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Device ID */}
                      <td className="px-3 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {t.deviceId}
                      </td>

                      {/* Issue Types */}
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="max-w-[240px] truncate" title={t.issueType}>
                          {t.issueType}
                        </div>
                      </td>

                      {/* Dates (Contact / Solve) - Single line with whitespace-nowrap */}
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{t.contactDate || '-'}</span>
                          <span className="text-slate-400 font-sans font-bold">/</span>
                          <span className="text-slate-600 dark:text-slate-400 font-medium">{t.probableSolvingDate || 'N/A'}</span>
                        </span>
                      </td>

                      {/* Responsibility */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                            t.responsibility === 'ITL'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          {t.responsibility}
                        </span>
                      </td>

                      {/* Ticket / ODOO - Single line with whitespace-nowrap */}
                      <td className="px-3 py-2.5 text-center font-mono whitespace-nowrap">
                        {t.ticketStatus === 'Yes' ? (
                          <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                              Yes
                            </span>
                            {t.odooId && t.odooId !== 'N/A' && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[10px] whitespace-nowrap">
                                {t.odooId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-semibold whitespace-nowrap">
                              No
                            </span>
                            {t.odooId && t.odooId !== 'N/A' && t.odooId !== '-' && (
                              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                ({t.odooId})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        <div className="max-w-[180px] truncate" title={t.remarks}>
                          {t.remarks || '-'}
                        </div>
                      </td>

                      {/* Standard Actions (Sticky Right Column) */}
                      <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingTicket(t)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="View All Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit Ticket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
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

        {/* Footer with Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {filteredTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredTickets.length)} of{' '}
            {filteredTickets.length} entries (Total: {tickets.length})
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredTickets.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* View Details Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <FileBarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Ticket Details #{viewingTicket.slNo} ({viewingTicket.deviceId})
              </h3>
              <button
                onClick={() => setViewingTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Device ID</span>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                  {viewingTicket.deviceId}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Responsibility</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.responsibility}
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Device Location & Frequency
                </span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.deviceLocation}
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                  • {getMonthlyCount(viewingTicket.deviceLocation, viewingTicket.contactDate)} visit(s) in{' '}
                  {viewingTicket.contactDate ? viewingTicket.contactDate.substring(0, 7) : '-'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Contact Date</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingTicket.contactDate}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Last Communication
                </span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingTicket.lastCommunication}
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Device Issue Types
                </span>
                <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.issueType}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Ticket Status / ODOO
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.ticketStatus === 'Yes' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Yes ({viewingTicket.odooId})
                    </span>
                  ) : (
                    <span className="text-slate-400">No</span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Probable Solving Date
                </span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingTicket.probableSolvingDate || 'N/A'}
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Remarks</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 break-words">
                  {viewingTicket.remarks || '-'}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = viewingTicket;
                  setViewingTicket(null);
                  openEditModal(t);
                }}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Edit This Ticket
              </button>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Edit Ticket Record #{editingTicket.slNo}
              </h3>
              <button
                onClick={() => setEditingTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Device ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.deviceId}
                    onChange={(e) => setEditForm({ ...editForm, deviceId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsibility *
                  </label>
                  <select
                    value={editForm.responsibility}
                    onChange={(e) => setEditForm({ ...editForm, responsibility: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="ITL">ITL (Inovace Tech)</option>
                    <option value="BBPLC">BBPLC (Internal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Location *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.deviceLocation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deviceLocation: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.contactDate}
                    onChange={(e) => setEditForm({ ...editForm, contactDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Communication *
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.lastCommunication}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastCommunication: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Issue Checkboxes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Issue Types *
                </label>
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 max-h-36 overflow-y-auto">
                  {STANDARD_ISSUE_TYPES.map((issue, issueIdx) => {
                    const checked = editForm.selectedIssues.includes(issue);
                    return (
                      <label
                        key={`dirt-issue-${issue}-${issueIdx}`}
                        className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({
                                ...editForm,
                                selectedIssues: [...editForm.selectedIssues, issue],
                              });
                            } else {
                              setEditForm({
                                ...editForm,
                                selectedIssues: editForm.selectedIssues.filter((i) => i !== issue),
                              });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                        />
                        <span>{issue}</span>
                      </label>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Custom / other issue..."
                  value={editForm.otherIssue}
                  onChange={(e) => setEditForm({ ...editForm, otherIssue: e.target.value })}
                  className="mt-2 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ticket Status Raised *
                  </label>
                  <select
                    value={editForm.ticketStatus}
                    onChange={(e) => setEditForm({ ...editForm, ticketStatus: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ODOO ID {editForm.ticketStatus === 'Yes' && '*'}
                  </label>
                  <input
                    type="text"
                    disabled={editForm.ticketStatus !== 'Yes'}
                    value={editForm.ticketStatus === 'Yes' ? editForm.odooId : ''}
                    onChange={(e) => setEditForm({ ...editForm, odooId: e.target.value })}
                    placeholder={editForm.ticketStatus === 'Yes' ? 'e.g. ODOO-88219' : 'N/A'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Probable Solving Date
                </label>
                <input
                  type="date"
                  value={editForm.probableSolvingDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, probableSolvingDate: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
