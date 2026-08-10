import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, FileSpreadsheet, Search, X } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface POTabProps {
  pos: PurchaseOrder[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAddPOModal: () => void;
  onOpenEditPOModal?: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
}

export const POTab: React.FC<POTabProps> = ({
  pos,
  searchQuery = '',
  onSearchChange,
  onOpenAddPOModal,
  onOpenEditPOModal,
  onDeletePO,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  const filteredPOs = pos.filter((p) => {
    if (!effectiveSearch.trim()) return true;
    const q = effectiveSearch.toLowerCase();
    return (
      (p.poNumber || p.id || '').toLowerCase().includes(q) ||
      (p.vendor || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  });

  const totalCount = filteredPOs.length;
  const completeCount = filteredPOs.filter((p) => p.status === 'COMPLETED').length;
  const ongoingCount = filteredPOs.filter((p) => p.status === 'ONGOING').length;
  const pendingCount = filteredPOs.filter((p) => p.status === 'PENDING').length;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPOs = filteredPOs.slice(startIndex, startIndex + itemsPerPage);

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
      subtitle: 'MIS Procurement & Order Tracking Audit Log',
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
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex justify-between items-center">
        <h2 className="text-sm font-bold text-white uppercase flex items-center">
          <FileText className="w-4 h-4 text-indigo-400 mr-2" />
          Purchase Order (PO) Tracker
        </h2>

        <div className="flex items-center space-x-2">
          {/* Realtime Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search POs..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 text-slate-100 placeholder-slate-500 text-xs rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all w-40 sm:w-52 focus:w-60 shadow-inner"
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

          <button
            onClick={handleExportExcel}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={onOpenAddPOModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create New PO
          </button>
        </div>
      </div>

      {/* PO DASHBOARD CARDS INTEGRATED */}
      <div className="po-card-grid">
        <div className="po-card total">
          <div className="po-card-title">Total PO</div>
          <div className="po-card-value">{totalCount}</div>
        </div>
        <div className="po-card complete">
          <div className="po-card-title">Total PO Complete</div>
          <div className="po-card-value">{completeCount}</div>
        </div>
        <div className="po-card ongoing">
          <div className="po-card-title">Ongoing</div>
          <div className="po-card-value">{ongoingCount}</div>
        </div>
        <div className="po-card pending">
          <div className="po-card-title">Pending</div>
          <div className="po-card-value">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Category</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Total Price</th>
                <th className="p-3">PO Issue Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500 font-sans">
                    No Purchase Orders recorded.
                  </td>
                </tr>
              ) : (
                paginatedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-indigo-400 font-bold">{po.poNumber}</td>
                    <td className="p-3 font-sans">{po.vendor}</td>
                    <td className="p-3 font-sans">{po.category}</td>
                    <td className="p-3">{po.qty} Devices</td>
                    <td className="p-3">{po.totalPrice}</td>
                    <td className="p-3">{po.issueDate}</td>
                    <td className="p-3">
                      {po.status === 'COMPLETED' ? (
                        <span className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-sans text-[10px] border border-emerald-700/50">
                          COMPLETED
                        </span>
                      ) : po.status === 'ONGOING' ? (
                        <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded font-sans text-[10px] border border-amber-700/50">
                          ONGOING
                        </span>
                      ) : (
                        <span className="bg-rose-900/50 text-rose-300 px-2 py-0.5 rounded font-sans text-[10px] border border-rose-700/50">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenEditPOModal && (
                          <button
                            onClick={() => onOpenEditPOModal(po)}
                            className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
                            title="Edit Purchase Order"
                          >
                            <Edit className="w-3 h-3" /> EDIT
                          </button>
                        )}
                        <button
                          onClick={() => onDeletePO(po.id)}
                          className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
                          title="Delete Purchase Order"
                        >
                          <Trash2 className="w-3 h-3" /> DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredPOs.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
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
    </div>
  );
};
