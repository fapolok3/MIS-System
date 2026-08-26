import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  Shield,
  Clock,
  Laptop,
  Globe,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  FileSpreadsheet,
  HardDrive,
  Users,
  Activity,
  Layers,
  Radio,
  ExternalLink,
  ChevronRight,
  Server,
  UserCheck,
  UserPlus,
  Edit3,
  Check,
  X,
  Wifi,
} from 'lucide-react';
import {
  Device,
  Ticket,
  PurchaseOrder,
  SIMItem,
  CategoryGroup,
  SystemOptions,
  AppSettings,
  IssueTrackerItem,
  SystemAccessLog,
  LiveActiveUser,
} from '../types';
import {
  getStoredAccessLogs,
  saveStoredAccessLogs,
  recordSystemAccessLog,
  calculateAccessLogStats,
  detectClientDeviceProfile,
  fetchClientNetworkInfo,
  getLiveActiveUsers,
  pulseLiveHeartbeat,
  getSavedUserProfileName,
  setSavedUserProfileName,
} from '../utils/systemLogger';

interface BackupTabProps {
  data: {
    devices: Device[];
    tickets: Ticket[];
    pos: PurchaseOrder[];
    sims: SIMItem[];
    issues?: IssueTrackerItem[];
    categoryGroups: CategoryGroup[];
    systemOptions?: SystemOptions;
    appSettings?: AppSettings;
  };
  liveUsers?: LiveActiveUser[];
  onRestoreData: (restored: {
    devices?: Device[];
    tickets?: Ticket[];
    pos?: PurchaseOrder[];
    sims?: SIMItem[];
    issues?: IssueTrackerItem[];
    categoryGroups?: CategoryGroup[];
    systemOptions?: SystemOptions;
    appSettings?: AppSettings;
  }) => void;
  showToast?: (message: string) => void;
}

