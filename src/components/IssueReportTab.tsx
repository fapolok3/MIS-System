import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  Search,
  Download,
  FileSpreadsheet,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RotateCcw,
  X,
  Layers,
  Activity,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';

import {
  IssueTrackerItem,
  CategoryGroup,
  SystemOptions,
} from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PREMESIS_OPTIONS,
  ISSUE_FIELD_KEYS,
  ISSUE_FIELD_LABELS,
  normalizeIssue,
} from '../utils/issueConstants';

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
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterPremesis, setFilterPremesis] = useState<string>('ALL');
  const [filterReplace, setFilterReplace] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [viewingIssue, setViewingIssue] = useState<IssueTrackerItem | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueTrackerItem | null>(null);
  const [toastMessage, setToastMessage] = useState('');

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

  // Normalize all issues to guarantee 34 fields
  const normalizedIssues = useMemo(() => {
    return issues.map((item, index) => normalizeIssue(item, index));
  }, [issues]);

  // Dynamic premises list
  const availablePremesis = useMemo(() => {
    const list = new Set<string>(PREMESIS_OPTIONS);
    normalizedIssues.forEach((i) => {
      if (i.premesisName) list.add(i.premesisName);
    });
    return Array.from(list);
  }, [normalizedIssues]);

  // Status Metrics
  const { statusCounts, highPriorityCount, replaceCount } = useMemo(() => {
    const counts: Record<string, number> = {
      Open: 0,
      Pending: 0,
      OnBoard: 0,
      Working: 0,
      Done: 0,
    };
    let high = 0;
    let replace = 0;

    normalizedIssues.forEach((item) => {
      const s = item.status || 'Open';
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts.Open = (counts.Open || 0) + 1;
      }
      if (item.priority === 'High' || item.priority === 'CRITICAL') {
        high++;
      }
      if (item.deviceReplace === 'Yes') {
        replace++;
      }
    });

    return { statusCounts: counts, highPriorityCount: high, replaceCount: replace };
  }, [normalizedIssues]);

  // Filtered dataset across all 34 fields
  const filteredIssues = useMemo(() => {
    return normalizedIssues.filter((item) => {
      // Global Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAny = ISSUE_FIELD_KEYS.some((key) => {
          const val = (item as any)[key];
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(q);
        });
        if (!matchAny) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }

      // Priority filter
      if (filterPriority !== 'ALL' && item.priority !== filterPriority) {
        return false;
      }

      // Premesis filter
      if (filterPremesis !== 'ALL' && item.premesisName !== filterPremesis) {
        return false;
      }

      // Device Replace filter
      if (filterReplace !== 'ALL' && item.deviceReplace !== filterReplace) {
        return false;
      }

      return true;
    });
  }, [normalizedIssues, searchQuery, filterStatus, filterPriority, filterPremesis, filterReplace]);

  // Pagination calculation
  const totalItems = filteredIssues.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedIssues = useMemo(() => {
    return filteredIssues.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIssues, startIndex, itemsPerPage]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedIssues.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Handlers
  const handleDeleteRow = (item: IssueTrackerItem) => {
    setConfirmConfig({
      isOpen: true,
      title: `Delete Log Entry SL #${item.sl}?`,
      message: `Are you sure you want to delete Odoo ID "${item.odooId || item.id}" (${item.clientName})? This action cannot be undone.`,
      onConfirm: () => {
        onDeleteIssue(item.id);
        setSelectedIds((prev) => prev.filter((id) => id !== item.id));
        showToast(`Log entry SL #${item.sl} deleted successfully.`);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: `Bulk Delete ${selectedIds.length} Entries?`,
      message: `Are you sure you want to permanently delete the ${selectedIds.length} selected issue entries?`,
      onConfirm: () => {
        if (onBulkDeleteIssues) {
          onBulkDeleteIssues(selectedIds);
        } else {
          selectedIds.forEach((id) => onDeleteIssue(id));
        }
        setSelectedIds([]);
        showToast(`${selectedIds.length} entries deleted successfully.`);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterPremesis('ALL');
    setFilterReplace('ALL');
    setCurrentPage(1);
  };

  // CSV Export (All 34 Fields)
  const handleExportCSV = () => {
    let csv = ISSUE_FIELD_KEYS.join(',') + '\n';
    filteredIssues.forEach((row) => {
      const line = ISSUE_FIELD_KEYS.map((k) => {
        const val = (row as any)[k] !== undefined && (row as any)[k] !== null ? String((row as any)[k]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issue_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV export downloaded with all 34 fields!');
  };

  // Styled Excel Export (All 34 Columns)
  const handleExportExcel = () => {
    const headers = ISSUE_FIELD_KEYS.map((k) => ISSUE_FIELD_LABELS[k] || k);
    const data = filteredIssues.map((row) => {
      return ISSUE_FIELD_KEYS.map((k) => {
        const val = (row as any)[k];
        if (val === undefined || val === null) return '-';
        return val;
      });
    });

    downloadStyledExcel({
      title: 'Issue & Job Entry Report',
      subtitle: `Export of ${filteredIssues.length} records across all 34 fields • Generated on ${new Date().toLocaleDateString()}`,
      filename: `Issue_Report_${new Date().toISOString().split('T')[0]}`,
      headers,
      data,
      summaryCards: [
        { label: 'Total Records', value: normalizedIssues.length },
        { label: 'Open', value: statusCounts.Open || 0 },
        { label: 'Pending', value: statusCounts.Pending || 0 },
        { label: 'OnBoard', value: statusCounts.OnBoard || 0 },
        { label: 'Working', value: statusCounts.Working || 0 },
        { label: 'Done', value: statusCounts.Done || 0 },
      ],
    });
    showToast('Styled Excel report downloaded!');
  };

  // Save changes from Edit Modal
  const handleSaveModalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;

    try {
      await onSaveIssue(editingIssue);
      showToast(`Entry SL #${editingIssue.sl} updated successfully!`);
      setEditingIssue(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update entry.');
    }
  };

  // Badges matching BranchReportTab
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 mr-1.5 animate-pulse" />
            Open
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mr-1.5" />
            Pending
          </span>
        );
      case 'OnBoard':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mr-1.5" />
            OnBoard
          </span>
        );
      case 'Working':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 mr-1.5" />
            Working
          </span>
        );
      case 'Done':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-1.5" />
            Done
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status || 'Open'}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
            HIGH
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
            MED
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30">
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {priority}
          </span>
        );
    }
  };

  const getDeviceReplaceBadge = (replace: string) => {
    if (replace === 'Yes') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
          YES
        </span>
      );
    }
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">No</span>;
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
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

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Issue & Job Entry Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive 34-field tracking of hardware replacements, service timelines, logistics, and resolutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete ({selectedIds.length})
            </button>
          )}
          <button
            onClick={onNavigateToTracker}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Log Entry
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Stat Cards - Interactive & styled like BranchReportTab */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Entries */}
        <div
          onClick={() => {
            setFilterStatus('ALL');
            setFilterReplace('ALL');
          }}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'ALL' && filterReplace === 'ALL'
              ? 'bg-indigo-50/70 dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Entries</span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {normalizedIssues.length}
          </div>
        </div>

        {/* Open */}
        <div
          onClick={() => setFilterStatus('Open')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'Open'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Open</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {statusCounts.Open || 0}
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setFilterStatus('Pending')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'Pending'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {statusCounts.Pending || 0}
          </div>
        </div>

        {/* OnBoard */}
        <div
          onClick={() => setFilterStatus('OnBoard')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'OnBoard'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">OnBoard</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {statusCounts.OnBoard || 0}
          </div>
        </div>

        {/* Working */}
        <div
          onClick={() => setFilterStatus('Working')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'Working'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Working</span>
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {statusCounts.Working || 0}
          </div>
        </div>

        {/* Done */}
        <div
          onClick={() => setFilterStatus('Done')}
          className={`p-3 rounded-xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'Done'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Done</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {statusCounts.Done || 0}
          </div>
        </div>
      </div>

      {/* Filter Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Premises Select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Premises:</label>
            <select
              value={filterPremesis}
              onChange={(e) => {
                setFilterPremesis(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Premises</option>
              {availablePremesis.map((prem) => (
                <option key={prem} value={prem}>
                  {prem}
                </option>
              ))}
            </select>
          </div>

          {/* Device Replace Select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Replace:</label>
            <select
              value={filterReplace}
              onChange={(e) => {
                setFilterReplace(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Replaced</option>
              <option value="Yes">Yes Only</option>
              <option value="No">No Only</option>
            </select>
          </div>

          {/* Reset Filters Link Button */}
          {(filterStatus !== 'ALL' ||
            filterPriority !== 'ALL' ||
            filterPremesis !== 'ALL' ||
            filterReplace !== 'ALL' ||
            searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 py-1 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Realtime Search Input */}
        <div className="relative flex items-center w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across all 34 fields..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[2900px]">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0 z-10 whitespace-nowrap">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      displayedIssues.length > 0 &&
                      displayedIssues.every((i) => selectedIds.includes(i.id))
                    }
                    className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                    title="Select all on current page"
                  />
                </th>
                <th className="px-3 py-3 text-center w-12">SL</th>
                <th className="px-3 py-3">Issue Date</th>
                <th className="px-3 py-3">Odoo ID</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Premesis</th>
                <th className="px-3 py-3 text-center">Priority</th>
                <th className="px-3 py-3 text-center">Replace</th>
                <th className="px-3 py-3">Old Device</th>
                <th className="px-3 py-3">New Device</th>
                <th className="px-3 py-3">Reporting Time</th>
                <th className="px-3 py-3">Response Time</th>
                <th className="px-3 py-3">Accessories</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">District</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Contact Person</th>
                <th className="px-3 py-3">Number</th>
                <th className="px-3 py-3">Comments</th>
                <th className="px-3 py-3">Delivery Option</th>
                <th className="px-3 py-3">Service Type</th>
                <th className="px-3 py-3">KAM</th>
                <th className="px-3 py-3">Segment</th>
                <th className="px-3 py-3">Invoice Handover</th>
                <th className="px-3 py-3">Collection Amount</th>
                <th className="px-3 py-3">Payment Method</th>
                <th className="px-3 py-3">Installation Status</th>
                <th className="px-3 py-3">Handed Over To</th>
                <th className="px-3 py-3">Assign Person</th>
                <th className="px-3 py-3 text-center">Handover Collected</th>
                <th className="px-3 py-3">Installation Date</th>
                <th className="px-3 py-3 text-center">Unit Qty</th>
                <th className="px-3 py-3">Vendor Bill</th>
                <th className="px-3 py-3">Remarks</th>
                <th className="px-3 py-3 text-center sticky right-0 z-20 bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 whitespace-nowrap">
              {displayedIssues.length === 0 ? (
                <tr>
                  <td
                    colSpan={36}
                    className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    No job log entries found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                displayedIssues.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(item.id)}
                          className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-400 dark:text-slate-500">
                        {item.sl}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        {item.issueLogDate || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        {item.odooId || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-200">
                        {item.clientName || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        {item.premesisName || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">{getPriorityBadge(item.priority)}</td>
                      <td className="px-3 py-2.5 text-center">{getDeviceReplaceBadge(item.deviceReplace)}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                        {item.oldDevice || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                        {item.newDevice || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {item.clientReportingTime ? String(item.clientReportingTime).replace('T', ' ') : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {item.responseTime ? String(item.responseTime).replace('T', ' ') : '-'}
                      </td>
                      <td className="px-3 py-2.5 max-w-[160px] truncate text-slate-600 dark:text-slate-400" title={item.accessories}>
                        {item.accessories || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        {item.product || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        {item.district || '-'}
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate text-slate-600 dark:text-slate-400" title={item.address}>
                        {item.address || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        {item.contactPerson || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                        {item.number || '-'}
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate text-slate-500 dark:text-slate-400" title={item.comments}>
                        {item.comments || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.deliveryOption || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.serviceType || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        {item.kam || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.segment || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.invoiceHandover || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {item.collectionAmount ? `৳${item.collectionAmount}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.paymentMethod || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.installationStatus || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.handedOverTo || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                        {item.assignPerson || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400">
                        {item.handoverCollected || 'No'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        {item.installationDate || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-700 dark:text-slate-300">
                        {item.unitQty || 1}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                        {item.vendorBillAmount ? `৳${item.vendorBillAmount}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate text-slate-500 dark:text-slate-400" title={item.remarks}>
                        {item.remarks || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingIssue(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="View All 34 Fields"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingIssue(item)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Delete Entry"
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
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{displayedIssues.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredIssues.length}</span> entries ({normalizedIssues.length} total)
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredIssues.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(num) => {
              setItemsPerPage(num);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Complete Record Details Modal (34 Fields View) */}
      {viewingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  SL #{viewingIssue.sl} • Odoo ID: {viewingIssue.odooId || '-'}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Complete Record Details (34 Fields)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingIssue(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ISSUE_FIELD_KEYS.map((key, idx) => {
                const label = ISSUE_FIELD_LABELS[key] || key;
                let val = (viewingIssue as any)[key];
                if (val === undefined || val === null || val === '') val = '-';
                if (key === 'clientReportingTime' || key === 'responseTime') {
                  val = String(val).replace('T', ' ');
                }
                return (
                  <div
                    key={key}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {idx + 1}. {label}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 break-words">
                      {String(val)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingIssue;
                  setViewingIssue(null);
                  setEditingIssue(toEdit);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
              >
                Edit This Record
              </button>
              <button
                type="button"
                onClick={() => setViewingIssue(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Record Edit Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Record Editor
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Edit Entry SL #{editingIssue.sl} ({editingIssue.odooId || 'No Odoo ID'})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingIssue(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalEdit} className="space-y-5 text-xs">
              {/* 1. Ticket & Identification Details */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  1. Ticket & Identification Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">SL</label>
                    <input
                      type="number"
                      value={editingIssue.sl || 1}
                      onChange={(e) => setEditingIssue({ ...editingIssue, sl: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Issue Date</label>
                    <input
                      type="date"
                      value={editingIssue.issueLogDate || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, issueLogDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Odoo ID</label>
                    <input
                      type="text"
                      value={editingIssue.odooId || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, odooId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Status</label>
                    <select
                      value={editingIssue.status || 'Open'}
                      onChange={(e) => setEditingIssue({ ...editingIssue, status: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Client Name</label>
                    <input
                      type="text"
                      value={editingIssue.clientName || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, clientName: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Premesis Name</label>
                    <input
                      type="text"
                      value={editingIssue.premesisName || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, premesisName: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Priority & Replacement */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  2. Priority & Hardware Replacement
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Priority</label>
                    <select
                      value={editingIssue.priority || 'Medium'}
                      onChange={(e) => setEditingIssue({ ...editingIssue, priority: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Device Replace?</label>
                    <select
                      value={editingIssue.deviceReplace || 'No'}
                      onChange={(e) =>
                        setEditingIssue({
                          ...editingIssue,
                          deviceReplace: e.target.value as 'Yes' | 'No',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Old Device</label>
                    <input
                      type="text"
                      value={editingIssue.oldDevice || '-'}
                      onChange={(e) => setEditingIssue({ ...editingIssue, oldDevice: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">New Device</label>
                    <input
                      type="text"
                      value={editingIssue.newDevice || '-'}
                      onChange={(e) => setEditingIssue({ ...editingIssue, newDevice: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Timelines & Products */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  3. Timeline & Products
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Reporting Time</label>
                    <input
                      type="datetime-local"
                      value={editingIssue.clientReportingTime || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, clientReportingTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Response Time</label>
                    <input
                      type="datetime-local"
                      value={editingIssue.responseTime || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, responseTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Accessories</label>
                    <input
                      type="text"
                      value={editingIssue.accessories || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, accessories: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Product</label>
                    <input
                      type="text"
                      value={editingIssue.product || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, product: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Location & Contact */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  4. Location & Contact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">District</label>
                    <input
                      type="text"
                      value={editingIssue.district || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, district: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Address</label>
                    <input
                      type="text"
                      value={editingIssue.address || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, address: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Contact Person</label>
                    <input
                      type="text"
                      value={editingIssue.contactPerson || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, contactPerson: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Number</label>
                    <input
                      type="text"
                      value={editingIssue.number || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, number: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Logistics & Service */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  5. Logistics, Operations & Team
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Delivery Option</label>
                    <input
                      type="text"
                      value={editingIssue.deliveryOption || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, deliveryOption: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Service Type</label>
                    <input
                      type="text"
                      value={editingIssue.serviceType || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, serviceType: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">KAM</label>
                    <input
                      type="text"
                      value={editingIssue.kam || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, kam: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Assign Person</label>
                    <input
                      type="text"
                      value={editingIssue.assignPerson || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, assignPerson: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Finance & Billing */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  6. Finance, Billing & Installation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Collection (৳)</label>
                    <input
                      type="text"
                      value={editingIssue.collectionAmount || '0'}
                      onChange={(e) => setEditingIssue({ ...editingIssue, collectionAmount: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Payment Method</label>
                    <input
                      type="text"
                      value={editingIssue.paymentMethod || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, paymentMethod: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Vendor Bill (৳)</label>
                    <input
                      type="text"
                      value={editingIssue.vendorBillAmount || '0'}
                      onChange={(e) => setEditingIssue({ ...editingIssue, vendorBillAmount: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Installation Date</label>
                    <input
                      type="date"
                      value={editingIssue.installationDate || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, installationDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Comments & Remarks */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                  7. Comments & Remarks
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Comments</label>
                    <textarea
                      rows={2}
                      value={editingIssue.comments || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, comments: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Remarks</label>
                    <textarea
                      rows={2}
                      value={editingIssue.remarks || ''}
                      onChange={(e) => setEditingIssue({ ...editingIssue, remarks: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
