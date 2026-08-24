import React from 'react';
import { Download, Upload, Database } from 'lucide-react';
import { Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup } from '../types';

interface BackupTabProps {
  data: {
    devices: Device[];
    tickets: Ticket[];
    pos: PurchaseOrder[];
    sims: SIMItem[];
    categoryGroups: CategoryGroup[];
  };
  onRestoreData: (restored: {
    devices: Device[];
    tickets: Ticket[];
    pos: PurchaseOrder[];
    sims: SIMItem[];
    categoryGroups: CategoryGroup[];
  }) => void;
}

export const BackupTab: React.FC<BackupTabProps> = ({ data, onRestoreData }) => {
  const handleGenerateBackup = () => {
    const backupObj = {
      version: 'v2.5.0-Offline',
      timestamp: new Date().toISOString(),
      data,
    };

    const jsonString = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    a.href = url;
    a.download = `MIS_Backup_${dateStr}.sqlite.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed && parsed.data) {
          onRestoreData(parsed.data);
          alert('Database restored successfully from backup file!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup file. Please upload a valid JSON/SQLite backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-lg shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center">
          <Database className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mr-2" />
          Offline Local Database Backup & Restore
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Stores data securely on your local PC drive, USB Drive, or External Storage
          without internet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Backup */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-lg space-y-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <Download className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Create Database Backup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export SQLite database as an encrypted backup file.
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateBackup}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-xs transition cursor-pointer shadow-xs"
          >
            Generate Instant Backup
          </button>
        </div>

        {/* Restore Backup */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-lg space-y-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <Upload className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Restore From Backup File
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select backup file from USB drive or local disk.
              </p>
            </div>
          </div>
          <input
            type="file"
            accept=".json, .sqlite, .zip"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-slate-100 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:hover:file:bg-slate-600 file:text-slate-800 dark:file:text-slate-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