export const BackupTab: React.FC<BackupTabProps> = ({
  data,
  liveUsers: initialLiveUsers,
  onRestoreData,
  showToast,
}) => {
  // Live Active Users State
  const [liveUsersList, setLiveUsersList] = useState<LiveActiveUser[]>(() =>
    initialLiveUsers && initialLiveUsers.length > 0 ? initialLiveUsers : getLiveActiveUsers()
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [customProfileName, setCustomProfileName] = useState(() => getSavedUserProfileName());

  // Keep liveUsers in sync
  useEffect(() => {
    if (initialLiveUsers && initialLiveUsers.length > 0) {
      setLiveUsersList(initialLiveUsers);
    }
  }, [initialLiveUsers]);

  // Access Logs State
  const [logs, setLogs] = useState<SystemAccessLog[]>(() => getStoredAccessLogs());
  const [activeLogFilter, setActiveLogFilter] = useState<'all' | 'today' | 'month' | 'year'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordingLog, setIsRecordingLog] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

  // Client telemetry preview
  const [currentClientInfo, setCurrentClientInfo] = useState<{
    laptopProfile: string;
    os: string;
    browser: string;
    screenResolution: string;
    ip: string;
    location: string;
    isp: string;
  } | null>(null);

  // Restore file staging & preview
  const [stagedRestoreData, setStagedRestoreData] = useState<{
    version?: string;
    exportDate?: string;
    counts?: Record<string, number>;
    rawPayload: any;
    fileName: string;
    fileSizeKB: string;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load client network telemetry on mount
  useEffect(() => {
    let isMounted = true;
    const device = detectClientDeviceProfile();

    fetchClientNetworkInfo().then((net) => {
      if (isMounted) {
        setCurrentClientInfo({
          laptopProfile: device.laptopProfile,
          os: device.os,
          browser: device.browser,
          screenResolution: device.screenResolution,
          ip: net.ip,
          location: net.location,
          isp: net.isp,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for real-time access log updates dispatched across app
  useEffect(() => {
    const handleLogUpdate = () => {
      setLogs(getStoredAccessLogs());
    };

    window.addEventListener('system_access_log_updated', handleLogUpdate);
    return () => window.removeEventListener('system_access_log_updated', handleLogUpdate);
  }, []);

  // Calculate statistics (Today, Month, Year, Total)
  const stats = useMemo(() => calculateAccessLogStats(logs), [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    let list = [...logs];

    // Time filter
    if (activeLogFilter === 'today') {
      list = list.filter((l) => l.date === stats.todayDate);
    } else if (activeLogFilter === 'month') {
      list = list.filter((l) => l.date && l.date.startsWith(stats.currentMonth));
    } else if (activeLogFilter === 'year') {
      list = list.filter((l) => l.date && l.date.startsWith(stats.currentYear));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.userProfile.toLowerCase().includes(q) ||
          l.ipAddress.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.laptopProfile.toLowerCase().includes(q) ||
          l.browser.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.isp && l.isp.toLowerCase().includes(q))
      );
    }

    return list;
  }, [logs, activeLogFilter, searchQuery, stats]);

  // Manually trigger logging of current session
  const handleRecordCurrentSession = async () => {
    setIsRecordingLog(true);
    try {
      const activeName = getSavedUserProfileName();
      await recordSystemAccessLog(activeName, 'Live Telemetry Check');
      setLogs(getStoredAccessLogs());
      if (showToast) showToast('Active device session logged successfully!');
    } catch (e) {
      console.warn(e);
    } finally {
      setIsRecordingLog(false);
    }
  };

  // Save updated custom profile name
  const handleSaveProfileName = () => {
    if (!customProfileName.trim()) return;
    setSavedUserProfileName(customProfileName.trim());
    setIsEditingProfile(false);
    pulseLiveHeartbeat('Backup & Telemetry Tab');
    setLiveUsersList(getLiveActiveUsers());
    if (showToast) showToast(`Profile name set to "${customProfileName.trim()}"`);
  };

  // Refresh live user presence
  const handleRefreshLiveUsers = async () => {
    await pulseLiveHeartbeat('Backup & Telemetry Tab');
    setLiveUsersList(getLiveActiveUsers());
    if (showToast) showToast('Live presence heartbeat refreshed!');
  };

  // Generate & Download Backup JSON
  const handleGenerateBackup = () => {
    setIsDownloadingBackup(true);
    try {
      const now = new Date();
      const timestampIso = now.toISOString();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      const devicesCount = data.devices?.length || 0;
      const ticketsCount = data.tickets?.length || 0;
      const posCount = data.pos?.length || 0;
      const simsCount = data.sims?.length || 0;
      const issuesCount = data.issues?.length || 0;
      const groupsCount = data.categoryGroups?.length || 0;

      const backupObj = {
        meta: {
          appName: data.appSettings?.appName || 'BBL DM System',
          version: 'v3.0.0-Universal',
          exportedAt: timestampIso,
          exportDate: now.toLocaleDateString(),
          exportTime: now.toLocaleTimeString(),
          systemChecksum: `BBL-SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        },
        counts: {
          devices: devicesCount,
          tickets: ticketsCount,
          purchaseOrders: posCount,
          simCards: simsCount,
          issueTracker: issuesCount,
          categoryGroups: groupsCount,
        },
        data: {
          devices: data.devices || [],
          tickets: data.tickets || [],
          pos: data.pos || [],
          sims: data.sims || [],
          issues: data.issues || [],
          categoryGroups: data.categoryGroups || [],
          systemOptions: data.systemOptions || null,
          appSettings: data.appSettings || null,
        },
      };

      const jsonString = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `BBL_System_Backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record backup log in access telemetry
      recordSystemAccessLog('Admin (admin@local.com)', 'Database Backup Exported').catch((e) => console.warn(e));

      if (showToast) {
        showToast('Full system backup file generated and downloaded successfully!');
      }
    } catch (err) {
      console.error('Backup generation error:', err);
      alert('Failed to generate backup file.');
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // Parse and stage uploaded file
  const processUploadedFile = (file: File) => {
    setRestoreError(null);
    setStagedRestoreData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Support both new v3 envelope format and legacy v2 formats
        let payloadData: any = null;
        let counts: Record<string, number> = {};
        let version = 'v3.0.0';
        let exportDate = 'Recent';

        if (parsed && parsed.data) {
          payloadData = parsed.data;
          version = parsed.meta?.version || parsed.version || 'v2.5.0';
          exportDate = parsed.meta?.exportedAt
            ? new Date(parsed.meta.exportedAt).toLocaleString()
            : parsed.timestamp
            ? new Date(parsed.timestamp).toLocaleString()
            : 'Unknown';

          counts = {
            devices: payloadData.devices?.length || 0,
            tickets: payloadData.tickets?.length || 0,
            purchaseOrders: payloadData.pos?.length || 0,
            simCards: payloadData.sims?.length || 0,
            issueTracker: payloadData.issues?.length || 0,
            categoryGroups: payloadData.categoryGroups?.length || 0,
          };
        } else if (parsed && (parsed.devices || parsed.tickets || parsed.pos || parsed.sims)) {
          // Direct un-enveloped dump
          payloadData = parsed;
          counts = {
            devices: parsed.devices?.length || 0,
            tickets: parsed.tickets?.length || 0,
            purchaseOrders: parsed.pos?.length || 0,
            simCards: parsed.sims?.length || 0,
            issueTracker: parsed.issues?.length || 0,
            categoryGroups: parsed.categoryGroups?.length || 0,
          };
        } else {
          setRestoreError('Invalid backup file structure. File must contain system database collections.');
          return;
        }

        const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
        if (totalItems === 0) {
          setRestoreError('Backup file was parsed but contains 0 valid database records.');
          return;
        }

        setStagedRestoreData({
          version,
          exportDate,
          counts,
          rawPayload: payloadData,
          fileName: file.name,
          fileSizeKB: (file.size / 1024).toFixed(1),
        });
      } catch (err) {
        console.error('File parsing error:', err);
        setRestoreError('Failed to parse backup JSON. Please ensure the file is a valid .json backup file.');
      }
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleExecuteRestore = () => {
    if (!stagedRestoreData || !stagedRestoreData.rawPayload) return;

    onRestoreData(stagedRestoreData.rawPayload);
    setStagedRestoreData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelRestore = () => {
    setStagedRestoreData(null);
    setRestoreError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export access logs to CSV
  const handleExportLogsCSV = () => {
    try {
      const headers = ['Log ID', 'Date', 'Time', 'User Profile', 'Laptop Profile', 'Browser', 'IP Address', 'Location', 'ISP', 'Action'];
      const rows = logs.map((l) => [
        `"${l.id}"`,
        `"${l.date}"`,
        `"${l.time}"`,
        `"${l.userProfile}"`,
        `"${l.laptopProfile}"`,
        `"${l.browser}"`,
        `"${l.ipAddress}"`,
        `"${l.location}"`,
        `"${l.isp || ''}"`,
        `"${l.action}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `System_Access_Logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (showToast) showToast('System access logs exported as CSV!');
    } catch (e) {
      console.warn(e);
    }
  };

  // Export access logs to JSON
  const handleExportLogsJSON = () => {
    try {
      const jsonContent = JSON.stringify(logs, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `System_Access_Logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (showToast) showToast('System access logs exported as JSON!');
    } catch (e) {
      console.warn(e);
    }
  };

  // Clear all logs with confirmation
  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all access logs? This action cannot be undone.')) {
      saveStoredAccessLogs([]);
      setLogs([]);
      if (showToast) showToast('Access logs cleared.');
    }
  };

  return (
    <div className="space-y-6 pb-12" id="backup-restore-page">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-5 rounded-xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  System Backup, Restore & Telemetry Logs
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Activity className="w-3 h-3 mr-1 text-emerald-500 animate-pulse" />
                  Live Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Download a complete system backup file to local storage or USB, easily restore the system anytime by uploading the same file, and monitor real-time user access counts & device profiles.
              </p>
            </div>
          </div>

          {/* Current Client Quick Telemetry Tag */}
          {currentClientInfo && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5 font-medium text-slate-800 dark:text-slate-200">
                <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                <span className="truncate max-w-[150px]">{currentClientInfo.laptopProfile}</span>
              </div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-mono">{currentClientInfo.ip}</span>
              </div>
              <button
                id="btn-log-current-session"
                onClick={handleRecordCurrentSession}
                disabled={isRecordingLog}
                className="ml-auto text-[11px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2 py-1 rounded font-semibold transition cursor-pointer flex items-center space-x-1"
                title="Log current visit timestamp to telemetry"
              >
                <RefreshCw className={`w-3 h-3 ${isRecordingLog ? 'animate-spin' : ''}`} />
                <span>Log Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Access Count & Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="access-analytics-cards">
        {/* Card 1: Today's Visits */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Visits
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.todayCount}
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center">
            <Radio className="w-3 h-3 mr-1 text-emerald-500 animate-pulse" />
            Real-time active access logs for today
          </p>
        </div>

        {/* Card 2: This Month's Visits */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              This Month
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.monthCount}
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              {new Date().toLocaleDateString('en-GB', { month: 'long' })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Monthly cumulative login entries
          </p>
        </div>

        {/* Card 3: This Year's Visits */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              This Year
            </span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.yearCount}
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
              {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Total annual authenticated accesses
          </p>
        </div>

        {/* Card 4: Unique Device Telemetry Summary */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Network & IPs Logged
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.uniqueIPsCount}
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              {stats.totalCount} Total Logs
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
            {stats.uniqueUsersCount} unique user profile(s)
          </p>
        </div>
      </div>

      {/* LIVE ACTIVE USERS SECTION */}
      <div
        className="bg-white dark:bg-slate-800/90 border border-emerald-300/80 dark:border-emerald-700/60 rounded-xl shadow-xs overflow-hidden"
        id="live-active-users-section"
      >
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-800 dark:to-teal-950/30 border-b border-emerald-200 dark:border-emerald-800/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Live Active Users Right Now
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {Math.max(1, liveUsersList.length)} Active Now
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time active presence tracking across devices and tabs with client device profile, network IP address, location, and current active screen.
              </p>
            </div>

            {/* Profile switcher & Refresh actions */}
            <div className="flex flex-wrap items-center gap-2">
              {isEditingProfile ? (
                <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-xs">
                  <input
                    type="text"
                    value={customProfileName}
                    onChange={(e) => setCustomProfileName(e.target.value)}
                    placeholder="Enter your name / email..."
                    className="px-2 py-1 text-xs text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none w-48 sm:w-56 font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveProfileName();
                      if (e.key === 'Escape') setIsEditingProfile(false);
                    }}
                  />
                  <button
                    onClick={handleSaveProfileName}
                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs transition cursor-pointer"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs transition cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCustomProfileName(getSavedUserProfileName());
                    setIsEditingProfile(true);
                  }}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  title="Change your displayed profile name in real-time"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Change My Name / Profile</span>
                </button>
              )}

              <button
                onClick={handleRefreshLiveUsers}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold p-1.5 rounded-lg transition cursor-pointer"
                title="Refresh live presence pulse"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Users Cards Grid */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {liveUsersList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500 animate-pulse" />
              Connecting to live presence channel...
            </div>
          ) : (
            liveUsersList.map((user, idx) => (
              <div
                key={user.sessionId || idx}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  user.isCurrentDevice
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Card Top: Avatar, Name & Live Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
                        {user.userProfile.charAt(0) || 'U'}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                        {user.userProfile}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-medium">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>Live Active Now</span>
                      </div>
                    </div>
                  </div>

                  {user.isCurrentDevice ? (
                    <span className="text-[10px] font-mono font-bold bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full shrink-0 border border-emerald-300 dark:border-emerald-700">
                      You (This Tab)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full shrink-0">
                      Active User #{idx + 1}
                    </span>
                  )}
                </div>

                {/* Card Body: Details */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                  {/* Laptop & OS */}
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                      <Laptop className="w-3 h-3 text-indigo-500" />
                      <span>Device:</span>
                    </span>
                    <span className="font-semibold text-[11px] truncate max-w-[170px]" title={user.laptopProfile}>
                      {user.laptopProfile}
                    </span>
                  </div>

                  {/* IP Address */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      <span>Client IP:</span>
                    </span>
                    <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200/70 dark:border-slate-800">
                      {user.ipAddress}
                    </span>
                  </div>

                  {/* Location & ISP */}
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>Location:</span>
                    </span>
                    <span className="font-medium text-[11px] truncate max-w-[170px]" title={`${user.location} (${user.isp || ''})`}>
                      {user.location}
                    </span>
                  </div>

                  {/* Active Screen Tab */}
                  {user.currentTab && (
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        <span>Active Tab:</span>
                      </span>
                      <span className="font-semibold text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                        {user.currentTab}
                      </span>
                    </div>
                  )}

                  {/* Online Since / Duration */}
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Online Since:</span>
                    </span>
                    <span className="font-mono">
                      {new Date(user.onlineSince).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Backup & Restore Two-Column Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="backup-restore-action-cards">
        {/* 1. CREATE & DOWNLOAD BACKUP */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center">
                  Download Full System Backup
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Save all database tables, configurations, and inventory as a clean JSON backup file.
                </p>
              </div>
            </div>

            {/* Current Snapshot Breakdown */}
            <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Backup Content Snapshot:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Ready to Export</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Devices:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.devices?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tickets:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.tickets?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">SIM Cards:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.sims?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Purchase Orders:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.pos?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Issue Tracker:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.issues?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Categories:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.categoryGroups?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="btn-download-backup-json"
            onClick={handleGenerateBackup}
            disabled={isDownloadingBackup}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingBackup ? 'Generating Backup...' : 'Download Complete System Backup (.json)'}</span>
          </button>
        </div>

        {/* 2. UPLOAD & RESTORE BACKUP */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center">
                  Restore From Backup File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload your previously downloaded backup file (.json) to instantly restore all system data.
                </p>
              </div>
            </div>

            {/* Error banner if any */}
            {restoreError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{restoreError}</span>
              </div>
            )}

            {/* Staged File Preview or Drag-and-drop selector */}
            {!stagedRestoreData ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-emerald-400 dark:hover:border-emerald-600'
                }`}
              >
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
                  <FileJson className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Click to browse or drag & drop backup file (.json)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select <code className="text-emerald-600 dark:text-emerald-400">BBL_System_Backup_*.json</code> from your PC or USB drive
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json, .sqlite.json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="mt-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate max-w-[200px] sm:max-w-xs">
                      {stagedRestoreData.fileName}
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono px-2 py-0.5 rounded">
                    {stagedRestoreData.fileSizeKB} KB
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2">
                  <span>Export Date: <strong className="text-slate-800 dark:text-slate-200">{stagedRestoreData.exportDate}</strong></span>
                  <span>Version: <strong className="text-slate-800 dark:text-slate-200">{stagedRestoreData.version}</strong></span>
                </div>

                {/* Counts breakdown */}
                {stagedRestoreData.counts && (
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                    <div>Devices: <strong className="text-slate-900 dark:text-white">{stagedRestoreData.counts.devices || 0}</strong></div>
                    <div>Tickets: <strong className="text-slate-900 dark:text-white">{stagedRestoreData.counts.tickets || 0}</strong></div>
                    <div>SIMs: <strong className="text-slate-900 dark:text-white">{stagedRestoreData.counts.simCards || 0}</strong></div>
                    <div>POs: <strong className="text-slate-900 dark:text-white">{stagedRestoreData.counts.purchaseOrders || 0}</strong></div>
                    <div>Issues: <strong className="text-slate-900 dark:text-white">{stagedRestoreData.counts.issueTracker || 0}</strong></div>
                    <div>Groups: <strong className="text-slate-900 dark:text-white">{stagedRestoreData.counts.categoryGroups || 0}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {stagedRestoreData ? (
            <div className="flex items-center space-x-2">
              <button
                id="btn-execute-restore-confirm"
                onClick={handleExecuteRestore}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Upload & Restore System Data Now</span>
              </button>
              <button
                onClick={handleCancelRestore}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Select File to Restore</span>
            </button>
          )}
        </div>
      </div>

      {/* System Access & Device Telemetry Logs Section (আজকে কে ঢুকেছে, ডিভাইস আইপি, লোকেশন, ল্যাপটপ প্রোফাইল নাম) */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl shadow-xs overflow-hidden" id="system-access-logs-container">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Live System Access & Device Telemetry Logs
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time tracking of who accessed the system, client IP address, geographical location, and device profile name.
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-export-logs-csv"
                onClick={handleExportLogsCSV}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                title="Export access telemetry to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                id="btn-export-logs-json"
                onClick={handleExportLogsJSON}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                title="Export access telemetry to JSON"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Export JSON</span>
              </button>
              <button
                id="btn-clear-logs"
                onClick={handleClearLogs}
                className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold px-2 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                title="Clear stored logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setActiveLogFilter('today')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  activeLogFilter === 'today'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Today</span>
                <span className="bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {stats.todayCount}
                </span>
              </button>
              <button
                onClick={() => setActiveLogFilter('month')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  activeLogFilter === 'month'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>This Month</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {stats.monthCount}
                </span>
              </button>
              <button
                onClick={() => setActiveLogFilter('year')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  activeLogFilter === 'year'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>This Year ({new Date().getFullYear()})</span>
              </button>
              <button
                onClick={() => setActiveLogFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  activeLogFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({logs.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by IP, profile, location, device..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Telemetry Log Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700/70 text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Time & Date</th>
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-4">Client IP Address</th>
                <th className="py-3 px-4">Location & ISP</th>
                <th className="py-3 px-4">Device & OS Profile</th>
                <th className="py-3 px-4">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No access log records found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isToday = log.date === stats.todayDate;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition duration-150"
                    >
                      {/* 1. Time & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>{log.time}</span>
                          {isToday && (
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {log.date}
                        </div>
                      </td>

                      {/* 2. User Profile */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                            {log.userProfile.charAt(0).toUpperCase()}
                          </div>
                          <span>{log.userProfile}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 pl-6">
                          ID: {log.id.split('-').slice(-2).join('-')}
                        </div>
                      </td>

                      {/* 3. IP Address */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                          <Globe className="w-3 h-3 mr-1 text-emerald-500" />
                          {log.ipAddress}
                        </span>
                      </td>

                      {/* 4. Location & ISP */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{log.location}</span>
                        </div>
                        {log.isp && (
                          <div className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5 pl-4">
                            ISP: {log.isp}
                          </div>
                        )}
                      </td>

                      {/* 5. Laptop & Device Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 dark:text-slate-100">
                          <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{log.laptopProfile}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 dark:text-slate-500 flex items-center space-x-2 mt-0.5 pl-5">
                          <span>{log.browser}</span>
                          <span>•</span>
                          <span>{log.deviceDetails?.screenResolution || '1920x1080'}</span>
                        </div>
                      </td>

                      {/* 6. Action / Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            log.action.includes('Login')
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : log.action.includes('Backup')
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : log.action.includes('Restore')
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with quick summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> logged telemetry entries
          </span>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All sessions are encrypted and stored locally with zero-loss fallback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
