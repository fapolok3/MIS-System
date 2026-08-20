import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Filter,
  Search,
  Download,
  FileSpreadsheet,
  Printer,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Repeat,
  BarChart3,
  PieChart,
  ShieldAlert,
  Building2,
  Tag,
  Layers,
  User,
  Plus,
  RefreshCw,
  TrendingUp,
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  IssueTrackerItem,
  CategoryGroup,
  SystemOptions,
} from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface IssueReportTabProps {
  issues: IssueTrackerItem[];
  onSaveIssue: (issue: IssueTrackerItem) => Promise<boolean> | void;
  onDeleteIssue: (id: string) => void;
  onBulkDeleteIssues?: (ids: string[]) => void;
  categoryGroups: CategoryGroup[];
  systemOptions: SystemOptions;
  onNavigateToTracker: () => void;
}

export const IssueReportTab: React.FC<IssueReportTabProps> = ({
  issues,
  onSaveIssue,
  onDeleteIssue,
  onBulkDeleteIssues,
  categoryGroups,
  systemOptions,
  onNavigateToTracker,
}) => {
  const [activeSubView, setActiveSubView] = useState<'table' | 'analytics'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterIssueType, setFilterIssueType] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDeviceReplace, setFilterDeviceReplace] = useState('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Selected items for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [viewingIssue, setViewingIssue] = useState<IssueTrackerItem | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueTrackerItem | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<string[]>([]);

  const toggleExpandDetails = (id: string) => {
    setExpandedDetailsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Extract unique filter lists
  const allBranches = useMemo(() => {
    return Array.from(new Set(issues.map((i) => i.branchName).filter(Boolean))).sort();
  }, [issues]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    if (categoryGroups && categoryGroups.length > 0) {
      categoryGroups.forEach((g) => {
        if (g.title) cats.add(g.title);
        if (g.items && Array.isArray(g.items)) {
          g.items.forEach((it) => {
            if (it) cats.add(it);
          });
        }
      });
    }
    issues.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [categoryGroups, issues]);

  const allIssueTypes = useMemo(() => {
    return Array.from(new Set([...systemOptions.issueTypes, ...issues.map((i) => i.issueType)])).filter(Boolean).sort();
  }, [systemOptions.issueTypes, issues]);

  const allPriorities = useMemo(() => {
    const base = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    return Array.from(new Set([...(systemOptions.ticketPriorities || []), ...base, ...issues.map((i) => i.priority)])).filter(Boolean);
  }, [systemOptions.ticketPriorities, issues]);

  const allStatuses = useMemo(() => {
    const base = ['OPEN', 'IN_PROGRESS', 'PENDING_CLIENT', 'RESOLVED', 'CLOSED'];
    return Array.from(new Set([...(systemOptions.ticketStatuses || []), ...base, ...issues.map((i) => i.status)])).filter(Boolean);
  }, [systemOptions.ticketStatuses, issues]);

  // Filtered Issues list
  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.id.toLowerCase().includes(q) ||
          item.branchName.toLowerCase().includes(q) ||
          item.odooTicketId.toLowerCase().includes(q) ||
          item.issueType.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.assignPerson.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.replaceDeviceId.toLowerCase().includes(q) ||
          item.oldDeviceId.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Dropdown filters
      if (filterBranch !== 'ALL' && item.branchName !== filterBranch) return false;
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      if (filterIssueType !== 'ALL' && item.issueType !== filterIssueType) return false;
      if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
      if (filterDeviceReplace !== 'ALL' && item.deviceReplace !== filterDeviceReplace) return false;

      // Date Range filters
      if (filterDateFrom && item.date < filterDateFrom) return false;
      if (filterDateTo && item.date > filterDateTo) return false;

      return true;
    });
  }, [
    issues,
    searchQuery,
    filterBranch,
    filterCategory,
    filterIssueType,
    filterPriority,
    filterStatus,
    filterDeviceReplace,
    filterDateFrom,
    filterDateTo,
  ]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterBranch,
    filterCategory,
    filterIssueType,
    filterPriority,
    filterStatus,
    filterDeviceReplace,
    filterDateFrom,
    filterDateTo,
  ]);

  // Paginated slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + itemsPerPage);

  // Turnaround Time (TAT) Calculation helper
  const calculateTAT = (
    startDateStr: string,
    startTimeStr: string,
    endDateStr: string,
    endTimeStr: string
  ) => {
    if (!startDateStr || !endDateStr) return null;
    try {
      const start = new Date(`${startDateStr}T${startTimeStr || '00:00'}:00`);
      const end = new Date(`${endDateStr}T${endTimeStr || '00:00'}:00`);
      const diffMs = end.getTime() - start.getTime();
      if (isNaN(diffMs) || diffMs < 0) return null;

      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins} min`;
      const diffHrs = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      if (diffHrs < 24) return `${diffHrs}h ${remainingMins}m`;
      const diffDays = (diffHrs / 24).toFixed(1);
      return `${diffDays} days (${diffHrs}h)`;
    } catch {
      return null;
    }
  };

  // Analytics Metrics
  const analytics = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    const inProgress = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'PENDING_CLIENT').length;
    const open = issues.filter((i) => i.status === 'OPEN').length;
    const replaced = issues.filter((i) => i.deviceReplace === 'YES').length;

    // Priority breakdown
    const critical = issues.filter((i) => i.priority === 'CRITICAL').length;
    const high = issues.filter((i) => i.priority === 'HIGH').length;
    const medium = issues.filter((i) => i.priority === 'MEDIUM').length;
    const low = issues.filter((i) => i.priority === 'LOW').length;

    // By Issue Type
    const issueTypeCount: Record<string, number> = {};
    issues.forEach((i) => {
      const t = i.issueType || 'General';
      issueTypeCount[t] = (issueTypeCount[t] || 0) + 1;
    });

    // By Branch
    const branchCount: Record<string, number> = {};
    issues.forEach((i) => {
      const b = i.branchName || 'Unassigned';
      branchCount[b] = (branchCount[b] || 0) + 1;
    });

    // Top 5 Branches
    const topBranches = Object.entries(branchCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Calculate Average Resolution TAT in hours
    let totalResHours = 0;
    let resolvedWithTimesCount = 0;
    issues.forEach((i) => {
      if (i.clientReportingDate && i.resolutionDate) {
        try {
          const start = new Date(`${i.clientReportingDate}T${i.clientReportingTime || '00:00'}`);
          const end = new Date(`${i.resolutionDate}T${i.resolutionTime || '00:00'}`);
          const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (!isNaN(diffHrs) && diffHrs >= 0) {
            totalResHours += diffHrs;
            resolvedWithTimesCount++;
          }
        } catch {}
      }
    });

    const avgResolutionHours =
      resolvedWithTimesCount > 0 ? (totalResHours / resolvedWithTimesCount).toFixed(1) : 'N/A';

    return {
      total,
      resolved,
      inProgress,
      open,
      replaced,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      critical,
      high,
      medium,
      low,
      issueTypeCount,
      topBranches,
      avgResolutionHours,
    };
  }, [issues]);

  // Export to Excel Function (styled format matching system standard)
  const handleExportExcel = () => {
    if (filteredIssues.length === 0) {
      showToast('No records to export');
      return;
    }

    const headers = [
      'SL',
      'Issue ID',
      'Branch Name',
      'Issue Type',
      'Category',
      'Odoo Ticket ID',
      'Priority',
      'Device Replace',
      'Old Device ID',
      'Replace Device ID',
      'Location',
      'Assign Person',
      'Status',
      'Date',
      'Client Reporting Date',
      'Client Reporting Time',
      'Client Response Date',
      'Client Response Time',
      'Resolution Date',
      'Resolution Time',
      'Response TAT',
      'Resolution TAT',
      'Details',
    ];

    const rows = filteredIssues.map((i, index) => {
      const responseTAT =
        calculateTAT(
          i.clientReportingDate,
          i.clientReportingTime,
          i.clientResponseDate,
          i.clientResponseTime
        ) || '-';
      const resolutionTAT =
        calculateTAT(
          i.clientReportingDate,
          i.clientReportingTime,
          i.resolutionDate,
          i.resolutionTime
        ) || '-';

      return [
        index + 1,
        i.id || '-',
        i.branchName || '-',
        i.issueType || '-',
        i.category || '-',
        i.odooTicketId || '-',
        i.priority || 'MEDIUM',
        i.deviceReplace || 'NO',
        i.oldDeviceId || '-',
        i.replaceDeviceId || '-',
        i.location || '-',
        i.assignPerson || 'Unassigned',
        i.status || 'OPEN',
        i.date || '-',
        i.clientReportingDate || '-',
        i.clientReportingTime || '-',
        i.clientResponseDate || '-',
        i.clientResponseTime || '-',
        i.resolutionDate || '-',
        i.resolutionTime || '-',
        responseTAT,
        resolutionTAT,
        (i.details || '').replace(/\n/g, ' '),
      ];
    });

    const openCount = filteredIssues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
    const resolvedCount = filteredIssues.filter(
      (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
    ).length;
    const replacedCount = filteredIssues.filter((i) => i.deviceReplace === 'YES').length;

    downloadStyledExcel({
      title: 'Issue Tracker & Incident SLA Report',
      subtitle: 'MIS Incident Management & Hardware Replacement Register',
      filename: `Issue_Report_${new Date().toISOString().split('T')[0]}.xls`,
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Incidents', value: filteredIssues.length },
        { label: 'Resolved Tickets', value: resolvedCount },
        { label: 'Active / Open', value: openCount },
        { label: 'Device Replaced', value: replacedCount },
      ],
    });

    showToast('Issue Report exported as Excel (.xls)!');
  };

  // Print Window
  const handlePrint = () => {
    window.print();
  };

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredIssues.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Bulk Delete Issues',
      message: `Are you sure you want to delete ${selectedIds.length} selected issue records?`,
      onConfirm: () => {
        if (onBulkDeleteIssues) {
          onBulkDeleteIssues(selectedIds);
        } else {
          selectedIds.forEach((id) => onDeleteIssue(id));
        }
        showToast(`Deleted ${selectedIds.length} issues.`);
        setSelectedIds([]);
      },
    });
  };

  // Inline Quick Status Update
  const handleQuickStatusChange = async (issue: IssueTrackerItem, newStatus: any) => {
    const updated: IssueTrackerItem = {
      ...issue,
      status: newStatus,
      resolutionDate:
        newStatus === 'RESOLVED' && !issue.resolutionDate
          ? new Date().toISOString().split('T')[0]
          : issue.resolutionDate,
      resolutionTime:
        newStatus === 'RESOLVED' && !issue.resolutionTime
          ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
          : issue.resolutionTime,
      updatedAt: new Date().toISOString(),
    };
    await onSaveIssue(updated);
    showToast(`Status of ${issue.id} updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Issue Report & Incident Analytics
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                {filteredIssues.length} Records
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Complete incident register, resolution turnaround SLAs, device replacement tracking, and visual analytics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* Sub-view Switcher */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveSubView('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Table</span>
            </button>
            <button
              onClick={() => setActiveSubView('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & SLAs</span>
            </button>
          </div>

          <button
            onClick={onNavigateToTracker}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue Entry</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-emerald-600 shadow-sm"
            title="Download Excel Report (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Issues</span>
          <div className="text-xl font-bold text-white font-mono">{analytics.total}</div>
          <div className="text-[10px] text-slate-500">All registered incidents</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-amber-400 uppercase font-semibold">Open / Active</span>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {analytics.open + analytics.inProgress}
          </div>
          <div className="text-[10px] text-slate-500">
            {analytics.open} Open, {analytics.inProgress} In-Progress
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-emerald-400 uppercase font-semibold">Resolved</span>
          <div className="text-xl font-bold text-emerald-300 font-mono">{analytics.resolved}</div>
          <div className="text-[10px] text-emerald-400/80 font-bold">
            {analytics.resolutionRate}% Resolution Rate
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-rose-400 uppercase font-semibold">Critical / High</span>
          <div className="text-xl font-bold text-rose-300 font-mono">
            {analytics.critical + analytics.high}
          </div>
          <div className="text-[10px] text-slate-500">{analytics.critical} Critical Priority</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-indigo-400 uppercase font-semibold">Device Replaced</span>
          <div className="text-xl font-bold text-indigo-300 font-mono">{analytics.replaced}</div>
          <div className="text-[10px] text-slate-500">Hardware swap incidents</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-purple-400 uppercase font-semibold">Avg Resolution</span>
          <div className="text-xl font-bold text-purple-300 font-mono">
            {analytics.avgResolutionHours} {analytics.avgResolutionHours !== 'N/A' ? 'hrs' : ''}
          </div>
          <div className="text-[10px] text-slate-500">Mean time to resolve (MTTR)</div>
        </div>
      </div>

      {/* SUBVIEW 1: REPORT DATA TABLE */}
      {activeSubView === 'table' && (
        <div className="space-y-4">
          {/* Multi-Filter Bar Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Filter & Search Incident Register
                </span>
              </div>

              {(filterBranch !== 'ALL' ||
                filterCategory !== 'ALL' ||
                filterIssueType !== 'ALL' ||
                filterPriority !== 'ALL' ||
                filterStatus !== 'ALL' ||
                filterDeviceReplace !== 'ALL' ||
                filterDateFrom ||
                filterDateTo ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterBranch('ALL');
                    setFilterCategory('ALL');
                    setFilterIssueType('ALL');
                    setFilterPriority('ALL');
                    setFilterStatus('ALL');
                    setFilterDeviceReplace('ALL');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              {/* Search Bar */}
              <div className="sm:col-span-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, Branch, Odoo, Device, Tech..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Branch Filter */}
              <div>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="ALL">All Branches</option>
                  {allBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="ALL">All Priorities</option>
                  {allPriorities.map((p) => (
                    <option key={p} value={p}>
                      {p === 'CRITICAL'
                        ? '🔴 Critical'
                        : p === 'HIGH'
                        ? '🟠 High'
                        : p === 'MEDIUM'
                        ? '🟡 Medium'
                        : p === 'LOW'
                        ? '🟢 Low'
                        : `⚡ ${p}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  {allStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st === 'OPEN'
                        ? '🔵 OPEN'
                        : st === 'IN_PROGRESS' || st === 'WORKING'
                        ? '🟡 IN PROGRESS'
                        : st === 'PENDING_CLIENT' || st === 'ASSIGNED'
                        ? '🟠 PENDING CLIENT'
                        : st === 'RESOLVED'
                        ? '🟢 RESOLVED'
                        : st === 'CLOSED'
                        ? '⚪ CLOSED'
                        : `🔹 ${st}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Replace Filter */}
              <div>
                <select
                  value={filterDeviceReplace}
                  onChange={(e) => setFilterDeviceReplace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="ALL">All Device Actions</option>
                  <option value="YES">⚡ Replaced Only</option>
                  <option value="NO">🛠️ Serviced / No Replace</option>
                </select>
              </div>
            </div>

            {/* Additional Secondary Filters: Category, Issue Type, Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs pt-1">
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="ALL">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterIssueType}
                  onChange={(e) => setFilterIssueType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="ALL">All Issue Types</option>
                  {allIssueTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 shrink-0">From:</span>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 shrink-0">To:</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-950/80 border border-indigo-800 rounded-xl p-3 flex items-center justify-between text-xs animate-fade-in">
              <span className="text-indigo-200 font-bold">
                {selectedIds.length} incident(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          )}

          {/* Issue Data Table with ALL Fields Visible */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
            {filteredIssues.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-300">No issue records matched your criteria.</p>
                <button
                  onClick={onNavigateToTracker}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Issue</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[2000px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] sticky top-0 z-10">
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredIssues.length > 0 &&
                            selectedIds.length === filteredIssues.length
                          }
                          onChange={handleSelectAll}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-10 text-center font-bold">#</th>
                      <th className="p-3 font-bold whitespace-nowrap">Incident ID</th>
                      <th className="p-3 font-bold whitespace-nowrap">Odoo Ticket ID</th>
                      <th className="p-3 font-bold whitespace-nowrap">Branch Name</th>
                      <th className="p-3 font-bold whitespace-nowrap">Specific Location</th>
                      <th className="p-3 font-bold whitespace-nowrap">Issue Type</th>
                      <th className="p-3 font-bold whitespace-nowrap text-center">Priority</th>
                      <th className="p-3 font-bold whitespace-nowrap text-center">Device Swap</th>
                      <th className="p-3 font-bold whitespace-nowrap">Old Device ID</th>
                      <th className="p-3 font-bold whitespace-nowrap">Replacement Device ID</th>
                      <th className="p-3 font-bold whitespace-nowrap">Assigned Person</th>
                      <th className="p-3 font-bold whitespace-nowrap text-center">Status</th>
                      <th className="p-3 font-bold whitespace-nowrap">Entry Date</th>
                      <th className="p-3 font-bold whitespace-nowrap">Client Reporting (Date & Time)</th>
                      <th className="p-3 font-bold whitespace-nowrap">First Response (Date & Time)</th>
                      <th className="p-3 font-bold whitespace-nowrap">Resolution (Date & Time)</th>
                      <th className="p-3 font-bold whitespace-nowrap text-center">Response TAT</th>
                      <th className="p-3 font-bold whitespace-nowrap text-center">Resolution TAT</th>
                      <th className="p-3 font-bold min-w-[250px]">Incident Details / Notes</th>
                      <th className="p-3 font-bold text-right sticky right-0 bg-slate-950 shadow-l z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paginatedIssues.map((item, idx) => {
                      const responseTAT = calculateTAT(
                        item.clientReportingDate,
                        item.clientReportingTime,
                        item.clientResponseDate,
                        item.clientResponseTime
                      );
                      const resolutionTAT = calculateTAT(
                        item.clientReportingDate,
                        item.clientReportingTime,
                        item.resolutionDate,
                        item.resolutionTime
                      );
                      const isExpanded = expandedDetailsIds.includes(item.id);
                      const slNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-800/60 transition group ${
                            selectedIds.includes(item.id) ? 'bg-indigo-950/30' : ''
                          }`}
                        >
                          {/* 1. Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleToggleSelect(item.id)}
                              className="rounded bg-slate-900 border-slate-700 text-indigo-600 cursor-pointer"
                            />
                          </td>

                          {/* 2. SL Number */}
                          <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                            {slNumber}
                          </td>

                          {/* 3. Incident ID */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
                              {item.id}
                            </span>
                          </td>

                          {/* 4. Odoo Ticket ID */}
                          <td className="p-3 whitespace-nowrap font-mono">
                            {item.odooTicketId ? (
                              <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                                {item.odooTicketId}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* 5. Branch Name */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-white">
                              {item.branchName || '-'}
                            </span>
                          </td>

                          {/* 6. Specific Location */}
                          <td className="p-3 whitespace-nowrap text-slate-300">
                            {item.location ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{item.location}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* 7. Issue Type */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-slate-200 font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                              {item.issueType || '-'}
                            </span>
                          </td>

                          {/* 8. Priority */}
                          <td className="p-3 whitespace-nowrap text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                                item.priority === 'CRITICAL'
                                  ? 'bg-rose-950/90 text-rose-300 border-rose-800'
                                  : item.priority === 'HIGH'
                                  ? 'bg-orange-950/90 text-orange-300 border-orange-800'
                                  : item.priority === 'MEDIUM'
                                  ? 'bg-amber-950/90 text-amber-300 border-amber-800'
                                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
                              }`}
                            >
                              {item.priority || 'MEDIUM'}
                            </span>
                          </td>

                          {/* 9. Device Swap */}
                          <td className="p-3 whitespace-nowrap text-center">
                            {item.deviceReplace === 'YES' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 inline-flex items-center gap-1">
                                <Repeat className="w-3 h-3" /> Replaced
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700">
                                No Swap
                              </span>
                            )}
                          </td>

                          {/* 10. Old Device ID */}
                          <td className="p-3 whitespace-nowrap font-mono text-slate-300">
                            {item.oldDeviceId ? (
                              <span className="bg-rose-950/30 text-rose-300 px-2 py-0.5 rounded border border-rose-900/60">
                                {item.oldDeviceId}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* 11. Replacement Device ID */}
                          <td className="p-3 whitespace-nowrap font-mono text-slate-300">
                            {item.replaceDeviceId ? (
                              <span className="bg-emerald-950/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/60">
                                {item.replaceDeviceId}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* 12. Assigned Person */}
                          <td className="p-3 whitespace-nowrap text-slate-200 font-medium">
                            {item.assignPerson ? (
                              <span className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-indigo-400" />
                                <span>{item.assignPerson}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
                          </td>

                          {/* 13. Status */}
                          <td className="p-3 whitespace-nowrap text-center">
                            <select
                              value={item.status}
                              onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer transition focus:outline-none ${
                                item.status === 'RESOLVED' || item.status === 'CLOSED'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : item.status === 'IN_PROGRESS'
                                  ? 'bg-blue-950 text-blue-300 border-blue-800'
                                  : item.status === 'PENDING_CLIENT'
                                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}
                            >
                              <option value="OPEN">OPEN</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="PENDING_CLIENT">PENDING CLIENT</option>
                              <option value="RESOLVED">RESOLVED</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </td>

                          {/* 14. Entry Date */}
                          <td className="p-3 whitespace-nowrap font-mono text-slate-300">
                            {item.date || '-'}
                          </td>

                          {/* 15. Client Reporting (Date & Time) */}
                          <td className="p-3 whitespace-nowrap font-mono">
                            {item.clientReportingDate ? (
                              <div className="space-y-0.5">
                                <span className="text-slate-200 block">{item.clientReportingDate}</span>
                                {item.clientReportingTime && (
                                  <span className="text-[10px] text-slate-400 block">
                                    🕒 {item.clientReportingTime}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* 16. First Response (Date & Time) */}
                          <td className="p-3 whitespace-nowrap font-mono">
                            {item.clientResponseDate ? (
                              <div className="space-y-0.5">
                                <span className="text-amber-300/90 block">{item.clientResponseDate}</span>
                                {item.clientResponseTime && (
                                  <span className="text-[10px] text-amber-400/70 block">
                                    🕒 {item.clientResponseTime}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Pending Resp</span>
                            )}
                          </td>

                          {/* 17. Resolution (Date & Time) */}
                          <td className="p-3 whitespace-nowrap font-mono">
                            {item.resolutionDate ? (
                              <div className="space-y-0.5">
                                <span className="text-emerald-300 block">{item.resolutionDate}</span>
                                {item.resolutionTime && (
                                  <span className="text-[10px] text-emerald-400/70 block">
                                    🕒 {item.resolutionTime}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">In Progress</span>
                            )}
                          </td>

                          {/* 18. Response TAT */}
                          <td className="p-3 whitespace-nowrap text-center font-mono">
                            {responseTAT ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                {responseTAT}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>

                          {/* 19. Resolution TAT */}
                          <td className="p-3 whitespace-nowrap text-center font-mono">
                            {resolutionTAT ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                {resolutionTAT}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>

                          {/* 20. Incident Details / Notes */}
                          <td className="p-3 min-w-[250px] max-w-[380px]">
                            {item.details ? (
                              <div className="space-y-1">
                                <div
                                  className={`text-slate-300 text-[11px] leading-relaxed ${
                                    isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                                  }`}
                                >
                                  {item.details}
                                </div>
                                {item.details.length > 80 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandDetails(item.id)}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-0.5"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <span>Show less</span>
                                        <ChevronDown className="w-3 h-3 rotate-180" />
                                      </>
                                    ) : (
                                      <>
                                        <span>Read full details</span>
                                        <ChevronDown className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">No notes</span>
                            )}
                          </td>

                          {/* 21. Actions */}
                          <td className="p-3 text-right sticky right-0 bg-slate-900 group-hover:bg-slate-800 transition shadow-l z-10">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingIssue(item)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition"
                                title="View Complete Report Card"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingIssue(item)}
                                className="p-1.5 bg-slate-800 hover:bg-indigo-900 text-indigo-300 rounded cursor-pointer transition"
                                title="Quick Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmConfig({
                                    isOpen: true,
                                    title: 'Delete Issue Record',
                                    message: `Are you sure you want to delete ${item.id}? This cannot be undone.`,
                                    onConfirm: () => {
                                      onDeleteIssue(item.id);
                                      showToast(`Deleted ${item.id}`);
                                    },
                                  })
                                }
                                className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded cursor-pointer transition"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Bar */}
            {filteredIssues.length > 0 && (
              <div className="px-4 pb-3 bg-slate-900/60 border-t border-slate-800">
                <Pagination
                  totalItems={filteredIssues.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  pageSizeOptions={[10, 25, 50, 100, 500]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: VISUAL ANALYTICS & SLA INSIGHTS */}
      {activeSubView === 'analytics' && (
        <div className="space-y-6">
          {/* Row 1: Priority Breakdown & Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Priority Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    Incidents by Priority Severity
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Total: {analytics.total}</span>
              </div>

              <div className="space-y-3">
                {/* Critical */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical Severity
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analytics.critical} ({analytics.total > 0 ? Math.round((analytics.critical / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{
                        width: `${analytics.total > 0 ? (analytics.critical / analytics.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* High */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold text-orange-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span> High Priority
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analytics.high} ({analytics.total > 0 ? Math.round((analytics.high / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{
                        width: `${analytics.total > 0 ? (analytics.high / analytics.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium Priority
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analytics.medium} ({analytics.total > 0 ? Math.round((analytics.medium / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${analytics.total > 0 ? (analytics.medium / analytics.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Low */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low Priority
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analytics.low} ({analytics.total > 0 ? Math.round((analytics.low / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${analytics.total > 0 ? (analytics.low / analytics.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    Incident Lifecycle Status
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {analytics.resolutionRate}% Resolved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[11px]">Open & Pending</span>
                  <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                    {analytics.open}
                  </div>
                  <span className="text-[10px] text-slate-500">Awaiting engineering response</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[11px]">In Progress / Client</span>
                  <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
                    {analytics.inProgress}
                  </div>
                  <span className="text-[10px] text-slate-500">Under active troubleshooting</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[11px]">Resolved / Closed</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                    {analytics.resolved}
                  </div>
                  <span className="text-[10px] text-slate-500">Service restored & verified</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[11px]">Hardware Replaced</span>
                  <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
                    {analytics.replaced}
                  </div>
                  <span className="text-[10px] text-slate-500">Device swaps completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Issues by Category/Type & Top Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Top Issue Types */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white uppercase tracking-wider">
                  Issue Types Breakdown
                </h3>
              </div>

              <div className="space-y-2.5">
                {Object.entries(analytics.issueTypeCount).map(([type, countVal]) => {
                  const count = Number(countVal) || 0;
                  const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="font-medium text-slate-200">{type}</span>
                        <span className="font-mono text-slate-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Incident Branches */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white uppercase tracking-wider">
                  Top Branches with Incidents
                </h3>
              </div>

              {analytics.topBranches.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">No branch incident data yet.</div>
              ) : (
                <div className="space-y-3">
                  {analytics.topBranches.map(([branch, countVal], idx) => {
                    const count = Number(countVal) || 0;
                    const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                    return (
                      <div
                        key={branch}
                        className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white block">{branch}</span>
                            <span className="text-[10px] text-slate-400">{pct}% of total incidents</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-indigo-400 text-sm bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800">
                          {count} {count === 1 ? 'Issue' : 'Issues'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete View Issue Modal */}
      {viewingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                  Incident Audit Record
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {viewingIssue.id}
                  {viewingIssue.odooTicketId && (
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      Odoo: {viewingIssue.odooTicketId}
                    </span>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingIssue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Branch</span>
                <span className="font-bold text-white">{viewingIssue.branchName}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Issue Type</span>
                <span className="font-semibold text-slate-200">{viewingIssue.issueType}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-200">{viewingIssue.category}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Priority</span>
                <span className="font-bold text-amber-400">{viewingIssue.priority}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className="font-bold text-emerald-400">{viewingIssue.status}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Assigned Engineer</span>
                <span className="font-medium text-slate-200">{viewingIssue.assignPerson || 'None'}</span>
              </div>
            </div>

            {viewingIssue.deviceReplace === 'YES' && (
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/80 rounded-lg text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">Old Device ID (Replaced)</span>
                  <span className="font-mono font-bold text-white text-sm">{viewingIssue.oldDeviceId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">Replace Device ID (New)</span>
                  <span className="font-mono font-bold text-white text-sm">{viewingIssue.replaceDeviceId || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Timelines and TAT */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>Incident Timeline & Calculated Turnaround Times</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">1. Client Reported</span>
                  <span className="font-mono text-white font-medium block">
                    {viewingIssue.clientReportingDate || 'N/A'}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    Time: {viewingIssue.clientReportingTime || 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">2. Client Responded</span>
                  <span className="font-mono text-white font-medium block">
                    {viewingIssue.clientResponseDate || 'Pending'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Time: {viewingIssue.clientResponseTime || 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">3. Final Resolution</span>
                  <span className="font-mono text-white font-medium block">
                    {viewingIssue.resolutionDate || 'In Progress'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Time: {viewingIssue.resolutionTime || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-[11px]">
                  <span className="text-slate-400">First Response TAT:</span>{' '}
                  <strong className="text-amber-300 font-mono">
                    {calculateTAT(
                      viewingIssue.clientReportingDate,
                      viewingIssue.clientReportingTime,
                      viewingIssue.clientResponseDate,
                      viewingIssue.clientResponseTime
                    ) || 'Pending'}
                  </strong>
                </div>

                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-[11px]">
                  <span className="text-slate-400">Total Resolution TAT:</span>{' '}
                  <strong className="text-emerald-300 font-mono">
                    {calculateTAT(
                      viewingIssue.clientReportingDate,
                      viewingIssue.clientReportingTime,
                      viewingIssue.resolutionDate,
                      viewingIssue.resolutionTime
                    ) || 'In Progress'}
                  </strong>
                </div>
              </div>
            </div>

            {viewingIssue.details && (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold block">Incident Notes & Resolution Details:</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {viewingIssue.details}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingIssue;
                  setViewingIssue(null);
                  setEditingIssue(toEdit);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={() => setViewingIssue(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Issue Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Edit Incident Record: {editingIssue.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingIssue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveIssue(editingIssue);
                showToast(`Updated ${editingIssue.id}`);
                setEditingIssue(null);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editingIssue.branchName}
                    onChange={(e) =>
                      setEditingIssue({ ...editingIssue, branchName: e.target.value })
                    }
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Odoo Ticket ID</label>
                  <input
                    type="text"
                    value={editingIssue.odooTicketId}
                    onChange={(e) =>
                      setEditingIssue({ ...editingIssue, odooTicketId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Issue Type</label>
                  <select
                    value={editingIssue.issueType}
                    onChange={(e) =>
                      setEditingIssue({ ...editingIssue, issueType: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {systemOptions.issueTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={editingIssue.category}
                    onChange={(e) =>
                      setEditingIssue({ ...editingIssue, category: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Assign Person</label>
                  <select
                    value={editingIssue.assignPerson || ''}
                    onChange={(e) =>
                      setEditingIssue({ ...editingIssue, assignPerson: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="">Unassigned</option>
                    {systemOptions.technicians &&
                      systemOptions.technicians.map((tech) => (
                        <option key={tech} value={tech}>
                          {tech}
                        </option>
                      ))}
                    {editingIssue.assignPerson &&
                      systemOptions.technicians &&
                      !systemOptions.technicians.includes(editingIssue.assignPerson) && (
                        <option value={editingIssue.assignPerson}>{editingIssue.assignPerson}</option>
                      )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Priority</label>
                  <select
                    value={editingIssue.priority}
                    onChange={(e) =>
                      setEditingIssue({
                        ...editingIssue,
                        priority: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                  >
                    {allPriorities.map((p) => (
                      <option key={p} value={p}>
                        {p === 'CRITICAL'
                          ? '🔴 CRITICAL'
                          : p === 'HIGH'
                          ? '🟠 HIGH'
                          : p === 'MEDIUM'
                          ? '🟡 MEDIUM'
                          : p === 'LOW'
                          ? '🟢 LOW'
                          : `⚡ ${p}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status</label>
                  <select
                    value={editingIssue.status}
                    onChange={(e) =>
                      setEditingIssue({
                        ...editingIssue,
                        status: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                  >
                    {allStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st === 'OPEN'
                          ? '🔵 OPEN'
                          : st === 'IN_PROGRESS' || st === 'WORKING'
                          ? '🟡 IN PROGRESS'
                          : st === 'PENDING_CLIENT' || st === 'ASSIGNED'
                          ? '🟠 PENDING CLIENT'
                          : st === 'RESOLVED'
                          ? '🟢 RESOLVED'
                          : st === 'CLOSED'
                          ? '⚪ CLOSED'
                          : `🔹 ${st}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Device Replace</label>
                  <select
                    value={editingIssue.deviceReplace}
                    onChange={(e) =>
                      setEditingIssue({
                        ...editingIssue,
                        deviceReplace: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                  >
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </div>
              </div>

              {editingIssue.deviceReplace === 'YES' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-950/20 border border-amber-800 rounded-lg">
                  <div>
                    <label className="text-amber-300 block mb-1 font-semibold">Old Device ID</label>
                    <input
                      type="text"
                      value={editingIssue.oldDeviceId || ''}
                      onChange={(e) =>
                        setEditingIssue({ ...editingIssue, oldDeviceId: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-amber-700/80 rounded p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-amber-300 block mb-1 font-semibold">Replace Device ID</label>
                    <input
                      type="text"
                      value={editingIssue.replaceDeviceId || ''}
                      onChange={(e) =>
                        setEditingIssue({ ...editingIssue, replaceDeviceId: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-amber-700/80 rounded p-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Details / Notes</label>
                <textarea
                  value={editingIssue.details}
                  onChange={(e) =>
                    setEditingIssue({ ...editingIssue, details: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
