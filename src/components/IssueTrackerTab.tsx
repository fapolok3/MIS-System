import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Check,
  Search,
  HardDrive,
  X,
} from 'lucide-react';
import {
  IssueTrackerItem,
  CategoryGroup,
  SystemOptions,
  Device,
} from '../types';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PREMESIS_OPTIONS,
  normalizeIssue,
} from '../utils/issueConstants';

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
  // Helper for formatted Date (YYYY-MM-DD) & Time (HH:MM)
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // State for Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // 34 Fields State
  const [sl, setSl] = useState<number>(issues.length + 1);
  const [issueLogDate, setIssueLogDate] = useState<string>(getTodayDate());
  const [odooId, setOdooId] = useState<string>('');
  const [status, setStatus] = useState<string>('Open');
  const [clientName, setClientName] = useState<string>('');
  const [premesisName, setPremesisName] = useState<string>('');

  const [priority, setPriority] = useState<string>('Medium');
  const [deviceReplace, setDeviceReplace] = useState<'Yes' | 'No'>('No');
  const [oldDevice, setOldDevice] = useState<string>('');
  const [newDevice, setNewDevice] = useState<string>('');

  const [clientReportingTime, setClientReportingTime] = useState<string>('');
  const [responseTime, setResponseTime] = useState<string>('');
  const [accessories, setAccessories] = useState<string>('');
  const [product, setProduct] = useState<string>('');

  const [district, setDistrict] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [number, setNumber] = useState<string>('');

  const [deliveryOption, setDeliveryOption] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [kam, setKam] = useState<string>('');
  const [segment, setSegment] = useState<string>('');
  const [invoiceHandover, setInvoiceHandover] = useState<string>('');

  const [collectionAmount, setCollectionAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [vendorBillAmount, setVendorBillAmount] = useState<string>('');

  const [installationStatus, setInstallationStatus] = useState<string>('');
  const [handedOverTo, setHandedOverTo] = useState<string>('');
  const [assignPerson, setAssignPerson] = useState<string>('');
  const [handoverCollected, setHandoverCollected] = useState<'Yes' | 'No'>('No');
  const [installationDate, setInstallationDate] = useState<string>('');
  const [unitQty, setUnitQty] = useState<string>('');

  const [comments, setComments] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Auto-calculate SL number when not editing
  useEffect(() => {
    if (!editingId) {
      const maxSl = issues.reduce((max, item) => {
        const itemSl = item.sl !== undefined ? Number(item.sl) : 0;
        return itemSl > max ? itemSl : max;
      }, 0);
      setSl(maxSl + 1);
    }
  }, [issues, editingId]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Toggle Device Fields
  const handleDeviceReplaceChange = (val: 'Yes' | 'No') => {
    setDeviceReplace(val);
    if (val === 'No') {
      setOldDevice('');
      setNewDevice('');
    }
  };

  // Quick Set Now handlers
  const handleSetReportingNow = () => {
    setClientReportingTime(getCurrentDateTime());
    showToast('Client Reporting Time set to current timestamp!');
  };

  const handleSetResponseNow = () => {
    setResponseTime(getCurrentDateTime());
    showToast('Response Time set to current timestamp!');
  };

  // Reset form to blank defaults
  const handleResetForm = () => {
    setEditingId(null);
    const maxSl = issues.reduce((max, item) => {
      const itemSl = item.sl !== undefined ? Number(item.sl) : 0;
      return itemSl > max ? itemSl : max;
    }, 0);
    setSl(maxSl + 1);
    setIssueLogDate(getTodayDate());
    setOdooId('');
    setStatus('Open');
    setClientName('');
    setPremesisName('');
    setPriority('Medium');
    setDeviceReplace('No');
    setOldDevice('');
    setNewDevice('');
    setClientReportingTime('');
    setResponseTime('');
    setAccessories('');
    setProduct('');
    setDistrict('');
    setAddress('');
    setContactPerson('');
    setNumber('');
    setDeliveryOption('');
    setServiceType('');
    setKam('');
    setSegment('');
    setInvoiceHandover('');
    setCollectionAmount('');
    setPaymentMethod('');
    setVendorBillAmount('');
    setInstallationStatus('');
    setHandedOverTo('');
    setAssignPerson('');
    setHandoverCollected('No');
    setInstallationDate('');
    setUnitQty('');
    setComments('');
    setRemarks('');
  };

  // Populate form for editing an existing issue
  const handleEditIssue = (item: IssueTrackerItem) => {
    const normalized = normalizeIssue(item);
    setEditingId(normalized.id);
    setSl(normalized.sl !== undefined ? normalized.sl : 1);
    setIssueLogDate(normalized.issueLogDate || getTodayDate());
    setOdooId(normalized.odooId || '');
    setStatus(normalized.status || 'Open');
    setClientName(normalized.clientName || '');
    setPremesisName(normalized.premesisName || '');
    setPriority(normalized.priority || 'Medium');
    setDeviceReplace(normalized.deviceReplace === 'Yes' ? 'Yes' : 'No');
    setOldDevice(normalized.oldDevice === '-' ? '' : normalized.oldDevice || '');
    setNewDevice(normalized.newDevice === '-' ? '' : normalized.newDevice || '');
    setClientReportingTime(normalized.clientReportingTime || '');
    setResponseTime(normalized.responseTime || '');
    setAccessories(normalized.accessories || '');
    setProduct(normalized.product || '');
    setDistrict(normalized.district || '');
    setAddress(normalized.address || '');
    setContactPerson(normalized.contactPerson || '');
    setNumber(normalized.number || '');
    setDeliveryOption(normalized.deliveryOption || '');
    setServiceType(normalized.serviceType || '');
    setKam(normalized.kam || '');
    setSegment(normalized.segment || '');
    setInvoiceHandover(normalized.invoiceHandover || '');
    setCollectionAmount(normalized.collectionAmount ? String(normalized.collectionAmount) : '');
    setPaymentMethod(normalized.paymentMethod || '');
    setVendorBillAmount(normalized.vendorBillAmount ? String(normalized.vendorBillAmount) : '');
    setInstallationStatus(normalized.installationStatus || '');
    setHandedOverTo(normalized.handedOverTo || '');
    setAssignPerson(normalized.assignPerson || '');
    setHandoverCollected(normalized.handoverCollected === 'Yes' ? 'Yes' : 'No');
    setInstallationDate(normalized.installationDate || '');
    setUnitQty(normalized.unitQty !== undefined && normalized.unitQty !== null ? String(normalized.unitQty) : '');
    setComments(normalized.comments || '');
    setRemarks(normalized.remarks || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded SL #${normalized.sl} (${normalized.odooId || 'Entry'}) into editor!`);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetId = editingId || `issue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newEntry: IssueTrackerItem = normalizeIssue({
      id: targetId,
      sl: Number(sl) || issues.length + 1,
      issueLogDate: issueLogDate || getTodayDate(),
      odooId: odooId.trim(),
      status,
      clientName: clientName.trim(),
      premesisName,
      priority,
      deviceReplace,
      oldDevice: deviceReplace === 'Yes' ? oldDevice.trim() : '-',
      newDevice: deviceReplace === 'Yes' ? newDevice.trim() : '-',
      clientReportingTime,
      responseTime,
      accessories: accessories.trim(),
      product: product.trim(),
      district: district.trim(),
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      number: number.trim(),
      deliveryOption: deliveryOption.trim(),
      serviceType: serviceType.trim(),
      kam: kam.trim(),
      segment: segment.trim(),
      invoiceHandover: invoiceHandover.trim(),
      collectionAmount: collectionAmount.trim() || '0',
      paymentMethod: paymentMethod.trim(),
      vendorBillAmount: vendorBillAmount.trim() || '0',
      installationStatus: installationStatus.trim(),
      handedOverTo: handedOverTo.trim(),
      assignPerson: assignPerson.trim(),
      handoverCollected,
      installationDate,
      unitQty: Number(unitQty) || 1,
      comments: comments.trim(),
      remarks: remarks.trim(),
    });

    try {
      await onSaveIssue(newEntry);
      showToast(
        editingId
          ? `SL #${newEntry.sl} updated successfully!`
          : `New log entry SL #${newEntry.sl} created successfully!`
      );
      if (!editingId) {
        handleResetForm();
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving entry, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              34 Fields Issue Tracker
            </span>
            {editingId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                Editing Mode
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {editingId ? `Edit Issue & Job Entry (SL #${sl})` : 'Add New Issue & Job Entry'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete ticket, device specifications, service timeline, financial metrics, and operational routing form
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form
          </button>
          <button
            type="button"
            onClick={onNavigateToReport}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            View in Issue Report ({issues.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 34 Fields Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Group 1: 1. Ticket & Identification Details */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>1. Ticket & Identification Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* SL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  SL Number *
                </label>
                <input
                  type="number"
                  required
                  value={sl}
                  onChange={(e) => setSl(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Issue Log Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Issue Log Date
                </label>
                <input
                  type="date"
                  value={issueLogDate}
                  onChange={(e) => setIssueLogDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Odoo ID */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Odoo Id
                </label>
                <input
                  type="text"
                  value={odooId}
                  onChange={(e) => setOdooId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                    status === 'Open'
                      ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                      : status === 'Pending'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                      : status === 'OnBoard'
                      ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                      : status === 'Working'
                      ? 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Premesis Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Premesis Name
                </label>
                <select
                  value={premesisName}
                  onChange={(e) => setPremesisName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Premesis</option>
                  {PREMESIS_OPTIONS.map((prem) => (
                    <option key={prem} value={prem}>
                      {prem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: 2. Priority & Device Specifications */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>2. Priority & Device Specifications</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    priority === 'High'
                      ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                      : priority === 'Medium'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                  }`}
                >
                  {PRIORITY_OPTIONS.map((pri) => (
                    <option key={pri} value={pri}>
                      {pri}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Replace */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Device Replace Required
                </label>
                <select
                  value={deviceReplace}
                  onChange={(e) => handleDeviceReplaceChange(e.target.value as 'Yes' | 'No')}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    deviceReplace === 'Yes'
                      ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {/* Old Device */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Old Device ID / Serial {deviceReplace === 'Yes' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  disabled={deviceReplace === 'No'}
                  value={oldDevice}
                  onChange={(e) => setOldDevice(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    deviceReplace === 'No' ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-850' : ''
                  }`}
                />
              </div>

              {/* New Device */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  New Device ID / Serial {deviceReplace === 'Yes' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  disabled={deviceReplace === 'No'}
                  value={newDevice}
                  onChange={(e) => setNewDevice(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    deviceReplace === 'No' ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-850' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Group 3: 3. Service Timelines & Hardware */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>3. Service Timelines & Hardware</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Client Reporting Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Client Reporting Time & Date
                  </label>
                  <button
                    type="button"
                    onClick={handleSetReportingNow}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={clientReportingTime}
                  onChange={(e) => setClientReportingTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Response Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Response Time & Date
                  </label>
                  <button
                    type="button"
                    onClick={handleSetResponseNow}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={responseTime}
                  onChange={(e) => setResponseTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Accessories */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Accessories Provided
                </label>
                <input
                  type="text"
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Product */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Product Name
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group 4: 4. Location & Contact Details */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>4. Location & Contact Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* District */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Site Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Detailed Site Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Group 5: 5. Operations & Logistics Routing */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>5. Operations & Logistics Routing</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Delivery Option */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Delivery Option
                </label>
                <input
                  type="text"
                  value={deliveryOption}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Service Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Service Type
                </label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* KAM */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Key Account Manager (KAM)
                </label>
                <input
                  type="text"
                  value={kam}
                  onChange={(e) => setKam(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Market Segment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Market Segment
                </label>
                <input
                  type="text"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Invoice Handover */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Invoice Handover Status
                </label>
                <input
                  type="text"
                  value={invoiceHandover}
                  onChange={(e) => setInvoiceHandover(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group 6: 6. Financial & Payment Metrics */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>6. Financial & Payment Metrics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Collection Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Collection Amount (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Vendor Bill Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Vendor Bill Amount (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={vendorBillAmount}
                  onChange={(e) => setVendorBillAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group 7: 7. Installation & Field Assignment */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>7. Installation & Field Assignment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Installation Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Installation Status
                </label>
                <input
                  type="text"
                  value={installationStatus}
                  onChange={(e) => setInstallationStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Handed Over To */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Handed Over To
                </label>
                <input
                  type="text"
                  value={handedOverTo}
                  onChange={(e) => setHandedOverTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Assigned Person */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Assigned Person
                </label>
                <input
                  type="text"
                  value={assignPerson}
                  onChange={(e) => setAssignPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Handover Collected */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Handover Collected
                </label>
                <select
                  value={handoverCollected}
                  onChange={(e) => setHandoverCollected(e.target.value as 'Yes' | 'No')}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {/* Installation Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Installation Date
                </label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Unit Qty */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Unit Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={unitQty}
                  onChange={(e) => setUnitQty(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group 8: 8. Additional Comments & Remarks */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 rounded-lg border-l-4 border-blue-600 mb-4">
              <span>8. Additional Comments & Remarks</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Issue Description & Comments
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Final Operational Remarks
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              * All 34 fields will be permanently stored and reflected in the <b>Issue Report</b> dashboard.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel / Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : editingId ? 'Update Log Entry' : 'Save Log Entry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
