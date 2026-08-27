import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
  HardDrive,
  Cpu,
  Ticket as TicketIcon,
  Smartphone,
  ShoppingBag,
  AlertCircle,
  FolderTree,
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
} from '../types';

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
  onRestoreData,
  showToast,
}) => {
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

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

  return (
    <div className="space-y-6 pb-12" id="backup-restore-page">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-5 rounded-xl shadow-xs">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                System Backup & Restore
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <HardDrive className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                Data Protection
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Download a complete snapshot of all inventory devices, tickets, SIM cards, purchase orders, issues, and settings, or restore system data at any time from a previously exported backup file.
            </p>
          </div>
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
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Devices:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{data.devices?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <TicketIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>Tickets:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{data.tickets?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>SIM Cards:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{data.sims?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    <span>POs:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{data.pos?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Issues:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{data.issues?.length || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <FolderTree className="w-3.5 h-3.5 text-purple-500" />
                    <span>Categories:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{data.categoryGroups?.length || 0}</span>
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
    </div>
  );
};
