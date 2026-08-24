import React, { useState, useMemo } from 'react';
import {
  ListChecks,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
import { Ticket, Device, PurchaseOrder, SIMItem, TabType } from '../types';
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

  const totalSimsCount = sims.length;
  const gpCount = sims.filter((s) => s.operator.toLowerCase().includes('gp') || s.operator.toLowerCase().includes('grameen')).length;
  const robiCount = sims.filter((s) => s.operator.toLowerCase().includes('robi')).length;

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
      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Issues</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalIssues}</h3>
          </div>
        </div>

        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Issues Solved</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{issuesSolved}</h3>
          </div>
        </div>

        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Issues</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{pendingIssues}</h3>
          </div>
        </div>

        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Service Ratio</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{serviceRatio}</h3>
          </div>
        </div>
      </div>

      {/* 5 Secondary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Total Devices
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalDevices}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
            {totalDevices} total
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
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Total SIMs
          </span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalSimsCount}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            GP: {gpCount} | Robi: {robiCount}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-lg shadow-xs">
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
                paginatedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
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
