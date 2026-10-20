import React, { useState, useMemo } from 'react';
import {
  Wrench,
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
  AlertTriangle,
  FileDown,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building,
  MapPin,
  Calendar,
  X,
  FileText,
  RotateCcw,
  Tag,
  Check,
  User,
  Phone,
  Flame,
  Target,
  BarChart2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { triggerDownload } from '../utils/excelExport';
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
import { ServiceTicketItem } from '../types';
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

interface ServiceTicketReportTabProps {
  tickets: ServiceTicketItem[];
  onSaveTicket: (ticket: ServiceTicketItem) => void;
  onDeleteTicket: (id: string) => void;
  onBulkDeleteTickets?: (ids: string[]) => void;
  onNavigateToTracker: () => void;
  onEditTicketInTracker: (ticket: ServiceTicketItem) => void;
}

export const ServiceTicketReportTab: React.FC<ServiceTicketReportTabProps> = ({
  tickets,
  onSaveTicket,
  onDeleteTicket,
  onBulkDeleteTickets,
  onNavigateToTracker,
  onEditTicketInTracker,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterSla, setFilterSla] = useState('ALL');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals state
  const [viewingTicket, setViewingTicket] = useState<ServiceTicketItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

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
  const totalTickets = tickets.length;
  const doneTickets = useMemo(
    () => tickets.filter((t) => (t.status || '').toLowerCase() === 'done'),
    [tickets]
  );
  const pendingTickets = useMemo(
    () =>
      tickets.filter((t) =>
        ['open', 'pending', 'ongoing', 'working', 'rma', 'repairing'].includes(
          (t.status || '').toLowerCase()
        )
      ),
    [tickets]
  );
  const breachedTickets = useMemo(
    () => tickets.filter((t) => t.slaStatus === 'Breached'),
    [tickets]
  );
  const withinSlaTickets = useMemo(
    () => tickets.filter((t) => t.slaStatus === 'Within SLA'),
    [tickets]
  );

  const donePercentage = totalTickets > 0 ? Math.round((doneTickets.length / totalTickets) * 100) : 0;
  const pendingPercentage =
    totalTickets > 0 ? Math.round((pendingTickets.length / totalTickets) * 100) : 0;

  // Monthly stats
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTickets = useMemo(
    () => tickets.filter((t) => (t.requestDate || '').startsWith(currentMonthStr)),
    [tickets, currentMonthStr]
  );

  // Available months
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    tickets.forEach((t) => {
      const m = (t.requestDate || '').substring(0, 7);
      if (m && m.length === 7) monthsSet.add(m);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [tickets]);

  // Average per month
  const avgPerMonth = useMemo(() => {
    const count = availableMonths.length || 1;
    return (totalTickets / count).toFixed(1);
  }, [totalTickets, availableMonths]);

  // Top Issue Type
  const topIssueInfo = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      (t.issues || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((iss) => {
          counts[iss] = (counts[iss] || 0) + 1;
        });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return { issue: sorted[0][0], count: sorted[0][1] };
    }
    return { issue: '—', count: 0 };
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (t.issueNumber || '').toLowerCase().includes(q) ||
          (t.odooId || '').toLowerCase().includes(q) ||
          (t.client || '').toLowerCase().includes(q) ||
          (t.contactPerson || '').toLowerCase().includes(q) ||
          (t.contactNumber || '').toLowerCase().includes(q) ||
          (t.district || '').toLowerCase().includes(q) ||
          (t.address || '').toLowerCase().includes(q) ||
          (t.deviceLocation || '').toLowerCase().includes(q) ||
          (t.locationType || '').toLowerCase().includes(q) ||
          (t.deviceId || '').toLowerCase().includes(q) ||
          (t.product || '').toLowerCase().includes(q) ||
          (t.issues || '').toLowerCase().includes(q) ||
          (t.assignPerson || '').toLowerCase().includes(q) ||
          (t.replaceDeviceId || '').toLowerCase().includes(q) ||
          (t.remarks || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (filterMonth !== 'ALL' && (!t.requestDate || !t.requestDate.startsWith(filterMonth))) {
        return false;
      }
      if (filterStatus !== 'ALL' && t.status !== filterStatus) {
        return false;
      }
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) {
        return false;
      }
      if (filterSla !== 'ALL' && t.slaStatus !== filterSla) {
        return false;
      }

      return true;
    });
  }, [tickets, searchQuery, filterMonth, filterStatus, filterPriority, filterSla]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Multi-select handlers
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
    paginatedTickets.length > 0 && paginatedTickets.every((t) => selectedIds.includes(t.id));

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
      title: `Delete Selected Tickets (${selectedIds.length})`,
      message: `Are you sure you want to permanently delete ${selectedIds.length} ticket record(s)? This action cannot be undone.`,
      onConfirm: () => {
        if (onBulkDeleteTickets) {
          onBulkDeleteTickets(selectedIds);
        } else {
          selectedIds.forEach((id) => onDeleteTicket(id));
        }
        setSelectedIds([]);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setToastMessage(`${selectedIds.length} ticket(s) deleted.`);
        setTimeout(() => setToastMessage(''), 4000);
      },
    });
  };

  // Single Delete
  const handleDeleteRow = (t: ServiceTicketItem) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Service Ticket',
      message: `Are you sure you want to delete ticket "${t.issueNumber}" (${t.deviceId} - ${t.client})? This action cannot be undone.`,
      onConfirm: () => {
        onDeleteTicket(t.id);
        setSelectedIds((prev) => prev.filter((id) => id !== t.id));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setToastMessage(`Ticket ${t.issueNumber} deleted.`);
        setTimeout(() => setToastMessage(''), 4000);
      },
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterMonth('ALL');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterSla('ALL');
    setCurrentPage(1);
  };

  // Chart configuration
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Chart 1: Issue Type Distribution
  const issueChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      (t.issues || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((iss) => {
          counts[iss] = (counts[iss] || 0) + 1;
        });
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = entries.map((e) => e[0]);
    const data = entries.map((e) => e[1]);
    return {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Tickets',
          data: data.length ? data : [0],
          backgroundColor: [
            '#6366f1',
            '#10b981',
            '#f59e0b',
            '#ec4899',
            '#3b82f6',
            '#8b5cf6',
            '#06b6d4',
            '#ef4444',
          ],
          borderRadius: 6,
        },
      ],
    };
  }, [tickets]);

  // Chart 2: Monthly Ticket Trend
  const monthlyChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const m = (t.requestDate || '').substring(0, 7);
      if (m && m.length === 7) counts[m] = (counts[m] || 0) + 1;
    });
    const sorted = Object.keys(counts).sort();
    const labels = sorted.map((m) => {
      const [y, mo] = m.split('-');
      return new Date(Number(y), Number(mo) - 1).toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    });
    const data = sorted.map((m) => counts[m]);

    return {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Tickets Logged',
          data: data.length ? data : [0],
          borderColor: '#6366f1',
          backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
        },
      ],
    };
  }, [tickets, isDark]);

  // Chart 3: Status Distribution
  const statusChartData = useMemo(() => {
    const statuses = ['Open', 'Pending', 'Ongoing', 'Working', 'RMA', 'Repairing', 'Done'];
    const counts = statuses.map(
      (st) => tickets.filter((t) => (t.status || '').toLowerCase() === st.toLowerCase()).length
    );
    return {
      labels: statuses,
      datasets: [
        {
          label: 'Tickets by Status',
          data: counts,
          backgroundColor: [
            '#94a3b8',
            '#fbbf24',
            '#3b82f6',
            '#a855f7',
            '#f97316',
            '#ec4899',
            '#10b981',
          ],
          borderRadius: 6,
        },
      ],
    };
  }, [tickets]);

  // Export Full Excel
  const handleExportExcel = () => {
    if (filteredTickets.length === 0) {
      setToastMessage('No tickets found to export.');
      return;
    }

    const headers = [
      'Issue Number',
      'Odoo ID',
      'Email From',
      'Email Subject',
      'Client',
      'Contact Person',
      'Contact Number',
      'District',
      'Address',
      'Device Location',
      'Location Type',
      'Device ID',
      'Product',
      'Product Price (BDT)',
      'Segment',
      'KAM',
      'Request Date',
      'Request Time',
      'Planned Date',
      'Service Date',
      'SLA Threshold (Days)',
      'Resolution Time (Days)',
      'SLA Status',
      'Issue Types',
      'Priority',
      'Status',
      'Replace',
      'Replace Device ID',
      'Assign Person',
      'Accessories',
      'Delivery Option',
      'Challan Received By',
      'Handed Over To',
      'Unit Qty',
      'Invoice Handover',
      'Payment Method',
      'Vendor Bill',
      'Remarks',
      'Visit Email Details',
      'Comments',
    ];

    const rows = filteredTickets.map((t) => [
      t.issueNumber,
      t.odooId,
      t.emailFrom || '-',
      t.emailSubject || '-',
      t.client,
      t.contactPerson,
      t.contactNumber,
      t.district,
      t.address,
      t.deviceLocation,
      t.locationType,
      t.deviceId,
      t.product,
      t.productPrice || '-',
      t.segment || '-',
      t.kam || '-',
      t.requestDate,
      t.requestTime,
      t.plannedDate,
      t.serviceDate || '-',
      t.slaThreshold,
      t.resolutionDays || '-',
      t.slaStatus,
      t.issues,
      t.priority,
      t.status,
      t.replace,
      t.replaceDeviceId || '-',
      t.assignPerson,
      t.accessories || '-',
      t.deliveryOption || '-',
      t.challanBy || '-',
      t.handedOverTo || '-',
      t.unitQty || 1,
      t.invoiceHandover || 'No',
      t.paymentMethod || 'Cash',
      t.vendorBill || '-',
      t.remarks || '-',
      t.visitEmail || '-',
      t.comments || '-',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(14, h.length + 3) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Service_Tickets');
    XLSX.writeFile(wb, `Service_Tickets_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
    setToastMessage('Excel report exported successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Export Landscape Register PDF
  const handleExportPDF = () => {
    if (filteredTickets.length === 0) {
      setToastMessage('No tickets found to export.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageW = 297;
    const margin = 12;

    // Header band
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 26, pageW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BLACK BANK PLC', margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text('Hardware Support & Service Ticket Operations · Head Office, Dhaka', margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('SERVICE TICKET REGISTER REPORT', pageW - margin, 10, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(200, 210, 230);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 15, { align: 'right' });
    doc.text(
      `Total: ${filteredTickets.length}  |  Done: ${
        filteredTickets.filter((t) => t.status === 'Done').length
      }  |  Breached: ${filteredTickets.filter((t) => t.slaStatus === 'Breached').length}`,
      pageW - margin,
      20,
      { align: 'right' }
    );

    const body = filteredTickets.map((t) => [
      t.issueNumber,
      t.odooId || '-',
      t.client,
      t.deviceLocation,
      t.deviceId,
      t.product,
      t.issues,
      t.requestDate,
      t.priority,
      t.slaStatus,
      t.status,
      t.assignPerson,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [
        [
          'Issue #',
          'Odoo ID',
          'Client',
          'Location',
          'Device ID',
          'Product',
          'Issue Type',
          'Request Date',
          'Priority',
          'SLA',
          'Status',
          'Assignee',
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
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { cellWidth: 20 },
        4: { fontStyle: 'bold' },
        9: { halign: 'center' },
        10: { halign: 'center', fontStyle: 'bold' },
      },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 200, pageW, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('Black Bank PLC · IT Operations & Maintenance Support Register', margin, 206);
      doc.text(
        `Page ${i} of ${pageCount}  |  Computer-generated official audit register`,
        pageW - margin,
        206,
        { align: 'right' }
      );
    }

    const pdfBlob = doc.output('blob');
    triggerDownload(pdfBlob, `Service_Ticket_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setToastMessage('PDF report (.pdf) exported successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Single Ticket PDF
  const downloadSingleTicketPDF = (t: ServiceTicketItem) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const margin = 14;
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 24, 'F');
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 24, pageW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BLACK BANK PLC — SERVICE TICKET', margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('Hardware Maintenance & On-Site Support Operations', margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`TICKET: ${t.issueNumber}`, pageW - margin, 12, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(`Odoo ID: ${t.odooId || '-'}  |  Date: ${t.requestDate}`, pageW - margin, 18, {
      align: 'right',
    });

    y = 33;
    doc.setTextColor(30, 41, 59);

    const renderSection = (title: string, pairs: [string, string | number | undefined][]) => {
      if (y > 250) {
        doc.addPage();
        y = 18;
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageW - 2 * margin, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229);
      doc.text(title.toUpperCase(), margin + 2.5, y + 4.5);
      y += 9;

      doc.setFontSize(8);
      pairs.forEach(([label, val]) => {
        if (y > 275) {
          doc.addPage();
          y = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(String(label) + ':', margin + 2.5, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const strVal = String(val || '—');
        const split = doc.splitTextToSize(strVal, pageW - margin - 60);
        doc.text(split, margin + 45, y);
        y += Math.max(4.5, split.length * 4);
      });
      y += 2.5;
    };

    renderSection('1 · Ticket Identity', [
      ['Issue Number', t.issueNumber],
      ['Odoo Ticket ID', t.odooId],
      ['Email From', t.emailFrom],
      ['Email Subject', t.emailSubject],
    ]);

    renderSection('2 · Client & Device Details', [
      ['Client Name', t.client],
      ['Contact Person', t.contactPerson],
      ['Contact Number', t.contactNumber],
      ['District', t.district],
      ['Address / Premises', t.address],
      ['Device Location', t.deviceLocation],
      ['Location Type', t.locationType],
      ['Device ID', t.deviceId],
      ['Product / Component', t.product + (t.productPrice ? ` (BDT ৳${t.productPrice})` : '')],
      ['Segment / KAM', `${t.segment || '-'} / ${t.kam || '-'}`],
    ]);

    renderSection('3 · Dates & SLA Performance', [
      ['Request Date & Time', `${t.requestDate} ${t.requestTime || ''}`],
      ['Planned Provide Date', t.plannedDate],
      ['Service Provide Date', t.serviceDate || 'Pending Delivery'],
      ['SLA Threshold', `${t.slaThreshold} Days`],
      ['Resolution Days', `${t.resolutionDays || 0} Days`],
      ['SLA Compliance', t.slaStatus],
    ]);

    renderSection('4 · Issue Specification', [
      ['Issue Type(s)', t.issues],
      ['Priority', t.priority],
      ['Ticket Status', t.status],
      ['Device Replaced?', t.replace],
      ['Replacement Device ID', t.replaceDeviceId || 'N/A'],
    ]);

    renderSection('5 · Operations & Logistics', [
      ['Technician / Assignee', t.assignPerson],
      ['Accessories Provided', t.accessories || 'None'],
      ['Delivery Mode', t.deliveryOption],
      ['Challan Received By', t.challanBy],
      ['Handed Over To', t.handedOverTo],
      ['Unit Quantity', t.unitQty || 1],
    ]);

    renderSection('6 · Billing & Commercials', [
      ['Invoice Handover', t.invoiceHandover],
      ['Payment Method', t.paymentMethod],
      ['Vendor Bill Reference', t.vendorBill || 'N/A'],
    ]);

    renderSection('7 · Notes & Remarks', [
      ['Remarks', t.remarks],
      ['Visit Email Details', t.visitEmail],
      ['Comments', t.comments],
    ]);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Black Bank PLC · Support Operations  |  Generated on ${new Date().toLocaleString()}`,
        margin,
        290
      );
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, 290, { align: 'right' });
    }

    const pdfBlob = doc.output('blob');
    triggerDownload(pdfBlob, `${t.issueNumber}.pdf`);
    setToastMessage(`Ticket ${t.issueNumber} PDF downloaded successfully!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Helper Badge Color
  const getStatusBadge = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'open':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'ongoing':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'working':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'rma':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      case 'repairing':
        return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch ((p || '').toLowerCase()) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'low':
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-indigo-500 hover:text-indigo-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP PRIMARY KPI CARDS (Dashboard Gradient Luxury Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets Card */}
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
          title="Click to view all service tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Total Tickets
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              100% Volume
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalTickets}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Service Ticket Registry</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {availableMonths.length} Active Month(s)
            </span>
          </div>
        </div>

        {/* Done / Closed Card */}
        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'Done' ? 'ALL' : 'Done'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-emerald-500/70 transition ${
            filterStatus === 'Done'
              ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
              : 'border-emerald-200/80 dark:border-emerald-800/60'
          }`}
          title="Click to filter Done tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Done / Closed
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              Completed
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {doneTickets.length}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Resolution Rate</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {donePercentage}% completion
            </span>
          </div>
        </div>

        {/* Pending / In-Progress Card */}
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
          title="Click to filter Pending / Active tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Pending / Open
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              Active
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {pendingTickets.length}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Outstanding Volume</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {pendingPercentage}% active queue
            </span>
          </div>
        </div>

        {/* SLA Compliance Card */}
        <div
          onClick={() => {
            setFilterSla((prev) => (prev === 'Breached' ? 'ALL' : 'Breached'));
            setCurrentPage(1);
          }}
          className={`bg-gradient-to-br from-rose-500/10 via-white to-rose-50/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-900/20 border p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-rose-500/70 transition ${
            filterSla === 'Breached'
              ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
              : 'border-rose-200/80 dark:border-rose-800/60'
          }`}
          title="Click to filter SLA Breached tickets"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              SLA Breached
            </span>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800/60">
              {withinSlaTickets.length} Within SLA
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {breachedTickets.length}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-100 dark:border-rose-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>SLA Health</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {totalTickets > 0
                ? `${Math.round((withinSlaTickets.length / totalTickets) * 100)}% on-time`
                : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 SECONDARY STAT CARDS (Dashboard secondary card row style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setFilterMonth((prev) => (prev === currentMonthStr ? 'ALL' : currentMonthStr));
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-800/80 border p-3.5 rounded-lg shadow-xs hover:border-blue-500/50 transition cursor-pointer ${
            filterMonth === currentMonthStr
              ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
              : 'border-slate-200 dark:border-slate-700/60'
          }`}
          title="Click to filter This Month tickets"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-500" /> This Month
          </span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {thisMonthTickets.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
            {now.toLocaleString('en-US', { month: 'short', year: 'numeric' })} logged
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-purple-500" /> Avg / Month
          </span>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {avgPerMonth}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Ticket volume per active month
          </span>
        </div>

        <div
          onClick={() => {
            setFilterSla((prev) => (prev === 'Within SLA' ? 'ALL' : 'Within SLA'));
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-800/80 border p-3.5 rounded-lg shadow-xs hover:border-teal-500/50 transition cursor-pointer ${
            filterSla === 'Within SLA'
              ? 'border-teal-500 dark:border-teal-500 ring-1 ring-teal-500'
              : 'border-slate-200 dark:border-slate-700/60'
          }`}
          title="Click to filter Within SLA tickets"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Target className="w-3 h-3 text-teal-500" /> Within SLA
          </span>
          <div className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {withinSlaTickets.length}
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-0.5 mt-0.5 font-medium">
            Resolved within threshold
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" /> Top Issue Type
          </span>
          <div
            className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1 truncate"
            title={topIssueInfo.issue}
          >
            {topIssueInfo.issue}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {topIssueInfo.count} logged ticket{topIssueInfo.count !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-500" /> Replacement Rate
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {tickets.filter((t) => t.replace === 'Yes').length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            New devices replaced
          </span>
        </div>
      </div>

      {/* ANALYTICS CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Issue Type Distribution</span>
          </h3>
          <div className="h-56">
            <Bar
              data={issueChartData}
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
                    ticks: { color: chartTextColor, font: { size: 9 }, maxRotation: 30 },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>Monthly Ticket Trend</span>
          </h3>
          <div className="h-56">
            <Line
              data={monthlyChartData}
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
                    ticks: { color: chartTextColor, font: { size: 9 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-500" />
            <span>Status Breakdown</span>
          </h3>
          <div className="h-56">
            <Bar
              data={statusChartData}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: { color: chartTextColor, stepSize: 1 },
                    grid: { color: chartGridColor },
                  },
                  y: {
                    ticks: { color: chartTextColor, font: { size: 10 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* MAIN DATA REGISTER TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Service Ticket Register</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {filteredTickets.length} record{filteredTickets.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comprehensive hardware issue log, SLA tracking, Excel/PDF multi-format export, and ticket dispatch register.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onNavigateToTracker}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ticket</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Export filtered records to MS Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Download formatted Register PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Export PDF</span>
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ticket #, Odoo, client, location, device..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Working">Working</option>
                <option value="RMA">RMA</option>
                <option value="Repairing">Repairing</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <select
                value={filterSla}
                onChange={(e) => {
                  setFilterSla(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All SLA Statuses</option>
                <option value="Within SLA">Within SLA</option>
                <option value="Breached">Breached</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Issue Number</th>
                <th className="p-3">Odoo ID</th>
                <th className="p-3">Client & Location</th>
                <th className="p-3">Device ID</th>
                <th className="p-3">Product Component</th>
                <th className="p-3">Issue Type(s)</th>
                <th className="p-3">Request Date</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-center">SLA</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Assignee</th>
                <th className="p-3 text-center w-28">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-medium text-xs">No service ticket records match your filter.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-xs cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t) => {
                  const isSelected = selectedIds.includes(t.id);
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(t.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {t.issueNumber}
                      </td>

                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {t.odooId || '—'}
                      </td>

                      <td className="p-3 max-w-[180px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {t.client}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {t.deviceLocation} ({t.locationType})
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {t.deviceId}
                      </td>

                      <td className="p-3 max-w-[160px]">
                        <div className="truncate font-medium text-slate-800 dark:text-slate-200" title={t.product}>
                          {t.product}
                        </div>
                        {t.productPrice && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                            ৳{t.productPrice}
                          </div>
                        )}
                      </td>

                      <td className="p-3 max-w-[160px]">
                        <div className="truncate font-semibold text-slate-700 dark:text-slate-300" title={t.issues}>
                          {t.issues}
                        </div>
                        {t.replace === 'Yes' && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Replaced: {t.replaceDeviceId}
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {t.requestDate}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.slaStatus === 'Within SLA'
                              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                              : t.slaStatus === 'Breached'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {t.slaStatus}
                        </span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {t.assignPerson}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingTicket(t)}
                            title="View Full Ticket Details"
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTicketInTracker(t)}
                            title="Edit Ticket in Tracker"
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadSingleTicketPDF(t)}
                            title="Download PDF Sheet"
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(t)}
                            title="Delete Ticket"
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
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

        {/* Pagination Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredTickets.length}
            </span>{' '}
            tickets
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {confirmConfig.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {confirmConfig.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ticket Overview — {viewingTicket.issueNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewingTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  1 · Ticket Identity
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Issue #:</span> {viewingTicket.issueNumber}
                  </div>
                  <div>
                    <span className="text-slate-400">Odoo ID:</span> {viewingTicket.odooId}
                  </div>
                  <div>
                    <span className="text-slate-400">Email From:</span>{' '}
                    {viewingTicket.emailFrom || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Subject:</span>{' '}
                    {viewingTicket.emailSubject || '—'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  2 · Client & Device Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Client:</span> {viewingTicket.client}
                  </div>
                  <div>
                    <span className="text-slate-400">Contact:</span> {viewingTicket.contactPerson} (
                    {viewingTicket.contactNumber})
                  </div>
                  <div>
                    <span className="text-slate-400">District / Premises:</span>{' '}
                    {viewingTicket.district} · {viewingTicket.address}
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span> {viewingTicket.deviceLocation}{' '}
                    ({viewingTicket.locationType})
                  </div>
                  <div>
                    <span className="text-slate-400">Device ID:</span> {viewingTicket.deviceId}
                  </div>
                  <div>
                    <span className="text-slate-400">Product:</span> {viewingTicket.product} (৳
                    {viewingTicket.productPrice || '0'})
                  </div>
                  <div>
                    <span className="text-slate-400">Segment / KAM:</span>{' '}
                    {viewingTicket.segment || '—'} / {viewingTicket.kam || '—'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  3 · Dates & SLA
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Request:</span> {viewingTicket.requestDate}{' '}
                    {viewingTicket.requestTime}
                  </div>
                  <div>
                    <span className="text-slate-400">Planned Date:</span>{' '}
                    {viewingTicket.plannedDate}
                  </div>
                  <div>
                    <span className="text-slate-400">Service Date:</span>{' '}
                    {viewingTicket.serviceDate || 'Pending Delivery'}
                  </div>
                  <div>
                    <span className="text-slate-400">SLA Status:</span>{' '}
                    <span
                      className={`font-bold ${
                        viewingTicket.slaStatus === 'Within SLA'
                          ? 'text-emerald-600'
                          : viewingTicket.slaStatus === 'Breached'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {viewingTicket.slaStatus} ({viewingTicket.resolutionDays}d /{' '}
                      {viewingTicket.slaThreshold}d threshold)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  4 · Issue & Replacement
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div className="col-span-2">
                    <span className="text-slate-400">Issues:</span> {viewingTicket.issues}
                  </div>
                  <div>
                    <span className="text-slate-400">Priority:</span> {viewingTicket.priority}
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span> {viewingTicket.status}
                  </div>
                  <div>
                    <span className="text-slate-400">Replace:</span> {viewingTicket.replace}
                  </div>
                  <div>
                    <span className="text-slate-400">Replace Device ID:</span>{' '}
                    {viewingTicket.replaceDeviceId || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  5 · Operations & Billing
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Technician:</span> {viewingTicket.assignPerson}
                  </div>
                  <div>
                    <span className="text-slate-400">Delivery:</span> {viewingTicket.deliveryOption}
                  </div>
                  <div>
                    <span className="text-slate-400">Accessories:</span>{' '}
                    {viewingTicket.accessories || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Challan / Handover:</span>{' '}
                    {viewingTicket.challanBy || '—'} / {viewingTicket.handedOverTo || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Payment:</span> {viewingTicket.paymentMethod}{' '}
                    (Invoice: {viewingTicket.invoiceHandover})
                  </div>
                  <div>
                    <span className="text-slate-400">Vendor Bill:</span>{' '}
                    {viewingTicket.vendorBill || '—'}
                  </div>
                </div>
              </div>

              {(viewingTicket.remarks || viewingTicket.visitEmail || viewingTicket.comments) && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                    6 · Notes
                  </h4>
                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    {viewingTicket.remarks && (
                      <div>
                        <span className="text-slate-400">Remarks:</span> {viewingTicket.remarks}
                      </div>
                    )}
                    {viewingTicket.visitEmail && (
                      <div>
                        <span className="text-slate-400">Visit Email:</span>{' '}
                        {viewingTicket.visitEmail}
                      </div>
                    )}
                    {viewingTicket.comments && (
                      <div>
                        <span className="text-slate-400">Comments:</span> {viewingTicket.comments}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingTicket(null);
                  onEditTicketInTracker(viewingTicket);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSingleTicketPDF(viewingTicket)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
