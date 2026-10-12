import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Search,
  HardDrive,
  Calendar,
  Layers,
  MapPin,
  Check,
  AlertTriangle,
  FileBarChart2,
  Edit2,
  Trash2,
  Eye,
  X,
  Building,
} from 'lucide-react';
import { DeviceSupportTicket, Device } from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';

const STANDARD_ISSUE_TYPES = [
  'Sim Connectivity',
  'Display Damage',
  'Beeper Problem',
  'Location Shift',
  'Power connectivity',
  'Push Button',
  'Debug Mood',
  'Sensor',
];

interface DeviceIssueTrackerTabProps {
  tickets: DeviceSupportTicket[];
  onSaveTicket: (ticket: DeviceSupportTicket) => void;
  onDeleteTicket?: (id: string) => void;
  devices?: Device[];
  onNavigateToReport: () => void;
}

export const DeviceIssueTrackerTab: React.FC<DeviceIssueTrackerTabProps> = ({
  tickets,
  onSaveTicket,
  onDeleteTicket,
  devices = [],
  onNavigateToReport,
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [deviceId, setDeviceId] = useState('');
  const [contactDate, setContactDate] = useState(getTodayDate());
  const [lastCommunication, setLastCommunication] = useState(getTodayDate());
  const [deviceLocation, setDeviceLocation] = useState('');
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<string[]>([]);
  const [isOtherIssueChecked, setIsOtherIssueChecked] = useState(false);
  const [otherIssueText, setOtherIssueText] = useState('');
  const [responsibility, setResponsibility] = useState<'BBPLC' | 'ITL' | string>('ITL');
  const [probableSolvingDate, setProbableSolvingDate] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'Yes' | 'No'>('No');
  const [odooId, setOdooId] = useState('');
  const [remarks, setRemarks] = useState('');

  // Search in recent entries
  const [recentSearch, setRecentSearch] = useState('');

  // Viewing detail modal
  const [viewingTicket, setViewingTicket] = useState<DeviceSupportTicket | null>(null);

  // Delete confirm modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    ticketId: string;
    ticketDesc: string;
  }>({
    isOpen: false,
    ticketId: '',
    ticketDesc: '',
  });

  // Calculate monthly location frequency
  const getMonthlyCount = (location: string, dateStr: string) => {
    if (!location || !dateStr) return 1;
    const ym = dateStr.substring(0, 7);
    return tickets.filter(
      (t) =>
        (t.deviceLocation || '').toLowerCase().trim() === location.toLowerCase().trim() &&
        (t.contactDate || '').substring(0, 7) === ym
    ).length;
  };

  const handleDeviceSelect = (dev: Device) => {
    setDeviceId(dev.id);
    if (dev.location) {
      setDeviceLocation(dev.location);
    }
  };

  const handleToggleIssue = (issueName: string) => {
    setSelectedIssueTypes((prev) =>
      prev.includes(issueName) ? prev.filter((i) => i !== issueName) : [...prev, issueName]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setDeviceId('');
    setContactDate(getTodayDate());
    setLastCommunication(getTodayDate());
    setDeviceLocation('');
    setSelectedIssueTypes([]);
    setIsOtherIssueChecked(false);
    setOtherIssueText('');
    setResponsibility('ITL');
    setProbableSolvingDate('');
    setTicketStatus('No');
    setOdooId('');
    setRemarks('');
  };

  const handleEditTicket = (t: DeviceSupportTicket) => {
    setEditingId(t.id);
    setDeviceId(t.deviceId);
    setContactDate(t.contactDate || getTodayDate());
    setLastCommunication(t.lastCommunication || getTodayDate());
    setDeviceLocation(t.deviceLocation);
    setResponsibility(t.responsibility || 'ITL');
    setProbableSolvingDate(t.probableSolvingDate === 'N/A' ? '' : t.probableSolvingDate);
    setTicketStatus(t.ticketStatus === 'Yes' ? 'Yes' : 'No');
    setOdooId(t.odooId === 'N/A' ? '' : t.odooId);
    setRemarks(t.remarks === 'N/A' ? '' : t.remarks);

    const issues = (t.issueType || '').split(',').map((s) => s.trim()).filter(Boolean);
    const standardMatches = issues.filter((i) => STANDARD_ISSUE_TYPES.includes(i));
    const otherMatches = issues.filter((i) => !STANDARD_ISSUE_TYPES.includes(i));

    setSelectedIssueTypes(standardMatches);
    if (otherMatches.length > 0) {
      setIsOtherIssueChecked(true);
      setOtherIssueText(otherMatches.join(', '));
    } else {
      setIsOtherIssueChecked(false);
      setOtherIssueText('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allIssues = [...selectedIssueTypes];
    if (isOtherIssueChecked && otherIssueText.trim()) {
      allIssues.push(otherIssueText.trim());
    }

    if (allIssues.length === 0) {
      alert('Please select at least one Device Issue Type.');
      return;
    }

    if (ticketStatus === 'Yes' && !odooId.trim()) {
      alert('Please enter the ODOO ID when Ticket Status Raised is Yes.');
      return;
    }

    const slNumber = editingId
      ? tickets.find((t) => t.id === editingId)?.slNo || tickets.length
      : tickets.length + 1;

    const payload: DeviceSupportTicket = {
      id: editingId || `DST-${Date.now().toString().slice(-6)}`,
      slNo: slNumber,
      deviceId: deviceId.trim(),
      contactDate,
      lastCommunication,
      deviceLocation: deviceLocation.trim(),
      issueType: allIssues.join(', '),
      responsibility,
      probableSolvingDate: probableSolvingDate || 'N/A',
      ticketStatus,
      odooId: ticketStatus === 'Yes' ? odooId.trim() : 'N/A',
      remarks: remarks.trim() || 'N/A',
      updatedAt: new Date().toISOString(),
      createdAt: editingId
        ? tickets.find((t) => t.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    onSaveTicket(payload);
    resetForm();
  };

  const filteredRecentTickets = tickets
    .filter((t) => {
      if (!recentSearch) return true;
      const q = recentSearch.toLowerCase();
      return (
        t.deviceId.toLowerCase().includes(q) ||
        t.deviceLocation.toLowerCase().includes(q) ||
        t.issueType.toLowerCase().includes(q) ||
        t.odooId.toLowerCase().includes(q)
      );
    })
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Device Issue Tracker
            </h1>
          </div>
        </div>

        <button
          onClick={onNavigateToReport}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          <FileBarChart2 className="w-4 h-4" />
          <span>View Device Issue Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: Form on Left, Recent Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {editingId ? 'Edit Ticket Entry' : 'Add New Ticket Entry'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: SL No & Device ID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SL No
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    editingId
                      ? tickets.find((t) => t.id === editingId)?.slNo || 1
                      : tickets.length + 1
                  }
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEV-1029"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    list="registeredDevicesList"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                  <datalist id="registeredDevicesList">
                    {Array.from(new Set(devices.map((d) => d.id).filter(Boolean))).map((uniqueDevId, dIdx) => {
                      const matched = devices.find((d) => d.id === uniqueDevId);
                      return (
                        <option key={`reg-dev-${uniqueDevId}-${dIdx}`} value={uniqueDevId}>
                          {matched?.location ? `${matched.location} (${matched.category})` : uniqueDevId}
                        </option>
                      );
                    })}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Quick Device Suggestion Pill (if matching device exists) */}
            {deviceId && devices.some((d) => d.id.toLowerCase() === deviceId.toLowerCase()) && (
              <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between text-xs">
                <span className="text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                  <HardDrive className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Matched in Device Inventory:{' '}
                    <strong>
                      {devices.find((d) => d.id.toLowerCase() === deviceId.toLowerCase())?.location || '-'}
                    </strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const found = devices.find((d) => d.id.toLowerCase() === deviceId.toLowerCase());
                    if (found?.location) setDeviceLocation(found.location);
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold text-[11px] hover:bg-indigo-500 cursor-pointer shrink-0"
                >
                  Use Location
                </button>
              </div>
            )}

            {/* Row 2: Contact Date & Last Communication */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Contact Date{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Last Communication{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={lastCommunication}
                  onChange={(e) => setLastCommunication(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Row 3: Device Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Device Location{' '}
                  <span className="text-rose-500">*</span>
                </span>
                {deviceLocation && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Monthly Frequency:{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {getMonthlyCount(deviceLocation, contactDate)} visit(s)
                    </strong>
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gulistan Branch, Dhaka"
                value={deviceLocation}
                onChange={(e) => setDeviceLocation(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Row 4: Device Issues Multi-select Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>
                  Device Issues Type <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Select all that apply)
                </span>
              </label>

              <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50/70 dark:bg-slate-950/60 max-h-48 overflow-y-auto space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STANDARD_ISSUE_TYPES.map((issue) => {
                    const isChecked = selectedIssueTypes.includes(issue);
                    return (
                      <label
                        key={issue}
                        onClick={() => handleToggleIssue(issue)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent label click
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                        />
                        <span>{issue}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Other (Type manually) checkbox */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label
                    onClick={() => setIsOtherIssueChecked(!isOtherIssueChecked)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition cursor-pointer select-none ${
                      isOtherIssueChecked
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isOtherIssueChecked}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                    />
                    <span>Other (Type manually)</span>
                  </label>

                  {isOtherIssueChecked && (
                    <input
                      type="text"
                      placeholder="Specify custom issue description..."
                      value={otherIssueText}
                      onChange={(e) => setOtherIssueText(e.target.value)}
                      className="mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Row 5: Responsibility & Probable Solving Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Responsibility <span className="text-rose-500">*</span>
                </label>
                <select
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="ITL">ITL (Inovace Technologies)</option>
                  <option value="BBPLC">BBPLC (Bank Internal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Probable Solving Date
                </label>
                <input
                  type="date"
                  value={probableSolvingDate}
                  onChange={(e) => setProbableSolvingDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Row 6: Ticket Status Raised & Conditional ODOO ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ticket Status Raised <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value as 'Yes' | 'No')}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="No">No (Not Raised)</option>
                  <option value="Yes">Yes (ODOO Ticket Raised)</option>
                </select>
              </div>

              {ticketStatus === 'Yes' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ODOO ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ODOO-88219"
                    value={odooId}
                    onChange={(e) => setOdooId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              )}
            </div>

            {/* Row 7: Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Add optional notes, parts replaced, technician actions..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {editingId ? 'Update Record' : 'Save Record'}
                </span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-200 dark:border-slate-700 transition"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Recent Entries & Live Frequency Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Recent Ticket Entries
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total {tickets.length} tickets recorded in system
                </p>
              </div>

              <div className="relative w-36">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter..."
                  value={recentSearch}
                  onChange={(e) => setRecentSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[520px] overflow-y-auto">
              {filteredRecentTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No ticket records found. Add your first record from the form!
                </div>
              ) : (
                filteredRecentTickets.map((t, index) => {
                  const monthlyCount = getMonthlyCount(t.deviceLocation, t.contactDate);
                  return (
                    <div
                      key={`dit-recent-${t.id || 'ticket'}-${t.slNo || ''}-${index}`}
                      className="py-3 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 font-bold">
                            #{t.slNo}
                          </span>
                          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {t.deviceId}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                              t.responsibility === 'ITL'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                            }`}
                          >
                            {t.responsibility}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingTicket(t)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditTicket(t)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteTicket && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmConfig({
                                  isOpen: true,
                                  ticketId: t.id,
                                  ticketDesc: `${t.deviceId} - ${t.deviceLocation}`,
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]" title={t.deviceLocation}>
                          {t.deviceLocation}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            monthlyCount > 3
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-bold'
                              : monthlyCount > 1
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-bold'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {monthlyCount} visit{monthlyCount > 1 ? 's' : ''} in{' '}
                          {t.contactDate ? t.contactDate.substring(0, 7) : '-'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span className="truncate max-w-[240px]" title={t.issueType}>
                          Issues: {t.issueType}
                        </span>
                        {t.ticketStatus === 'Yes' && (
                          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {t.odooId}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={onNavigateToReport}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>Open Full Device Issue Report & Filter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Ticket Details #{viewingTicket.slNo}
              </h3>
              <button
                onClick={() => setViewingTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Device ID</span>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                  {viewingTicket.deviceId}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Responsibility</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.responsibility}
                </p>
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Location & Monthly Visits</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.deviceLocation}
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">
                  Recorded frequency: {getMonthlyCount(viewingTicket.deviceLocation, viewingTicket.contactDate)} visit(s) in {viewingTicket.contactDate ? viewingTicket.contactDate.substring(0, 7) : '-'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Contact Date</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingTicket.contactDate}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Last Communication</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingTicket.lastCommunication}
                </p>
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Issue Types</span>
                <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.issueType}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Ticket Status / ODOO</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingTicket.ticketStatus === 'Yes' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Yes ({viewingTicket.odooId})
                    </span>
                  ) : (
                    <span className="text-slate-400">No</span>
                  )}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Probable Solving Date</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingTicket.probableSolvingDate}
                </p>
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Remarks</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 break-words">
                  {viewingTicket.remarks}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = viewingTicket;
                  setViewingTicket(null);
                  handleEditTicket(t);
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Edit This Ticket
              </button>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title="Delete Ticket Record"
        message={`Are you sure you want to delete ticket for "${confirmConfig.ticketDesc}"? This action cannot be undone.`}
        onConfirm={() => {
          if (onDeleteTicket && confirmConfig.ticketId) {
            onDeleteTicket(confirmConfig.ticketId);
          }
          setConfirmConfig({ isOpen: false, ticketId: '', ticketDesc: '' });
        }}
        onClose={() => setConfirmConfig({ isOpen: false, ticketId: '', ticketDesc: '' })}
      />
    </div>
  );
};
