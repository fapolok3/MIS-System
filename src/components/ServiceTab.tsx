import React, { useState, useEffect } from 'react';
import { Headphones, Plus, Edit, Trash2, FileSpreadsheet, Search, X, Upload } from 'lucide-react';
import { Ticket } from '../types';
import { Pagination } from './Pagination';
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

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, localSearch]);

  const effectiveSearch = localSearch.trim() || searchQuery.trim();

  const filteredTickets = tickets.filter((t) => {
    if (!effectiveSearch.trim()) return true;
    const q = effectiveSearch.toLowerCase();
    return (
      (t.id || (t as any).ticketNo || '').toLowerCase().includes(q) ||
      (t.deviceId || '').toLowerCase().includes(q) ||
      ((t as any).sol || '').toLowerCase().includes(q) ||
      ((t as any).category || '').toLowerCase().includes(q) ||
      (t.subject || (t as any).issue || '').toLowerCase().includes(q) ||
      (t.issueType || '').toLowerCase().includes(q) ||
      ((t as any).reportedBy || '').toLowerCase().includes(q) ||
      ((t as any).status || '').toLowerCase().includes(q)
    );
  });

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

  const handleBulkDelete = () => {
    if (validSelectedIds.length === 0) return;
    if (onBulkDeleteTickets) {
      onBulkDeleteTickets(validSelectedIds);
    } else {
      validSelectedIds.forEach((id) => onDeleteTicket(id));
    }
    setSelectedIds([]);
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

    const openCount = filteredTickets.filter((t) => t.status === 'OPEN').length;
    const resolvedCount = filteredTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

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
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-white uppercase flex items-center">
            <Headphones className="w-4 h-4 text-indigo-400 mr-2" />
            Service Ticket & SLA Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto Generated Format: INV-BBL-YYYYMMDD001
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Realtime Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tickets..."
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

          {validSelectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer font-bold text-xs animate-pulse"
              title="Delete selected service tickets"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({validSelectedIds.length})
            </button>
          )}

          {onOpenExcelUploadModal && (
            <button
              onClick={onOpenExcelUploadModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
              title="Bulk import service tickets from Excel file (.xlsx, .xls, .csv)"
            >
              <Upload className="w-3.5 h-3.5" /> Upload from Excel
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={onOpenNewTicketModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
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
                    title="Select or deselect all service tickets"
                  />
                </th>
                <th className="p-2.5 border-r border-slate-800">Issue Number</th>
                <th className="p-2.5 border-r border-slate-800">Email Subject</th>
                <th className="p-2.5 border-r border-slate-800">Email From</th>
                <th className="p-2.5 border-r border-slate-800">
                  Service Request Date
                </th>
                <th className="p-2.5 border-r border-slate-800">Request Time</th>
                <th className="p-2.5 border-r border-slate-800">
                  Planned Provide Date
                </th>
                <th className="p-2.5 border-r border-slate-800">Date to count</th>
                <th className="p-2.5 border-r border-slate-800">
                  Service Provide Date
                </th>
                <th className="p-2.5 border-r border-slate-800">Device Location</th>
                <th className="p-2.5 border-r border-slate-800">Device ID</th>
                <th className="p-2.5 border-r border-slate-800">Location Type</th>
                <th className="p-2.5 border-r border-slate-800">Issue Type</th>
                <th className="p-2.5 border-r border-slate-800">
                  Challan Received By
                </th>
                <th className="p-2.5 border-r border-slate-800">Issue Priority</th>
                <th className="p-2.5 border-r border-slate-800">Current Status</th>
                <th className="p-2.5 border-r border-slate-800">
                  Resolution Time (Days)
                </th>
                <th className="p-2.5 border-r border-slate-800">
                  SLA Threshold (Days)
                </th>
                <th className="p-2.5 border-r border-slate-800">SLA Status</th>
                <th className="p-2.5 border-r border-slate-800">
                  Technician details
                </th>
                <th className="p-2.5 border-r border-slate-800">Remarks</th>
                <th className="p-2.5 border-r border-slate-800">
                  Visit Email Details
                </th>
                <th className="p-2.5 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={23}
                    className="text-center p-4 text-slate-500 font-sans"
                  >
                    No service tickets found
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t) => {
                  const isSelected = validSelectedIds.includes(t.id);
                  const priorityBadge =
                    t.priority === 'CRITICAL' ? (
                      <span className="bg-rose-900/80 text-rose-200 border border-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        CRITICAL
                      </span>
                    ) : (
                      <span className="bg-amber-900/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.priority}
                      </span>
                    );

                  return (
                    <tr
                      key={t.id}
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
                          onChange={() => handleSelectOne(t.id)}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 accent-indigo-600"
                        />
                      </td>
                      <td className="p-2.5 border-r border-slate-800 text-indigo-400 font-bold">
                        {t.id}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.subject}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.from}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.reqDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.reqTime}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.planDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.countDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.provDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.location}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.deviceId}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.locType}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.issueType}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.receivedBy}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {priorityBadge}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.resTime}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.slaThreshold}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <span className="text-emerald-400 font-bold">
                          {t.slaStatus}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.tech}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans max-w-xs truncate">
                        {t.remarks}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans max-w-xs truncate">
                        {t.emailDetails}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenEditTicketModal(t)}
                            className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> EDIT
                          </button>
                          <button
                            onClick={() => onDeleteTicket(t.id)}
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
        {filteredTickets.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <Pagination
              totalItems={filteredTickets.length}
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
