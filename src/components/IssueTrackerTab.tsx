import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Clock,
  Calendar,
  User,
  MapPin,
  Building2,
  Tag,
  Layers,
  Repeat,
  FileText,
  CheckCircle2,
  Plus,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Edit2,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import {
  IssueTrackerItem,
  CategoryGroup,
  SystemOptions,
  Device,
} from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';

interface IssueTrackerTabProps {
  issues: IssueTrackerItem[];
  onSaveIssue: (issue: IssueTrackerItem) => Promise<boolean> | void;
  onDeleteIssue?: (id: string) => void;
  categoryGroups: CategoryGroup[];
  systemOptions: SystemOptions;
  devices?: Device[];
  onNavigateToReport: () => void;
}

export const IssueTrackerTab: React.FC<IssueTrackerTabProps> = ({
  issues,
  onSaveIssue,
  onDeleteIssue,
  categoryGroups,
  systemOptions,
  devices = [],
  onNavigateToReport,
}) => {
  // Helper to get formatted current Date (YYYY-MM-DD) and Time (HH:MM)
  const getNowDate = () => new Date().toISOString().split('T')[0];
  const getNowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Form State
  const [branchName, setBranchName] = useState('');
  const [issueType, setIssueType] = useState(
    systemOptions.issueTypes[0] || 'Network Disconnection'
  );
  const [category, setCategory] = useState(
    categoryGroups[0]?.title || 'Branch MIS'
  );
  const [odooTicketId, setOdooTicketId] = useState('');
  const [priority, setPriority] = useState<string>(
    systemOptions.ticketPriorities[2] || systemOptions.ticketPriorities[0] || 'MEDIUM'
  );
  const [deviceReplace, setDeviceReplace] = useState<'YES' | 'NO'>('NO');
  const [replaceDeviceId, setReplaceDeviceId] = useState('');
  const [oldDeviceId, setOldDeviceId] = useState('');
  const [location, setLocation] = useState('');
  const [assignPerson, setAssignPerson] = useState(
    systemOptions.technicians[0] || 'Support Engineer Team'
  );
  const [status, setStatus] = useState<string>(
    systemOptions.ticketStatuses[0] || 'OPEN'
  );
  const [date, setDate] = useState(getNowDate());

  // Date & Time Fields
  const [clientReportingDate, setClientReportingDate] = useState(getNowDate());
  const [clientReportingTime, setClientReportingTime] = useState(getNowTime());

  const [clientResponseDate, setClientResponseDate] = useState('');
  const [clientResponseTime, setClientResponseTime] = useState('');

  const [resolutionDate, setResolutionDate] = useState('');
  const [resolutionTime, setResolutionTime] = useState('');

  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Editing state for recent list
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingIssue, setViewingIssue] = useState<IssueTrackerItem | null>(null);

  // Confirmation modal state
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

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Quick Set Now Handlers
  const handleSetReportingNow = () => {
    setClientReportingDate(getNowDate());
    setClientReportingTime(getNowTime());
    showToast('Client Reporting Time set to Current Time!');
  };

  const handleSetResponseNow = () => {
    setClientResponseDate(getNowDate());
    setClientResponseTime(getNowTime());
    showToast('Client Response Time set to Current Time!');
  };

  const handleSetResolutionNow = () => {
    setResolutionDate(getNowDate());
    setResolutionTime(getNowTime());
    if (status === 'OPEN' || status === 'IN_PROGRESS') {
      setStatus('RESOLVED');
    }
    showToast('Resolution Time set to Current Time & status updated to Resolved!');
  };

  // Reset Form
  const handleResetForm = () => {
    setEditingId(null);
    setBranchName('');
    setIssueType(systemOptions.issueTypes[0] || 'Network Disconnection');
    setCategory(categoryGroups[0]?.title || 'Branch MIS');
    setOdooTicketId('');
    setPriority('MEDIUM');
    setDeviceReplace('NO');
    setReplaceDeviceId('');
    setOldDeviceId('');
    setLocation('');
    setAssignPerson(systemOptions.technicians[0] || 'Support Engineer Team');
    setStatus('OPEN');
    setDate(getNowDate());
    setClientReportingDate(getNowDate());
    setClientReportingTime(getNowTime());
    setClientResponseDate('');
    setClientResponseTime('');
    setResolutionDate('');
    setResolutionTime('');
    setDetails('');
  };

  // Load Issue into form for edit
  const handleEditIssue = (issue: IssueTrackerItem) => {
    setEditingId(issue.id);
    setBranchName(issue.branchName);
    setIssueType(issue.issueType);
    setCategory(issue.category);
    setOdooTicketId(issue.odooTicketId);
    setPriority(issue.priority);
    setDeviceReplace(issue.deviceReplace);
    setReplaceDeviceId(issue.replaceDeviceId || '');
    setOldDeviceId(issue.oldDeviceId || '');
    setLocation(issue.location);
    setAssignPerson(issue.assignPerson);
    setStatus(issue.status);
    setDate(issue.date);
    setClientReportingDate(issue.clientReportingDate);
    setClientReportingTime(issue.clientReportingTime);
    setClientResponseDate(issue.clientResponseDate || '');
    setClientResponseTime(issue.clientResponseTime || '');
    setResolutionDate(issue.resolutionDate || '');
    setResolutionTime(issue.resolutionTime || '');
    setDetails(issue.details);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded ${issue.id} for editing.`);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      showToast('Please enter or select a Branch Name');
      return;
    }

    setIsSubmitting(true);
    const newIssue: IssueTrackerItem = {
      id: editingId || `ISSUE-${Date.now().toString().slice(-5)}`,
      branchName: branchName.trim(),
      issueType,
      category,
      odooTicketId: odooTicketId.trim(),
      priority,
      deviceReplace,
      replaceDeviceId: replaceDeviceId.trim(),
      oldDeviceId: oldDeviceId.trim(),
      location: location.trim(),
      assignPerson: assignPerson.trim(),
      status,
      date,
      clientReportingDate,
      clientReportingTime,
      clientResponseDate,
      clientResponseTime,
      resolutionDate,
      resolutionTime,
      details: details.trim(),
      createdAt: editingId
        ? issues.find((i) => i.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveIssue(newIssue);
    setIsSubmitting(false);

    showToast(
      editingId
        ? `Issue ${newIssue.id} updated successfully!`
        : `Issue ${newIssue.id} logged & saved successfully!`
    );

    handleResetForm();
  };

  // Extract unique category names from categoryGroups configured in System Settings
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    if (categoryGroups && categoryGroups.length > 0) {
      categoryGroups.forEach((g) => {
        if (g.title) cats.add(g.title);
        if (g.items && Array.isArray(g.items)) {
          g.items.forEach((it) => {
            if (it) cats.add(it);
          });
        }
      });
    }
    const list = Array.from(cats);
    return list.length > 0
      ? list
      : ['Branch MIS', 'Info Security', 'Infrastructure', 'Head Office'];
  }, [categoryGroups]);

  // Priority options list from System Settings
  const priorityOptions = useMemo(() => {
    const defaultPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (systemOptions.ticketPriorities && systemOptions.ticketPriorities.length > 0) {
      return Array.from(new Set([...systemOptions.ticketPriorities, ...defaultPriorities]));
    }
    return defaultPriorities;
  }, [systemOptions.ticketPriorities]);

  // Status options list from System Settings
  const statusOptions = useMemo(() => {
    const defaultStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING_CLIENT', 'RESOLVED', 'CLOSED'];
    if (systemOptions.ticketStatuses && systemOptions.ticketStatuses.length > 0) {
      return Array.from(new Set([...systemOptions.ticketStatuses, ...defaultStatuses]));
    }
    return defaultStatuses;
  }, [systemOptions.ticketStatuses]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Issue Tracker Entry
              {editingId && (
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  Editing: {editingId}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              Log incident tickets, track client turnaround times (TAT), and manage device replacements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNavigateToReport}
            className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>View Issue Reports & Analytics</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Main Entry Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? 'Edit Incident Details' : 'New Issue Registration'}
            </h2>
          </div>
        </div>

        {/* 3-Column Grid: Core Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 1. Branch Name */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Branch Name *</span>
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Gulshan Branch"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 2. Issue Type */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Issue Type *</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
            >
              {systemOptions.issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Odoo Ticket ID */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Odoo Ticket ID</span>
            </label>
            <input
              type="text"
              value={odooTicketId}
              onChange={(e) => setOdooTicketId(e.target.value)}
              placeholder="e.g. OD-94821"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* 4-Column Grid: Priority, Replacement, Location, Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 5. Priority */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Priority</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 transition font-bold"
            >
              {priorityOptions.map((p) => {
                const icon =
                  p === 'CRITICAL'
                    ? '🔴'
                    : p === 'HIGH'
                    ? '🟠'
                    : p === 'MEDIUM'
                    ? '🟡'
                    : p === 'LOW'
                    ? '🟢'
                    : '⚡';
                return (
                  <option key={p} value={p}>
                    {icon} {p}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 6. Device Replace */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <Repeat className="w-3.5 h-3.5 text-indigo-400" />
              <span>Device Replace</span>
            </label>
            <select
              value={deviceReplace}
              onChange={(e) => setDeviceReplace(e.target.value as 'YES' | 'NO')}
              className={`w-full bg-slate-950 border rounded-lg p-2.5 font-bold transition focus:outline-none ${
                deviceReplace === 'YES'
                  ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                  : 'border-slate-700 text-white'
              }`}
            >
              <option value="NO">NO - Servicing / Repair</option>
              <option value="YES">YES - Replace Device</option>
            </select>
          </div>

          {/* 7. Location */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Location / Department</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 2nd Floor Server Room, Cash Counter"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 8. Assign Person (from System Settings Technicians) */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assign Person</span>
            </label>
            <select
              value={assignPerson}
              onChange={(e) => setAssignPerson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">Unassigned / Select Person</option>
              {systemOptions.technicians &&
                systemOptions.technicians.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              {assignPerson &&
                systemOptions.technicians &&
                !systemOptions.technicians.includes(assignPerson) && (
                  <option value={assignPerson}>{assignPerson}</option>
                )}
            </select>
          </div>
        </div>

        {/* Conditional Replacement Fields (Highlighted when Device Replace is YES) */}
        {deviceReplace === 'YES' && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-amber-300 font-semibold flex items-center gap-1">
                <span>Old Device ID (Faulty / Removed)</span>
              </label>
              <input
                type="text"
                value={oldDeviceId}
                onChange={(e) => setOldDeviceId(e.target.value)}
                placeholder="e.g. RTR-GLS-02 / DVR-104"
                className="w-full bg-slate-950 border border-amber-700/80 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-amber-300 font-semibold flex items-center gap-1">
                <span>Replace Device ID (New / Installed)</span>
              </label>
              <input
                type="text"
                value={replaceDeviceId}
                onChange={(e) => setReplaceDeviceId(e.target.value)}
                placeholder="e.g. RTR-GLS-09 / DVR-208"
                className="w-full bg-slate-950 border border-amber-700/80 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>
        )}

        {/* 2-Column Grid: Status & Issue Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Status</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-[42px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500 transition"
            >
              {statusOptions.map((st) => {
                const icon =
                  st === 'OPEN'
                    ? '🔵'
                    : st === 'IN_PROGRESS' || st === 'WORKING'
                    ? '🟡'
                    : st === 'PENDING_CLIENT' || st === 'ASSIGNED'
                    ? '🟠'
                    : st === 'RESOLVED'
                    ? '🟢'
                    : st === 'CLOSED'
                    ? '⚪'
                    : '🔹';
                return (
                  <option key={st} value={st}>
                    {icon} {st}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Issue Log Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-[42px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Section: 3 Time & Date Boxes with "Set Now" Buttons */}
        <div className="border-t border-slate-800 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Incident Timeline & SLA Tracking
            </h3>
            <span className="text-[11px] text-slate-400">
              Click <strong className="text-indigo-300 font-mono">"Set Now"</strong> to automatically fill current date & live time
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Box 1: Client Reporting Time & Date */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Client Reporting Time & Date
                </span>
                <button
                  type="button"
                  onClick={handleSetReportingNow}
                  className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/60 rounded text-[10px] font-bold cursor-pointer transition shadow-sm"
                  title="Click to set today's date & running time"
                >
                  ⚡ Set Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={clientReportingDate}
                    onChange={(e) => setClientReportingDate(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Time</label>
                  <input
                    type="time"
                    value={clientReportingTime}
                    onChange={(e) => setClientReportingTime(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Box 2: Client Response Time & Date */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Client Response Time & Date
                </span>
                <button
                  type="button"
                  onClick={handleSetResponseNow}
                  className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 text-amber-300 hover:text-white border border-amber-700/60 rounded text-[10px] font-bold cursor-pointer transition shadow-sm"
                  title="Click to set today's date & running time"
                >
                  ⚡ Set Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={clientResponseDate}
                    onChange={(e) => setClientResponseDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Time</label>
                  <input
                    type="time"
                    value={clientResponseTime}
                    onChange={(e) => setClientResponseTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Box 3: Resolution Time & Date */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Resolution Time & Date
                </span>
                <button
                  type="button"
                  onClick={handleSetResolutionNow}
                  className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-700/60 rounded text-[10px] font-bold cursor-pointer transition shadow-sm"
                  title="Click to set today's date & running time"
                >
                  ⚡ Set Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={resolutionDate}
                    onChange={(e) => setResolutionDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Time</label>
                  <input
                    type="time"
                    value={resolutionTime}
                    onChange={(e) => setResolutionTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Details / Description */}
        <div className="space-y-1.5 text-xs">
          <label className="text-slate-300 font-semibold block">
            Details & Incident Notes
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Enter issue description, error logs, root cause analysis, and resolution troubleshooting steps..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition text-xs resize-y"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            {editingId && (
              <span className="text-amber-400 font-semibold">Updating existing incident: {editingId}</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            {/* Submit / Update button visible only after typing in Details & Incident Notes (or if editing) */}
            {(details.trim().length > 0 || editingId) && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-2 shadow-md animate-in fade-in zoom-in-95 duration-200"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingId ? 'Update Issue' : 'Submit Issue'}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* View Issue Modal */}
      {viewingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                  Incident Record Details
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {viewingIssue.id}
                  {viewingIssue.odooTicketId && (
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      Odoo: {viewingIssue.odooTicketId}
                    </span>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingIssue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Branch</span>
                <span className="font-bold text-white">{viewingIssue.branchName}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Issue Type</span>
                <span className="font-semibold text-slate-200">{viewingIssue.issueType}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-200">{viewingIssue.category}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Priority</span>
                <span className="font-bold text-amber-400">{viewingIssue.priority}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className="font-bold text-emerald-400">{viewingIssue.status}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Assigned Person</span>
                <span className="font-medium text-slate-200">{viewingIssue.assignPerson || 'None'}</span>
              </div>
            </div>

            {viewingIssue.deviceReplace === 'YES' && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/80 rounded-lg text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-amber-400 block">Old Device ID (Removed)</span>
                  <span className="font-mono font-bold text-white">{viewingIssue.oldDeviceId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block">Replace Device ID (New)</span>
                  <span className="font-mono font-bold text-white">{viewingIssue.replaceDeviceId || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Timelines */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">
                SLA & Turnaround Timeline
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Client Reported:</span>
                  <span className="font-mono text-slate-200">
                    {viewingIssue.clientReportingDate || 'N/A'} {viewingIssue.clientReportingTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Client Responded:</span>
                  <span className="font-mono text-slate-200">
                    {viewingIssue.clientResponseDate ? `${viewingIssue.clientResponseDate} ${viewingIssue.clientResponseTime}` : 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Resolution:</span>
                  <span className="font-mono text-slate-200">
                    {viewingIssue.resolutionDate ? `${viewingIssue.resolutionDate} ${viewingIssue.resolutionTime}` : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            {viewingIssue.details && (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold block">Incident Notes & Details:</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {viewingIssue.details}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingIssue;
                  setViewingIssue(null);
                  handleEditIssue(toEdit);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Edit This Issue
              </button>
              <button
                type="button"
                onClick={() => setViewingIssue(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
