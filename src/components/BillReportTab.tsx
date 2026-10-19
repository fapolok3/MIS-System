import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileDown,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  MapPin,
  Calendar,
  X,
  FileCode,
  Receipt,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { BillItem } from '../types';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BillReportTabProps {
  bills: BillItem[];
  onSaveBill: (bill: BillItem) => void;
  onDeleteBill: (id: string) => void;
  onBulkDeleteBills?: (ids: string[]) => void;
  onNavigateToTracker: () => void;
  onEditBillInTracker: (bill: BillItem) => void;
  onLoadDemoBills?: () => void;
}

export const BillReportTab: React.FC<BillReportTabProps> = ({
  bills,
  onSaveBill,
  onDeleteBill,
  onBulkDeleteBills,
  onNavigateToTracker,
  onEditBillInTracker,
  onLoadDemoBills,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // View Modal state
  const [viewingBill, setViewingBill] = useState<BillItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Confirm delete modal state
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

  // KPI Calculations
  const totalBills = bills.length;
  const totalAmount = useMemo(() => bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0), [bills]);
  const pendingBills = useMemo(() => bills.filter((b) => b.status === 'Pending'), [bills]);
  const submittedBills = useMemo(() => bills.filter((b) => b.status === 'Submitted'), [bills]);
  const paidBills = useMemo(() => bills.filter((b) => b.status === 'Paid'), [bills]);
  const partialBills = useMemo(() => bills.filter((b) => b.status === 'Partial'), [bills]);

  const pendingAmount = useMemo(() => pendingBills.reduce((s, b) => s + (Number(b.amount) || 0), 0), [pendingBills]);
  const submittedAmount = useMemo(() => submittedBills.reduce((s, b) => s + (Number(b.amount) || 0), 0), [submittedBills]);
  const paidAmount = useMemo(() => paidBills.reduce((s, b) => s + (Number(b.amount) || 0), 0), [paidBills]);
  const partialAmount = useMemo(() => partialBills.reduce((s, b) => s + (Number(b.amount) || 0), 0), [partialBills]);
  const avgBillAmount = totalBills > 0 ? Math.round(totalAmount / totalBills) : 0;

  // This month KPI
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthBills = useMemo(
    () => bills.filter((b) => (b.handoverDate || '').startsWith(currentMonthStr)),
    [bills, currentMonthStr]
  );
  const thisMonthAmount = useMemo(
    () => thisMonthBills.reduce((s, b) => s + (Number(b.amount) || 0), 0),
    [thisMonthBills]
  );

  // Available Months for dropdown
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      if (b.handoverDate && b.handoverDate.length >= 7) {
        set.add(b.handoverDate.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [bills]);

  // Available Categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      if (b.billType) set.add(b.billType);
    });
    return Array.from(set).sort();
  }, [bills]);

  // Top Category
  const topCategoryInfo = useMemo(() => {
    const counts: Record<string, number> = {};
    bills.forEach((b) => {
      if (b.billType) counts[b.billType] = (counts[b.billType] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return { category: sorted[0][0], count: sorted[0][1] };
    }
    return { category: '—', count: 0 };
  }, [bills]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          b.billNumber.toLowerCase().includes(q) ||
          (b.invoiceNumber || '').toLowerCase().includes(q) ||
          (b.vendor || '').toLowerCase().includes(q) ||
          (b.client || '').toLowerCase().includes(q) ||
          (b.clientLocation || '').toLowerCase().includes(q) ||
          (b.billType || '').toLowerCase().includes(q) ||
          (b.description || '').toLowerCase().includes(q) ||
          (b.remarks || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (filterMonth !== 'ALL' && (!b.handoverDate || !b.handoverDate.startsWith(filterMonth))) {
        return false;
      }
      if (filterType !== 'ALL' && b.billType !== filterType) {
        return false;
      }
      if (filterStatus !== 'ALL' && b.status !== filterStatus) {
        return false;
      }
      if (filterPaymentMethod !== 'ALL' && b.paymentMethod !== filterPaymentMethod) {
        return false;
      }
      return true;
    });
  }, [bills, searchQuery, filterMonth, filterType, filterStatus, filterPaymentMethod]);

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage) || 1;
  const paginatedBills = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBills.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBills, currentPage, itemsPerPage]);

  // Select all on page
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedBills.map((b) => b.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedBills.map((b) => b.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const isAllOnPageSelected =
    paginatedBills.length > 0 && paginatedBills.every((b) => selectedIds.includes(b.id));

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Selected Bills',
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected bill record(s)? This action cannot be undone.`,
      onConfirm: () => {
        if (onBulkDeleteBills) {
          onBulkDeleteBills(selectedIds);
        } else {
          selectedIds.forEach((id) => onDeleteBill(id));
        }
        setSelectedIds([]);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Single Delete
  const handleDeleteRow = (b: BillItem) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Bill Record',
      message: `Are you sure you want to delete bill "${b.billNumber}"? This cannot be undone.`,
      onConfirm: () => {
        onDeleteBill(b.id);
        setSelectedIds((prev) => prev.filter((id) => id !== b.id));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Charts Config
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Chart 1: Category Distribution
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    bills.forEach((b) => {
      if (b.billType) counts[b.billType] = (counts[b.billType] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    return {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Total Bills',
          data: data.length ? data : [0],
          backgroundColor: [
            '#6366f1',
            '#10b981',
            '#f59e0b',
            '#ec4899',
            '#3b82f6',
            '#8b5cf6',
            '#06b6d4',
          ],
          borderRadius: 6,
        },
      ],
    };
  }, [bills]);

  // Chart 2: Monthly Amount Trend
  const monthlyTrendData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    bills.forEach((b) => {
      const m = (b.handoverDate || '').substring(0, 7);
      if (m) monthMap[m] = (monthMap[m] || 0) + (Number(b.amount) || 0);
    });
    const sorted = Object.keys(monthMap).sort();
    const labels = sorted.map((m) => {
      const [y, mo] = m.split('-');
      return new Date(parseInt(y, 10), parseInt(mo, 10) - 1).toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    });
    const data = sorted.map((m) => monthMap[m]);
    return {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Total Amount (৳)',
          data: data.length ? data : [0],
          borderColor: '#10b981',
          backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
        },
      ],
    };
  }, [bills, isDark]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredBills.length === 0) {
      setToastMessage('No bill records found matching filter criteria.');
      return;
    }

    const headers = [
      'Bill Number',
      'Invoice Number',
      'Vendor',
      'Client',
      'Client Location',
      'Description',
      'Bill Type',
      'Amount (BDT)',
      'Handover Date',
      'Submission Date',
      'Receive Date',
      'Payment Date',
      'Status',
      'Payment Method',
      'Approved By',
      'Remarks',
    ];

    const rows = filteredBills.map((b) => [
      b.billNumber,
      b.invoiceNumber || '-',
      b.vendor || '-',
      b.client || '-',
      b.clientLocation || '-',
      b.description || '-',
      b.billType || '-',
      b.amount || 0,
      b.handoverDate || '-',
      b.submissionDate || '-',
      b.receivedDate || '-',
      b.paymentDate || '-',
      b.status,
      b.paymentMethod || '-',
      b.approvedBy || '-',
      b.remarks || '-',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(15, h.length + 3) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bills');
    XLSX.writeFile(wb, `Bill_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Full PDF Register
  const handleExportPDF = () => {
    if (filteredBills.length === 0) {
      setToastMessage('No bill records to export.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageW = 297;
    const margin = 12;

    // Header band
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 26, pageW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BLACK BANK PLC', margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text('Corporate Billing Management Suite · Head Office, Dhaka', margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('BILL REGISTER REPORT', pageW - margin, 10, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(200, 210, 230);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 15, { align: 'right' });
    doc.text(
      `Total Bills: ${filteredBills.length}  |  Amount: BDT ${filteredBills
        .reduce((s, b) => s + (Number(b.amount) || 0), 0)
        .toLocaleString('en-IN')}`,
      pageW - margin,
      20,
      { align: 'right' }
    );

    const body = filteredBills.map((b) => [
      b.billNumber,
      b.invoiceNumber || '-',
      b.client,
      b.clientLocation,
      b.billType,
      (Number(b.amount) || 0).toLocaleString('en-IN'),
      b.handoverDate || '-',
      b.submissionDate || '-',
      b.paymentDate || '-',
      b.status,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [
        [
          'Bill #',
          'Invoice',
          'Client',
          'Location',
          'Category',
          'Amount (৳)',
          'Handover',
          'Submitted',
          'Payment',
          'Status',
        ],
      ],
      body,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: { fontSize: 7, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        5: { halign: 'right', fontStyle: 'bold' },
        9: { halign: 'center' },
      },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 200, pageW, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('Black Bank PLC · Accounts & Audit Division', margin, 206);
      doc.text(
        `Page ${i} of ${pageCount}  |  Computer-generated document`,
        pageW - margin,
        206,
        { align: 'right' }
      );
    }

    doc.save(`Bill_Register_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export to Word (.doc)
  const handleExportWord = () => {
    if (filteredBills.length === 0) {
      setToastMessage('No bill records to export.');
      return;
    }

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Bill Register</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #1e293b; }
        .header { background: #0f172a; color: #fff; padding: 14px 20px; }
        .header h1 { margin: 0; font-size: 16pt; }
        .header p { margin: 4px 0 0; font-size: 8pt; color: #cbd5e1; }
        .accent { height: 3px; background: #4f46e5; }
        .meta { padding: 10px 20px; background: #f1f5f9; font-size: 8.5pt; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; margin-top: 8px; }
        th { background: #4f46e5; color: white; padding: 6px; text-align: left; font-size: 8pt; }
        td { border: 1px solid #e2e8f0; padding: 5px; font-size: 8pt; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 20px; padding: 8px 20px; background: #0f172a; color: #fff; font-size: 7pt; }
      </style></head><body>
      <div class="header">
        <h1>Black Bank PLC</h1>
        <p>Corporate Billing Management Suite · Head Office, Dhaka, Bangladesh</p>
      </div>
      <div class="accent"></div>
      <div class="meta">
        <b>BILL REGISTER REPORT</b><br>
        Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp;
        Total Bills: ${filteredBills.length} &nbsp;|&nbsp;
        Total Amount: ৳${filteredBills.reduce((s, b) => s + (Number(b.amount) || 0), 0).toLocaleString('en-IN')}
      </div>
      <table>
        <tr>
          <th>Bill #</th><th>Invoice</th><th>Client</th><th>Location</th><th>Category</th>
          <th>Amount (৳)</th><th>Handover</th><th>Submitted</th><th>Payment</th><th>Status</th>
        </tr>`;

    filteredBills.forEach((b) => {
      html += `<tr>
        <td><b>${b.billNumber}</b></td><td>${b.invoiceNumber || '-'}</td><td>${b.client}</td><td>${b.clientLocation}</td>
        <td>${b.billType}</td><td align="right"><b>${(Number(b.amount) || 0).toLocaleString()}</b></td>
        <td>${b.handoverDate || '-'}</td><td>${b.submissionDate || '-'}</td><td>${b.paymentDate || '-'}</td>
        <td>${b.status}</td>
      </tr>`;
    });

    html += `</table>
      <div class="footer">Black Bank PLC · Computer-generated document</div>
      </body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_Register_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Sample Excel
  const handleDownloadSample = () => {
    const headers = [
      'Bill Number',
      'Invoice Number',
      'Vendor',
      'Client',
      'Client Location',
      'Description',
      'Bill Type',
      'Amount (BDT)',
      'Handover Date',
      'Submission Date',
      'Receive Date',
      'Payment Date',
      'Status',
      'Payment Method',
      'Approved By',
      'Remarks',
    ];
    const sampleRows = [
      [
        'BILL-20261013-100001',
        'INV-2026-001',
        'Tech Solutions Ltd',
        'Black Bank PLC',
        'Gulistan Branch',
        'CCTV installation at main entrance',
        'Installation Support',
        25000,
        '2026-10-01',
        '2026-10-03',
        '2026-10-05',
        '2026-10-15',
        'Submitted',
        'Bank Transfer',
        'Mr. Rahman',
        '',
      ],
      [
        'BILL-20261013-100002',
        'INV-2026-002',
        'Safe Security',
        'Black Bank PLC',
        'Dhanmondi Branch',
        'Device relocation from Room 201 to Room 305',
        'Location Shift',
        8000,
        '2026-10-02',
        '2026-10-04',
        '',
        '',
        'Pending',
        'Cheque',
        '',
        '',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(14, h.length + 3) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Bills');
    XLSX.writeFile(wb, 'Bill_Tracker_SAMPLE.xlsx');
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="p-3 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-amber-500 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Bill Metrics Cards (Exact Dashboard Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Bills Card */}
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
          title="Click to view all bills"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Total Bills
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              All Records
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalBills}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Billing Report</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
              ৳{totalAmount.toLocaleString('en-IN')} (100% Volume)
            </span>
          </div>
        </div>

        {/* Paid Bills Card */}
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'Paid' ? 'ALL' : 'Paid'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-emerald-500/70 transition ${
            filterStatus === 'Paid'
              ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
              : 'border-emerald-200/80 dark:border-emerald-800/60'
          }`}
          title="Click to filter Paid bills"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Bill Paid
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              Cleared
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {paidBills.length}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Successfully completed</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              ৳{paidAmount.toLocaleString('en-IN')} ({totalBills > 0 ? Math.round((paidBills.length / totalBills) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Pending Bills Card */}
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'Pending' ? 'ALL' : 'Pending'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-amber-500/10 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-amber-500/70 transition ${
            filterStatus === 'Pending'
              ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20'
              : 'border-amber-200/80 dark:border-amber-800/60'
          }`}
          title="Click to filter Pending bills"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Bill Pending
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              In-Progress
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {pendingBills.length}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Active & in-progress</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
              ৳{pendingAmount.toLocaleString('en-IN')} ({totalBills > 0 ? Math.round((pendingBills.length / totalBills) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* 5 Secondary Stat Cards (Exact Dashboard Secondary Card Style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'Submitted' ? 'ALL' : 'Submitted'));
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-800/80 border p-3.5 rounded-lg shadow-xs hover:border-blue-500/50 transition cursor-pointer ${
            filterStatus === 'Submitted'
              ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
              : 'border-slate-200 dark:border-slate-700/60'
          }`}
          title="Click to filter Submitted bills"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-500" /> Submitted Bills
          </span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{submittedBills.length}</div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 mt-0.5 font-medium font-mono">
            ৳{submittedAmount.toLocaleString('en-IN')} submitted
          </span>
        </div>

        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'Partial' ? 'ALL' : 'Partial'));
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-800/80 border p-3.5 rounded-lg shadow-xs hover:border-cyan-500/50 transition cursor-pointer ${
            filterStatus === 'Partial'
              ? 'border-cyan-500 dark:border-cyan-500 ring-1 ring-cyan-500'
              : 'border-slate-200 dark:border-slate-700/60'
          }`}
          title="Click to filter Partial bills"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-cyan-500" /> Partial Paid
          </span>
          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{partialBills.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
            ৳{partialAmount.toLocaleString('en-IN')} collected
          </span>
        </div>

        <div
          onClick={() => {
            setFilterMonth((prev) => (prev === currentMonthStr ? 'ALL' : currentMonthStr));
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-800/80 border p-3.5 rounded-lg shadow-xs hover:border-purple-500/50 transition cursor-pointer ${
            filterMonth === currentMonthStr
              ? 'border-purple-500 dark:border-purple-500 ring-1 ring-purple-500'
              : 'border-slate-200 dark:border-slate-700/60'
          }`}
          title="Click to filter This Month bills"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-500" /> This Month
          </span>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{thisMonthBills.length}</div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5 mt-0.5 font-medium font-mono">
            ৳{thisMonthAmount.toLocaleString('en-IN')} volume
          </span>
        </div>

        <div
          onClick={() => {
            if (topCategoryInfo.category && topCategoryInfo.category !== '—') {
              setFilterType((prev) => (prev === topCategoryInfo.category ? 'ALL' : topCategoryInfo.category));
              setCurrentPage(1);
            }
          }}
          className={`bg-white dark:bg-slate-800/80 border p-3.5 rounded-lg shadow-xs hover:border-orange-500/50 transition cursor-pointer ${
            filterType === topCategoryInfo.category
              ? 'border-orange-500 dark:border-orange-500 ring-1 ring-orange-500'
              : 'border-slate-200 dark:border-slate-700/60'
          }`}
          title={`Click to filter by ${topCategoryInfo.category}`}
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-orange-500" /> Top Category
          </span>
          <div className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1 truncate" title={topCategoryInfo.category}>
            {topCategoryInfo.category}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {topCategoryInfo.count} bill{topCategoryInfo.count !== 1 ? 's' : ''} logged
          </span>
        </div>

        <div
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs hover:border-rose-500/50 transition"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-rose-500" /> Avg Bill Value
          </span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            ৳{avgBillAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Per bill average
          </span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Bill Category Distribution
          </h3>
          <div className="h-64">
            <Bar
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { color: chartTextColor, stepSize: 1 },
                    grid: { color: chartGridColor },
                  },
                  x: {
                    ticks: { color: chartTextColor, font: { size: 10 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Monthly Amount Trend (৳ BDT)
          </h3>
          <div className="h-64">
            <Line
              data={monthlyTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: chartTextColor,
                      callback: (v) => `৳${Number(v).toLocaleString()}`,
                    },
                    grid: { color: chartGridColor },
                  },
                  x: {
                    ticks: { color: chartTextColor, font: { size: 10 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table Card with Toolbar & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Bill Report & Register</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {filteredBills.length} record{filteredBills.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full billing registry, multi-format export, and payment workflow tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onNavigateToTracker}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Bill</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Export filtered records to MS Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Export Bill Register to PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={handleExportWord}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Export to MS Word (.doc)"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>

              <button
                onClick={handleDownloadSample}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Download Sample Excel Template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample</span>
              </button>

              {onLoadDemoBills && (
                <button
                  onClick={onLoadDemoBills}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Populate demo billing entries"
                >
                  <span>🧪 Demo</span>
                </button>
              )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Search Input */}
            <div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bill, vendor, client..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
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
                <option value="ALL">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Category / Bill Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={filterPaymentMethod}
                onChange={(e) => {
                  setFilterPaymentMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
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
                <th className="px-3 py-3 whitespace-nowrap">Bill Number</th>
                <th className="px-3 py-3 whitespace-nowrap">Invoice</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[180px]">Client & Location</th>
                <th className="px-3 py-3 whitespace-nowrap">Vendor</th>
                <th className="px-3 py-3 whitespace-nowrap">Category</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">Amount (৳ BDT)</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[180px]">Dates (H/O · Sub · Recv · Pay)</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-3 py-3 whitespace-nowrap">Method</th>
                <th className="px-3 py-3 text-center sticky right-0 z-10 bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 whitespace-nowrap">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    No bill entries found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b, index) => {
                  const isSelected = selectedIds.includes(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(b.id)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center font-mono text-slate-400 font-medium whitespace-nowrap">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Bill Number */}
                      <td className="px-3 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {b.billNumber}
                      </td>

                      {/* Invoice */}
                      <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {b.invoiceNumber || '—'}
                      </td>

                      {/* Client & Location */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {b.client}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{b.clientLocation}</span>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {b.vendor || '—'}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {b.billType}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        ৳{Number(b.amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Dates - Single Line whitespace-nowrap */}
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span title="Handover Date">
                            <span className="text-slate-400 font-sans text-[10px]">H:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200 font-mono font-semibold">
                              {b.handoverDate || '—'}
                            </strong>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span title="Submission Date">
                            <span className="text-slate-400 font-sans text-[10px]">S:</span>{' '}
                            <strong className="text-slate-700 dark:text-slate-300 font-mono font-medium">
                              {b.submissionDate || '—'}
                            </strong>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span title="Payment Date">
                            <span className="text-slate-400 font-sans text-[10px]">P:</span>{' '}
                            <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                              {b.paymentDate || '—'}
                            </strong>
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                            b.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : b.status === 'Submitted'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : b.status === 'Partial'
                              ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {b.status === 'Paid'
                            ? 'Paid'
                            : b.status === 'Submitted'
                            ? 'Submitted'
                            : b.status === 'Partial'
                            ? 'Partial'
                            : 'Pending'}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                        {b.paymentMethod || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingBill(b)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditBillInTracker(b)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded transition cursor-pointer"
                            title="Edit Bill in Tracker"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(b)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Bill"
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

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredBills.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, filteredBills.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredBills.length}
            </span>{' '}
            bills
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono font-bold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Bill Details Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  Bill Reference
                </span>
                <h3 className="text-base font-bold font-mono">{viewingBill.billNumber}</h3>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                    Total Amount
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                    ৳{Number(viewingBill.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                  {viewingBill.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Invoice Number</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.invoiceNumber || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Vendor</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.vendor || '—'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Client</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.client}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.clientLocation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {viewingBill.billType}
                  </p>
                </div>

                {viewingBill.description && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Description</span>
                    <p className="font-normal text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">
                      {viewingBill.description}
                    </p>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Handover Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.handoverDate || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Submission Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.submissionDate || '—'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Receive Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.receivedDate || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.paymentDate || '—'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Method</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.paymentMethod || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Approved By</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.approvedBy || '—'}
                  </p>
                </div>

                {viewingBill.remarks && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Remarks</span>
                    <p className="font-normal text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">
                      {viewingBill.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingBill(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {confirmConfig.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{confirmConfig.message}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
