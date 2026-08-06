import React, { useState, useMemo } from 'react';
import {
  ListChecks,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

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
          color: '#94a3b8',
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
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
          color: '#94a3b8',
          callback: (value: string | number) => `${value}%`,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
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
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
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
          <div className="kpi-icon-custom bg-indigo-500/20 text-indigo-400">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Issues</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{totalIssues}</h3>
          </div>
        </div>

        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Issues Solved</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{issuesSolved}</h3>
          </div>
        </div>

        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Issues</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{pendingIssues}</h3>
          </div>
        </div>

        <div className="kpi-card-custom">
          <div className="kpi-icon-custom bg-sky-500/20 text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Service Ratio</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{serviceRatio}</h3>
          </div>
        </div>
      </div>

      {/* 5 Secondary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Total Devices
          </span>
          <div className="text-xl font-bold text-white mt-1">{totalDevices}</div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
            {totalDevices} total
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Live Online
          </span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{liveOnline}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {uptimePercent}% Uptime
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Offline Devices
          </span>
          <div className="text-xl font-bold text-rose-400 mt-1">{offlineDevices}</div>
          <span className="text-[10px] text-rose-400 flex items-center gap-0.5 mt-0.5">
            <AlertTriangle className="w-3 h-3" /> Offline count
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Total SIMs
          </span>
          <div className="text-xl font-bold text-indigo-400 mt-1">{totalSimsCount}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            GP: {gpCount} | Robi: {robiCount}
          </span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Open Tickets
          </span>
          <div className="text-xl font-bold text-purple-400 mt-1">
            {pendingIssues}
          </div>
          <span className="text-[10px] text-amber-400 block mt-0.5">
            Active Pending
          </span>
        </div>
      </div>

      {/* Year Selection Banner & Charts */}
      <div className="space-y-3">
        <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-lg flex flex-wrap justify-between items-center gap-2 shadow">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Analytics Year Filter:
            </span>
            <span className="text-xs text-slate-400">
              Showing Jan – Dec ({selectedYear})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-300 font-bold uppercase text-[11px]">Select Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold px-3 py-1 rounded focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm text-xs"
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
          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-lg flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">
              Device Category Distribution
            </h3>
            <div className="h-48 relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-lg flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase">
                Monthly Solved Ratio Trend ({selectedYear})
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold">Jan – Dec</span>
            </div>
            <div className="h-48 relative">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-lg flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase">
                Monthly Service Tickets ({selectedYear})
              </h3>
              <span className="text-[10px] text-indigo-400 font-bold">Jan – Dec</span>
            </div>
            <div className="h-48 relative">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent High Priority Tickets Table */}
      <div className="bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            High Priority & Recent Service Tickets
          </h3>
          <button
            onClick={() => onSwitchTab('service')}
            className="text-xs text-indigo-400 hover:underline cursor-pointer font-medium"
          >
            View All Tickets &rarr;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-slate-500 font-sans">
                    No tickets available
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-indigo-400 font-bold">{t.id}</td>
                    <td className="p-2.5 font-sans">{t.locType}</td>
                    <td className="p-2.5">{t.deviceId}</td>
                    <td className="p-2.5 font-sans">{t.issueType}</td>
                    <td className="p-2.5">
                      {t.priority === 'CRITICAL' ? (
                        <span className="bg-rose-900/80 text-rose-200 border border-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          CRITICAL
                        </span>
                      ) : (
                        <span className="bg-amber-900/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.priority}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className="text-emerald-400 font-bold">
                        {t.slaStatus}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

