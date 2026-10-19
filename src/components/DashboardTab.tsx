import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  Wrench,
} from 'lucide-react';
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
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Ticket,
  Device,
  PurchaseOrder,
  SIMItem,
  TabType,
  IssueTrackerItem,
  DeviceSupportTicket,
  BillItem,
  ServiceTicketItem,
} from '../types';
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

interface DashboardTabProps {
  tickets: Ticket[];
  devices?: Device[];
  pos?: PurchaseOrder[];
  sims?: SIMItem[];
  issues?: IssueTrackerItem[];
  deviceSupportTickets?: DeviceSupportTicket[];
  bills?: BillItem[];
  serviceTickets?: ServiceTicketItem[];
  onSwitchTab: (tab: TabType) => void;
}

const parseTicketDate = (dateStr: string): { year: number; month: number } | null => {
  if (!dateStr || dateStr === 'Pending' || dateStr === '-') return null;

  // Pattern YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10) - 1,
    };
  }

  // Pattern DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmyMatch) {
    let yr = parseInt(dmyMatch[3], 10);
    if (yr < 100) yr += 2000;
    return {
      year: yr,
      month: parseInt(dmyMatch[2], 10) - 1,
    };
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  return null;
};

const getTicketDateInfo = (t: Ticket): { year: number; month: number } | null => {
  const parsed = parseTicketDate(t.reqDate);
  if (parsed && !isNaN(parsed.year) && parsed.year > 2000) return parsed;

  const provParsed = parseTicketDate(t.provDate);
  if (provParsed && !isNaN(provParsed.year) && provParsed.year > 2000) return provParsed;

  if (t.id && t.id.includes('INV-BBL-')) {
    const match = t.id.match(/INV-BBL-(\d{4})(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
      };
    }
  }

  return null;
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  tickets = [],
  devices = [],
  sims = [],
  issues = [],
  deviceSupportTickets = [],
  bills = [],
  serviceTickets = [],
  onSwitchTab,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Pagination state for High Priority & Recent Tickets
  const [ticketPage, setTicketPage] = useState<number>(1);
  const TICKETS_PER_PAGE = 10;

  const totalTicketPages = Math.ceil(tickets.length / TICKETS_PER_PAGE) || 1;

  const paginatedTickets = useMemo(() => {
    const start = (ticketPage - 1) * TICKETS_PER_PAGE;
    return tickets.slice(start, start + TICKETS_PER_PAGE);
  }, [tickets, ticketPage]);

  // Billing Metrics strictly from Billing Report
  const {
    totalBillCount,
    totalBillAmount,
    paidBillCount,
    paidBillAmount,
    pendingBillCount,
    pendingBillAmount,
  } = useMemo(() => {
    let totAmt = 0;
    let pCount = 0;
    let pAmt = 0;
    let pendCount = 0;
    let pendAmt = 0;

    bills.forEach((b) => {
      const amt = Number(b.amount) || 0;
      totAmt += amt;
      const st = (b.status || '').toLowerCase().trim();
      if (st === 'paid') {
        pCount += 1;
        pAmt += amt;
      } else if (st === 'pending') {
        pendCount += 1;
        pendAmt += amt;
      }
    });

    return {
      totalBillCount: bills.length,
      totalBillAmount: totAmt,
      paidBillCount: pCount,
      paidBillAmount: pAmt,
      pendingBillCount: pendCount,
      pendingBillAmount: pendAmt,
    };
  }, [bills]);

  // Total Issues, Issues Solved, Pending Issues (strictly from Device Issue Report)
  const { combinedTotalIssues, combinedSolvedIssues, combinedPendingIssues } = useMemo(() => {
    const total = deviceSupportTickets.length;
    let dstSolved = 0;
    deviceSupportTickets.forEach((dst) => {
      const st = (dst.ticketStatus || '').toLowerCase().trim();
      if (st === 'yes' || st === 'solved' || st === 'resolved' || st === 'done' || st === 'closed') {
        dstSolved += 1;
      }
    });

    const pending = Math.max(0, total - dstSolved);

    return {
      combinedTotalIssues: total,
      combinedSolvedIssues: dstSolved,
      combinedPendingIssues: pending,
    };
  }, [deviceSupportTickets]);

  // Collect available years from tickets and current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear, currentYear - 1, currentYear - 2]);
    tickets.forEach((t) => {
      const info = getTicketDateInfo(t);
      if (info && info.year >= 2020 && info.year <= 2035) {
        yearsSet.add(info.year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [tickets, currentYear]);

  // Aggregate monthly counts for all 12 months of selected year
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const monthlyTotalTickets = Array(12).fill(0);
  const monthlySolvedTickets = Array(12).fill(0);

  tickets.forEach((t) => {
    const info = getTicketDateInfo(t);
    if (info && info.year === selectedYear && info.month >= 0 && info.month < 12) {
      monthlyTotalTickets[info.month] += 1;
      if (t.status === 'SOLVED' || t.status === 'RESOLVED' || t.status === 'CLOSED') {
        monthlySolvedTickets[info.month] += 1;
      }
    }
  });

  const monthlySolvedRatios = monthlyTotalTickets.map((total, idx) => {
    if (total === 0) return 0;
    return Math.round((monthlySolvedTickets[idx] / total) * 100);
  });

  const totalIssues = tickets.length;
  const issuesSolved = tickets.filter(
    (t) => t.status === 'SOLVED' || t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;
  const pendingIssues = totalIssues - issuesSolved;
  const serviceRatio =
    totalIssues > 0 ? `${Math.round((issuesSolved / totalIssues) * 100)}%` : '0%';

  const totalDevices = devices.length;
  const liveOnline = devices.filter((d) => d.status === 'LIVE').length;
  const offlineDevices = devices.filter((d) => d.status === 'OFFLINE').length;
  const uptimePercent =
    totalDevices > 0 ? ((liveOnline / totalDevices) * 100).toFixed(1) : '0';

  // Strict Invariant: Total SIMs can NEVER exceed total devices
  const effectiveSims = useMemo(() => {
    if (devices.length > 0 && sims.length > devices.length) {
      return sims.slice(0, devices.length);
    }
    return sims;
  }, [sims, devices]);

  const totalSimsCount = Math.min(effectiveSims.length, totalDevices > 0 ? totalDevices : effectiveSims.length);
  const gpCount = effectiveSims.filter((s) => s.operator.toLowerCase().includes('gp') || s.operator.toLowerCase().includes('grameen')).length;
  const robiCount = effectiveSims.filter((s) => s.operator.toLowerCase().includes('robi')).length;

  // Category counts for Doughnut Chart
  const categoryCounts: Record<string, number> = {};
  devices.forEach((d) => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  });

  const categoryLabels = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts)
    : ['Main Branch', 'Sub Branch', 'Head Office', 'Data Centre', 'Infrastructure'];
  
  const categoryValues = Object.keys(categoryCounts).length > 0
    ? Object.values(categoryCounts)
    : [0, 0, 0, 0, 0];

  // Theme-aware Chart Styling Colors
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Chart 1: Doughnut Chart Data
  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
          font: { size: 10 },
        },
      },
    },
  };

  // Chart 2: Line Chart Data (12 Months Solved Ratio Trend)
  const lineData = {
    labels: monthNames,
    datasets: [
      {
        label: `Solved Ratio ${selectedYear} (%)`,
        data: monthlySolvedRatios,
        borderColor: '#10b981',
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: chartTextColor,
          callback: (value: string | number) => `${value}%`,
        },
        grid: { color: chartGridColor },
      },
      x: {
        ticks: { color: chartTextColor, font: { size: 10 } },
        grid: { color: chartGridColor },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Chart 3: Bar Chart Data (12 Months Service Tickets)
  const barData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Total Tickets',
        data: monthlyTotalTickets,
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
      {
        label: 'Solved Tickets',
        data: monthlySolvedTickets,
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: chartTextColor, font: { size: 10 } },
        grid: { color: chartGridColor },
      },
      y: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: chartTextColor,
          font: { size: 10 },
          boxWidth: 10,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Primary Issue Metrics Cards (From Device Issue Report) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Issues Card */}
        <div
          className="bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-900/20 border border-indigo-200/80 dark:border-indigo-800/60 p-4 rounded-xl shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Total Issue
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {combinedTotalIssues}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Device Issue Report</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">100% Volume</span>
          </div>
        </div>

        {/* Issues Solved Card */}
        <div
          className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/60 p-4 rounded-xl shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Issue Solved
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {combinedSolvedIssues}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Successfully completed</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {combinedTotalIssues > 0 ? `${Math.round((combinedSolvedIssues / combinedTotalIssues) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Pending Issues Card */}
        <div
          className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20 border border-amber-200/80 dark:border-amber-800/60 p-4 rounded-xl shadow-xs select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Issue Pending
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {combinedPendingIssues}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Active & in-progress</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {combinedTotalIssues > 0 ? `${Math.round((combinedPendingIssues / combinedTotalIssues) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* 7 Secondary Stat Cards (including Billing & Service Tickets) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div
          onClick={() => onSwitchTab('devices')}
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs cursor-pointer hover:border-emerald-500/50 transition"
          title="View all registered devices"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Total Devices
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalDevices}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
            {totalDevices} total registered
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Live Online
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{liveOnline}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {uptimePercent}% Uptime
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Offline Devices
          </span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{offlineDevices}</div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-0.5 mt-0.5 font-medium">
            <AlertTriangle className="w-3 h-3" /> Offline count
          </span>
        </div>
        <div
          onClick={() => onSwitchTab('sim')}
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs cursor-pointer hover:border-indigo-500/50 transition"
          title="View Cellular SIM Inventory & Discrepancy Reconciliation"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Total SIMs
            </span>
            {totalDevices !== totalSimsCount && (
              <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded" title="Count difference with Devices">
                Diff: {Math.abs(totalDevices - totalSimsCount)}
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalSimsCount}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            GP: {gpCount} | Robi: {robiCount}
          </span>
        </div>
        <div
          onClick={() => onSwitchTab('service_ticket_report')}
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs cursor-pointer hover:border-indigo-500/50 transition group"
          title="View Service Ticket Tracker & Report"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <Wrench className="w-3 h-3 text-indigo-500" /> Service Tickets
            </span>
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
              Live
            </span>
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {serviceTickets.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5 mt-0.5 font-medium truncate">
            {serviceTickets.filter((t) => t.status === 'Done').length} done | {serviceTickets.filter((t) => t.status !== 'Done').length} active
          </span>
        </div>
        <div
          onClick={() => onSwitchTab('service')}
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs cursor-pointer hover:border-purple-500/50 transition"
          title="View Service & Maintenance Tickets"
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Open Tickets
          </span>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {pendingIssues}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
            Active Pending
          </span>
        </div>
        <div
          onClick={() => onSwitchTab('bill_report')}
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs cursor-pointer hover:border-indigo-500/50 transition group"
          title="View Billing Management & Audit Report"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <Receipt className="w-3 h-3 text-indigo-500" /> Bill Report
            </span>
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
              BDT
            </span>
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {totalBillCount}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium truncate font-mono">
            ৳{paidBillAmount.toLocaleString('en-IN')} paid
          </span>
        </div>
      </div>

      {/* Primary Billing Metrics Cards (From Billing Report) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Billing Report & Financial Overview
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
              (Total BDT: ৳{totalBillAmount.toLocaleString('en-IN')})
            </span>
          </div>
          <button
            onClick={() => onSwitchTab('bill_report')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
          >
            <span>Open Billing Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Bills Card */}
          <div
            onClick={() => onSwitchTab('bill_report')}
            className="bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-900/20 border border-indigo-200/80 dark:border-indigo-800/60 p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-indigo-500/70 transition"
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
              {totalBillCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Billing Report</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                ৳{totalBillAmount.toLocaleString('en-IN')} (100% Volume)
              </span>
            </div>
          </div>

          {/* Paid Bills Card */}
          <div
            onClick={() => onSwitchTab('bill_report')}
            className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/60 p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-emerald-500/70 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Bills Paid
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                Cleared
              </span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {paidBillCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Successfully completed</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                ৳{paidBillAmount.toLocaleString('en-IN')} ({totalBillCount > 0 ? Math.round((paidBillCount / totalBillCount) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Pending Bills Card */}
          <div
            onClick={() => onSwitchTab('bill_report')}
            className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20 border border-amber-200/80 dark:border-amber-800/60 p-4 rounded-xl shadow-xs select-none cursor-pointer hover:border-amber-500/70 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Bills Pending
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                In-Progress
              </span>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
              {pendingBillCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Active & in-progress</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                ৳{pendingBillAmount.toLocaleString('en-IN')} ({totalBillCount > 0 ? Math.round((pendingBillCount / totalBillCount) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Year Selection Banner & Charts */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3 rounded-lg flex flex-wrap justify-between items-center gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Analytics Year Filter:
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing Jan – Dec ({selectedYear})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">Select Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 rounded focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs text-xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase mb-3">
              Device Category Distribution
            </h3>
            <div className="h-48 relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">
                Monthly Solved Ratio Trend ({selectedYear})
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Jan – Dec</span>
            </div>
            <div className="h-48 relative">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">
                Monthly Service Tickets ({selectedYear})
              </h3>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Jan – Dec</span>
            </div>
            <div className="h-48 relative">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent High Priority Tickets Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            High Priority & Recent Service Tickets
          </h3>
          <button
            onClick={() => onSwitchTab('service')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
          >
            View All Tickets &rarr;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5">Ticket ID</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Device ID</th>
                <th className="p-2.5">Issue Type</th>
                <th className="p-2.5">Priority</th>
                <th className="p-2.5">SLA Status</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-slate-500 font-sans">
                    No tickets available
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t, tIdx) => (
                  <tr key={`dash-ticket-${t.id}-${tIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-bold">{t.id}</td>
                    <td className="p-2.5 font-sans text-slate-800 dark:text-slate-300">{t.locType}</td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">{t.deviceId}</td>
                    <td className="p-2.5 font-sans text-slate-800 dark:text-slate-300">{t.issueType}</td>
                    <td className="p-2.5">
                      {t.priority === 'CRITICAL' ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/80 dark:text-rose-200 dark:border-rose-600 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                          CRITICAL
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                          {t.priority}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {t.slaStatus}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controls */}
        {tickets.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div>
              Showing <span className="font-bold text-slate-900 dark:text-slate-200">{(ticketPage - 1) * TICKETS_PER_PAGE + 1}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-slate-200">{Math.min(ticketPage * TICKETS_PER_PAGE, tickets.length)}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-slate-200">{tickets.length}</span> tickets
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={ticketPage <= 1}
                onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300 px-1">
                Page {ticketPage} of {totalTicketPages}
              </span>
              <button
                disabled={ticketPage >= totalTicketPages}
                onClick={() => setTicketPage((p) => Math.min(totalTicketPages, p + 1))}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition shadow-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
