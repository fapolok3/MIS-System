import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Search,
  X,
  Eye,
  Upload,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { Pagination } from './Pagination';
import { ConfirmModal } from './Modals/ConfirmModal';
import { downloadStyledExcel } from '../utils/excelExport';

interface POTabProps {
  pos: PurchaseOrder[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAddPOModal: () => void;
  onOpenEditPOModal?: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
  onBulkDeletePOs?: (ids: string[]) => void;
  onOpenExcelUploadModal?: () => void;
}

export const POTab: React.FC<POTabProps> = ({
  pos,
  searchQuery = '',
  onSearchChange,
  onOpenAddPOModal,
  onOpenEditPOModal,
  onDeletePO,
  onBulkDeletePOs,
  onOpenExcelUploadModal,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // View Details Modal & Confirm Modal States
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
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
  }, [searchQuery, localSearch, filterStatus]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  // Metrics across all PO records
  const totalCount = pos.length;
  const completeCount = useMemo(
    () => pos.filter((p) => (p.status || '').toUpperCase() === 'COMPLETED').length,
    [pos]
  );
  const ongoingCount = useMemo(
    () => pos.filter((p) => (p.status || '').toUpperCase() === 'ONGOING').length,
    [pos]
  );
  const pendingCount = useMemo(
    () => pos.filter((p) => (p.status || '').toUpperCase() === 'PENDING').length,
    [pos]
  );

  const totalAmount = useMemo(() => {
    return pos.reduce((sum, p) => {
      const val = parseFloat(String(p.totalPrice || '').replace(/[^0-9.-]+/g, '')) || 0;
      return sum + val;
    }, 0);
  }, [pos]);

  const completedAmount = useMemo(() => {
    return pos
      .filter((p) => (p.status || '').toUpperCase() === 'COMPLETED')
      .reduce((sum, p) => {
        const val = parseFloat(String(p.totalPrice || '').replace(/[^0-9.-]+/g, '')) || 0;
        return sum + val;
      }, 0);
  }, [pos]);

  const ongoingAmount = useMemo(() => {
    return pos
      .filter((p) => (p.status || '').toUpperCase() === 'ONGOING')
      .reduce((sum, p) => {
        const val = parseFloat(String(p.totalPrice || '').replace(/[^0-9.-]+/g, '')) || 0;
        return sum + val;
      }, 0);
  }, [pos]);

  const pendingAmount = useMemo(() => {
    return pos
      .filter((p) => (p.status || '').toUpperCase() === 'PENDING')
      .reduce((sum, p) => {
        const val = parseFloat(String(p.totalPrice || '').replace(/[^0-9.-]+/g, '')) || 0;
        return sum + val;
      }, 0);
  }, [pos]);

  const completePercent = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;
  const ongoingPercent = totalCount > 0 ? Math.round((ongoingCount / totalCount) * 100) : 0;
  const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;

  const filteredPOs = useMemo(() => {
    return pos.filter((p) => {
      if (filterStatus !== 'ALL' && (p.status || '').toUpperCase() !== filterStatus) {
        return false;
      }
      if (!effectiveSearch.trim()) return true;
      const q = effectiveSearch.toLowerCase();
      return (
        (p.poNumber || p.id || '').toLowerCase().includes(q) ||
        (p.vendor || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q)
      );
    });
  }, [pos, filterStatus, effectiveSearch]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPOs = filteredPOs.slice(startIndex, startIndex + itemsPerPage);

  const validSelectedIds = selectedIds.filter((id) =>
    filteredPOs.some((p) => p.id === id)
  );

  const isAllSelected =
    filteredPOs.length > 0 &&
    filteredPOs.every((p) => validSelectedIds.includes(p.id));

  const isSomeSelected =
    filteredPOs.some((p) => validSelectedIds.includes(p.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPOs.map((p) => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteRow = (po: PurchaseOrder) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Purchase Order',
      message: `Are you sure you want to delete Purchase Order "${po.poNumber || po.id}" (${po.vendor})? This action cannot be undone.`,
      onConfirm: () => {
        onDeletePO(po.id);
        setSelectedIds((prev) => prev.filter((id) => id !== po.id));
      },
    });
  };

  const handleBulkDelete = () => {
    if (validSelectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Bulk Delete Purchase Orders',
      message: `Are you sure you want to permanently delete the ${validSelectedIds.length} selected purchase orders?`,
      onConfirm: () => {
        if (onBulkDeletePOs) {
          onBulkDeletePOs(validSelectedIds);
        } else {
          validSelectedIds.forEach((id) => onDeletePO(id));
        }
        setSelectedIds([]);
      },
    });
  };

  const handleExportExcel = () => {
    const headers = [
      'SL',
      'PO Number',
      'Vendor',
      'Category',
      'Quantity',
      'Total Price',
      'Issue Date',
      'Status',
    ];

    const rows = filteredPOs.map((p, index) => [
      index + 1,
      p.poNumber || p.id,
      p.vendor,
      p.category,
      p.qty,
      p.totalPrice,
      p.issueDate,
      p.status,
    ]);

    downloadStyledExcel({
      title: 'Purchase Orders (PO) Audit Report',
      subtitle: 'Procurement & Order Tracking Audit Log',
      filename: 'Purchase_Orders_Report.xls',
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Orders', value: totalCount },
        { label: 'Completed Orders', value: completeCount },
        { label: 'Ongoing Orders', value: ongoingCount },
        { label: 'Pending Orders', value: pendingCount },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-lg flex justify-between items-center shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center">
          <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mr-2" />
          Purchase Order (PO) Tracker
        </h2>

        <div className="flex items-center space-x-2">
          {/* Realtime Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search POs..."
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
              title="Delete selected purchase orders"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({validSelectedIds.length})
            </button>
          )}

          {onOpenExcelUploadModal && (
            <button
              onClick={onOpenExcelUploadModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
              title="Bulk import purchase orders from Excel file (.xlsx, .xls, .csv)"
            >
              <Upload className="w-3.5 h-3.5" /> Upload from Excel
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={onOpenAddPOModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create New PO
          </button>
        </div>
      </div>

      {/* PRIMARY PO METRICS CARDS (Dashboard / Report Luxury Gradient Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total PO Card */}
        <div
          onClick={() => {
            setFilterStatus('ALL');
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-indigo-500/70 transition ${
            filterStatus === 'ALL'
              ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
              : 'border-indigo-200/80 dark:border-indigo-800/60'
          }`}
          title="Click to view all purchase orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Total PO
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              100% Volume
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalCount}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Procurement Register</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
              {totalAmount > 0
                ? `৳${totalAmount.toLocaleString('en-IN')}`
                : `${pos.reduce((s, p) => s + (p.qty || 1), 0)} items`}
            </span>
          </div>
        </div>

        {/* Complete PO Card */}
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'COMPLETED' ? 'ALL' : 'COMPLETED'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-emerald-500/70 transition ${
            filterStatus === 'COMPLETED'
              ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
              : 'border-emerald-200/80 dark:border-emerald-800/60'
          }`}
          title="Click to filter Completed POs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Total PO Complete
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              Completed
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {completeCount}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Fulfillment Rate</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {completedAmount > 0
                ? `৳${completedAmount.toLocaleString('en-IN')} (${completePercent}%)`
                : `${completePercent}% volume`}
            </span>
          </div>
        </div>

        {/* Ongoing PO Card */}
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'ONGOING' ? 'ALL' : 'ONGOING'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-blue-500/10 via-white to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-blue-500/70 transition ${
            filterStatus === 'ONGOING'
              ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
              : 'border-blue-200/80 dark:border-blue-800/60'
          }`}
          title="Click to filter Ongoing POs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Ongoing
            </span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60">
              In Delivery
            </span>
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {ongoingCount}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Active processing</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
              {ongoingAmount > 0
                ? `৳${ongoingAmount.toLocaleString('en-IN')} (${ongoingPercent}%)`
                : `${ongoingPercent}% in-progress`}
            </span>
          </div>
        </div>

        {/* Pending PO Card */}
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'PENDING' ? 'ALL' : 'PENDING'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-amber-500/10 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-amber-500/70 transition ${
            filterStatus === 'PENDING'
              ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20'
              : 'border-amber-200/80 dark:border-amber-800/60'
          }`}
          title="Click to filter Pending POs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Pending
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              Awaiting
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Pending approvals</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
              {pendingAmount > 0
                ? `৳${pendingAmount.toLocaleString('en-IN')} (${pendingPercent}%)`
                : `${pendingPercent}% queue`}
            </span>
          </div>
        </div>
      </div>

      {/* Filter active status indicator */}
      {filterStatus !== 'ALL' && (
        <div className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 px-3.5 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-slate-600 dark:text-slate-400">Showing orders with status:</span>
            <span className="font-bold uppercase text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-700">
              {filterStatus}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              ({filteredPOs.length} of {totalCount} records)
            </span>
          </div>
          <button
            onClick={() => {
              setFilterStatus('ALL');
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}

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
                    title="Select or deselect all purchase orders"
                  />
                </th>
                <th className="p-3">PO Number</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Category</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Total Price</th>
                <th className="p-3">PO Issue Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center sticky right-0 z-10 bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-300">
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-slate-500 font-sans">
                    No Purchase Orders recorded.
                  </td>
                </tr>
              ) : (
                paginatedPOs.map((po, poIdx) => {
                  const isSelected = validSelectedIds.includes(po.id);
                  return (
                    <tr
                      key={`po-row-${po.id}-${poIdx}`}
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
                          onChange={() => handleSelectOne(po.id)}
                          className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                        />
                      </td>
                      <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">{po.poNumber}</td>
                    <td className="p-3 font-sans text-slate-800 dark:text-slate-200">{po.vendor}</td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300">{po.category}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">{po.qty} Devices</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">{po.totalPrice}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{po.issueDate}</td>
                    <td className="p-3">
                      {po.status === 'COMPLETED' ? (
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-sans text-[10px] border border-emerald-300 dark:border-emerald-700/50 font-semibold">
                          COMPLETED
                        </span>
                      ) : po.status === 'ONGOING' ? (
                        <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-sans text-[10px] border border-amber-300 dark:border-amber-700/50 font-semibold">
                          ONGOING
                        </span>
                      ) : (
                        <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-sans text-[10px] border border-rose-300 dark:border-rose-700/50 font-semibold">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-xs">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingPO(po)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="View All Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onOpenEditPOModal && (
                          <button
                            onClick={() => onOpenEditPOModal(po)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit Purchase Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRow(po)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Delete Purchase Order"
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

        {/* Pagination Bar */}
        {filteredPOs.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              totalItems={filteredPOs.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Complete PO Details Modal (Styled like Issue & Job Entry Report) */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  PO Number: {viewingPO.poNumber || viewingPO.id} • Status: {viewingPO.status}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Complete Purchase Order Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingPO(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'PO Number', val: viewingPO.poNumber || viewingPO.id },
                { label: 'Vendor Name', val: viewingPO.vendor },
                { label: 'Category / Deployment', val: viewingPO.category },
                { label: 'Device Quantity', val: `${viewingPO.qty} Devices` },
                { label: 'Total Price', val: viewingPO.totalPrice },
                { label: 'PO Issue Date', val: viewingPO.issueDate },
                { label: 'Fulfillment Status', val: viewingPO.status },
                { label: 'Record Internal ID', val: viewingPO.id },
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
              {onOpenEditPOModal && (
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingPO;
                    setViewingPO(null);
                    onOpenEditPOModal(toEdit);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                >
                  Edit This PO
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingPO(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for PO Deletion (Single & Bulk) */}
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
