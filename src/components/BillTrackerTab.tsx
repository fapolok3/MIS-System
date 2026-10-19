import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  Building,
  MapPin,
  Tag,
  DollarSign,
  UserCheck,
  CreditCard,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileDown,
  ArrowRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { BillItem } from '../types';

interface BillTrackerTabProps {
  bills: BillItem[];
  onSaveBill: (bill: BillItem) => void;
  onDeleteBill: (id: string) => void;
  clients: string[];
  onAddClient: (name: string) => void;
  onDeleteClient: (name: string) => void;
  locations: string[];
  onAddLocation: (name: string) => void;
  onDeleteLocation: (name: string) => void;
  categories: string[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onNavigateToReport: () => void;
  editBill?: BillItem | null;
  onClearEditBill?: () => void;
}

export const BillTrackerTab: React.FC<BillTrackerTabProps> = ({
  bills,
  onSaveBill,
  onDeleteBill,
  clients,
  onAddClient,
  onDeleteClient,
  locations,
  onAddLocation,
  onDeleteLocation,
  categories,
  onAddCategory,
  onDeleteCategory,
  onNavigateToReport,
  editBill,
  onClearEditBill,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  // Modals for adding/deleting metadata
  const [modalInput, setModalInput] = useState<{
    isOpen: boolean;
    type: 'client' | 'location' | 'category' | null;
    value: string;
    title: string;
    placeholder: string;
  }>({
    isOpen: false,
    type: null,
    value: '',
    title: '',
    placeholder: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'client' | 'location' | 'category' | null;
    name: string;
  }>({
    isOpen: false,
    type: null,
    name: '',
  });

  // Form State
  const [billNumber, setBillNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [client, setClient] = useState(clients[0] || 'Black Bank PLC');
  const [clientLocation, setClientLocation] = useState(locations[0] || 'Gulistan Branch');
  const [description, setDescription] = useState('');
  const [billType, setBillType] = useState(categories[0] || 'Installation Support');
  const [amount, setAmount] = useState<string>('');
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionDate, setSubmissionDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Submitted' | 'Partial' | 'Paid'>('Pending');
  const [approvedBy, setApprovedBy] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [remarks, setRemarks] = useState('');

  // Side List Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [viewingBill, setViewingBill] = useState<BillItem | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    billId: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    billId: '',
    title: '',
    message: '',
  });

  // Generate Unique Bill Number
  const generateBillNumber = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `BILL-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
      d.getHours()
    )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  useEffect(() => {
    if (!editingId) {
      setBillNumber(generateBillNumber());
    }
  }, [editingId]);

  // Set default client, location, category if state is empty
  useEffect(() => {
    if (!client && clients.length > 0) setClient(clients[0]);
    if (!clientLocation && locations.length > 0) setClientLocation(locations[0]);
    if (!billType && categories.length > 0) setBillType(categories[0]);
  }, [clients, locations, categories]);

  const handleEditBill = (b: BillItem) => {
    setEditingId(b.id);
    setBillNumber(b.billNumber);
    setInvoiceNumber(b.invoiceNumber || '');
    setVendor(b.vendor || '');
    setClient(b.client);
    setClientLocation(b.clientLocation);
    setDescription(b.description || '');
    setBillType(b.billType);
    setAmount(String(b.amount || ''));
    setHandoverDate(b.handoverDate || '');
    setSubmissionDate(b.submissionDate || '');
    setReceivedDate(b.receivedDate || '');
    setPaymentDate(b.paymentDate || '');
    setStatus(b.status || 'Pending');
    setApprovedBy(b.approvedBy || '');
    setPaymentMethod(b.paymentMethod || 'Bank Transfer');
    setRemarks(b.remarks || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (editBill) {
      handleEditBill(editBill);
      if (onClearEditBill) {
        onClearEditBill();
      }
    }
  }, [editBill]);

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleSaveModalInput = () => {
    const val = modalInput.value.trim();
    if (!val) return;
    if (modalInput.type === 'client') {
      onAddClient(val);
      setClient(val);
    } else if (modalInput.type === 'location') {
      onAddLocation(val);
      setClientLocation(val);
    } else if (modalInput.type === 'category') {
      onAddCategory(val);
      setBillType(val);
    }
    setModalInput({ isOpen: false, type: null, value: '', title: '', placeholder: '' });
  };

  const handleConfirmDeleteMeta = () => {
    if (deleteConfirm.type === 'client') {
      onDeleteClient(deleteConfirm.name);
    } else if (deleteConfirm.type === 'location') {
      onDeleteLocation(deleteConfirm.name);
    } else if (deleteConfirm.type === 'category') {
      onDeleteCategory(deleteConfirm.name);
    }
    setDeleteConfirm({ isOpen: false, type: null, name: '' });
  };

  const resetForm = () => {
    setEditingId(null);
    setBillNumber(generateBillNumber());
    setInvoiceNumber('');
    setVendor('');
    setClient(clients[0] || 'Black Bank PLC');
    setClientLocation(locations[0] || 'Gulistan Branch');
    setDescription('');
    setBillType(categories[0] || 'Installation Support');
    setAmount('');
    setHandoverDate(new Date().toISOString().split('T')[0]);
    setSubmissionDate('');
    setReceivedDate('');
    setPaymentDate('');
    setStatus('Pending');
    setApprovedBy('');
    setPaymentMethod('Bank Transfer');
    setRemarks('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setFormError('Please enter a valid bill amount (greater than or equal to 0).');
      return;
    }
    setFormError('');

    const payload: BillItem = {
      id: editingId || billNumber,
      billNumber: billNumber.trim() || generateBillNumber(),
      invoiceNumber: invoiceNumber.trim(),
      vendor: vendor.trim(),
      client: client.trim(),
      clientLocation: clientLocation.trim(),
      description: description.trim(),
      billType: billType.trim(),
      amount: parsedAmount,
      handoverDate: handoverDate || '',
      submissionDate: submissionDate || '',
      receivedDate: receivedDate || '',
      paymentDate: paymentDate || '',
      status,
      approvedBy: approvedBy.trim(),
      paymentMethod,
      remarks: remarks.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: editingId
        ? bills.find((b) => b.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    onSaveBill(payload);
    resetForm();
  };

  // PDF Individual Bill Generation
  const downloadBillPDF = (b: BillItem) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const margin = 15;
    let y = 0;

    // Header Band
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setFillColor(79, 70, 229); // indigo
    doc.rect(0, 30, pageW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BLACK BANK PLC', margin, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text('Billing & Service Management Suite', margin, 19);
    doc.text('Head Office, Dhaka, Bangladesh | +880 1234 567890', margin, 24);

    // Right header metadata
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('BILL RECORD', pageW - margin, 12, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(200, 210, 230);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 17, { align: 'right' });
    doc.text(`Reference: ${b.billNumber}`, pageW - margin, 22, { align: 'right' });

    y = 42;

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BILL DETAILS', margin, y);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.8);
    doc.line(margin, y + 2, margin + 40, y + 2);
    y += 10;

    // Amount Summary Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageW - 2 * margin, 18, 3, 3, 'FD');

    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('TOTAL BILL AMOUNT (BDT)', margin + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`BDT ${(b.amount || 0).toLocaleString('en-IN')}`, margin + 4, y + 14);

    // Status badge on right
    const statusColor: Record<string, [number, number, number]> = {
      Paid: [22, 163, 74],
      Submitted: [37, 99, 235],
      Pending: [245, 158, 11],
      Partial: [234, 88, 12],
    };
    const color = statusColor[b.status] || [100, 100, 100];
    doc.setFillColor(...color);
    doc.roundedRect(pageW - margin - 40, y + 4, 36, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text((b.status || 'PENDING').toUpperCase(), pageW - margin - 22, y + 10.5, { align: 'center' });

    y += 26;

    // Helper: section header
    const sectionHeader = (title: string) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(79, 70, 229);
      doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 10;
    };

    // Helper: field row
    const fieldRow = (k1: string, v1: string, k2?: string, v2?: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(k1, margin + 2, y);
      if (k2) doc.text(k2, pageW / 2 + 2, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(String(v1 || '—'), margin + 2, y + 5);
      if (k2) doc.text(String(v2 || '—'), pageW / 2 + 2, y + 5);

      y += 11;
    };

    // Bill Information
    sectionHeader('Bill Information');
    fieldRow('Bill Number', b.billNumber, 'Invoice Number', b.invoiceNumber || '—');
    fieldRow('Vendor / Company', b.vendor || '—', 'Bill Type', b.billType);
    y += 2;

    // Client Information
    sectionHeader('Client Information');
    fieldRow('Client Name', b.client, 'Client Location', b.clientLocation);
    if (b.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Description / Work Details', margin + 2, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const descLines = doc.splitTextToSize(b.description, pageW - 2 * margin - 4);
      doc.text(descLines, margin + 2, y);
      y += descLines.length * 4.5 + 4;
    }
    y += 2;

    // Important Dates
    sectionHeader('Important Dates');
    fieldRow('Bill Handover Date', b.handoverDate || '—', 'Bill Submission Date', b.submissionDate || '—');
    fieldRow('Bill Receive Date', b.receivedDate || '—', 'Payment Date', b.paymentDate || '—');
    y += 2;

    // Payment & Approval
    sectionHeader('Payment & Approval');
    fieldRow('Payment Method', b.paymentMethod || '—', 'Approved By', b.approvedBy || '—');
    y += 2;

    // Remarks
    if (b.remarks) {
      sectionHeader('Remarks');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(b.remarks, pageW - 2 * margin - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 4;
    }

    // Signatures
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y = 255;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 60, y);
    doc.line(pageW - margin - 60, y, pageW - margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared By', margin, y + 4);
    doc.text('Authorized Signature', pageW - margin - 60, y + 4);

    // Footer
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 288, pageW, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Black Bank PLC · Corporate Billing Management', margin, 293.5);
    doc.text('Computer-generated document', pageW - margin, 293.5, { align: 'right' });

    doc.save(`${b.billNumber}.pdf`);
  };

  // Filtered Bills for side list
  const filteredBills = bills.filter((b) => {
    if (filterType !== 'ALL' && b.billType !== filterType) return false;
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        b.billNumber.toLowerCase().includes(q) ||
        (b.invoiceNumber || '').toLowerCase().includes(q) ||
        (b.vendor || '').toLowerCase().includes(q) ||
        (b.client || '').toLowerCase().includes(q) ||
        (b.clientLocation || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Bill Tracker
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Corporate billing management, entry, PDF invoices, and payment tracking.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToReport}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>View Bill Report & Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: Form (2/3) + Side List (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{editingId ? `Edit Bill: ${billNumber}` : 'Add New Bill'}</span>
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium transition cursor-pointer"
              >
                ✕ Cancel Edit
              </button>
            )}
          </div>

          {formError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError('')}
                className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Bill Identity */}
            <div>
              <div className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-3">
                1 · Bill Identity
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill Number (Auto)
                  </label>
                  <input
                    type="text"
                    value={billNumber}
                    readOnly
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Company
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Tech Solutions Ltd"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Client Information */}
            <div>
              <div className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800 mb-3">
                2 · Client Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Client Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalInput({
                            isOpen: true,
                            type: 'client',
                            value: '',
                            title: 'Add New Client Name',
                            placeholder: 'e.g. Standard Bank PLC',
                          });
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                      >
                        + Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (clients.length <= 1) {
                            setFormError('At least one client is required in the system.');
                            return;
                          }
                          setDeleteConfirm({
                            isOpen: true,
                            type: 'client',
                            name: client,
                          });
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        🗑 Del
                      </button>
                    </div>
                  </div>
                  <select
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {clients.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Client Location <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalInput({
                            isOpen: true,
                            type: 'location',
                            value: '',
                            title: 'Add New Client Location',
                            placeholder: 'e.g. Mirpur Branch',
                          });
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                      >
                        + Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (locations.length <= 1) {
                            setFormError('At least one location is required in the system.');
                            return;
                          }
                          setDeleteConfirm({
                            isOpen: true,
                            type: 'location',
                            name: clientLocation,
                          });
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        🗑 Del
                      </button>
                    </div>
                  </div>
                  <select
                    value={clientLocation}
                    onChange={(e) => setClientLocation(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Work Details
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of work done, equipment installed or serviced..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bill Category & Amount */}
            <div>
              <div className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
                3 · Bill Category & Amount
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bill Type / Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalInput({
                            isOpen: true,
                            type: 'category',
                            value: '',
                            title: 'Add New Bill Category',
                            placeholder: 'e.g. Hardware Replacement',
                          });
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                      >
                        + Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (categories.length <= 1) {
                            setFormError('At least one category is required in the system.');
                            return;
                          }
                          setDeleteConfirm({
                            isOpen: true,
                            type: 'category',
                            name: billType,
                          });
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        🗑 Del
                      </button>
                    </div>
                  </div>
                  <select
                    value={billType}
                    onChange={(e) => setBillType(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill Amount (৳ BDT) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Important Dates */}
            <div>
              <div className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-3">
                4 · Important Dates
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Handover Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={handoverDate}
                    onChange={(e) => setHandoverDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receive Date
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Status & Notes */}
            <div>
              <div className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-3">
                5 · Status & Notes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Submitted">📤 Submitted</option>
                    <option value="Partial">🔶 Partial</option>
                    <option value="Paid">✅ Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approved By
                  </label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    placeholder="e.g. Mr. Rahman / Manager"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any internal approval notes, invoice discrepancies, or reference remarks..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingId ? 'Update Bill' : 'Save Bill'}</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs cursor-pointer transition"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Side Panel: Quick List & Search */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bill, invoice, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Quick List Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Saved Bills</span>
                <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-full font-mono text-[10px]">
                  {filteredBills.length}
                </span>
              </span>
              <button
                onClick={onNavigateToReport}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredBills.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No bills found matching filters.
                </div>
              ) : (
                filteredBills.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 bg-slate-50/60 dark:bg-slate-800/40 transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 truncate max-w-[170px]">
                        {b.billNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : b.status === 'Submitted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
                            : b.status === 'Partial'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {b.status === 'Paid'
                          ? '✅ Paid'
                          : b.status === 'Submitted'
                          ? '📤 Submitted'
                          : b.status === 'Partial'
                          ? '🔶 Partial'
                          : '⏳ Pending'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {b.client} · {b.clientLocation}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                      <span className="truncate max-w-[140px]">{b.billType}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{Number(b.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      H/O: {b.handoverDate || '—'}
                      {b.submissionDate ? ` · Sub: ${b.submissionDate}` : ''}
                    </div>

                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setViewingBill(b)}
                        className="flex-1 py-1 px-1.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-bold hover:bg-blue-100 cursor-pointer flex items-center justify-center gap-1"
                        title="View Full Details"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditBill(b)}
                        className="flex-1 py-1 px-1.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-100 cursor-pointer flex items-center justify-center gap-1"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadBillPDF(b)}
                        className="flex-1 py-1 px-1.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-1"
                        title="Download Corporate PDF"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmConfig({
                            isOpen: true,
                            billId: b.id,
                            title: 'Delete Bill Record',
                            message: `Are you sure you want to permanently delete bill "${b.billNumber}"?`,
                          })
                        }
                        className="py-1 px-2 rounded bg-slate-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-400 text-[10px] font-bold hover:bg-rose-50 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Bill Details Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  Bill Reference
                </span>
                <h3 className="text-base font-bold font-mono">{viewingBill.billNumber}</h3>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Amount Banner */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                    Total Amount
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                    ৳{Number(viewingBill.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    viewingBill.status === 'Paid'
                      ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                      : viewingBill.status === 'Submitted'
                      ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                      : viewingBill.status === 'Partial'
                      ? 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100'
                      : 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                  }`}
                >
                  {viewingBill.status}
                </span>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Invoice Number</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.invoiceNumber || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Vendor</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.vendor || '—'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Client</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.client}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.clientLocation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {viewingBill.billType}
                  </p>
                </div>

                {viewingBill.description && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Description</span>
                    <p className="font-normal text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">
                      {viewingBill.description}
                    </p>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Handover Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.handoverDate || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Submission Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.submissionDate || '—'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Receive Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.receivedDate || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.paymentDate || '—'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Method</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.paymentMethod || '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Approved By</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingBill.approvedBy || '—'}
                  </p>
                </div>

                {viewingBill.remarks && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Remarks</span>
                    <p className="font-normal text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">
                      {viewingBill.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  downloadBillPDF(viewingBill);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingBill(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding client / location / category */}
      {modalInput.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{modalInput.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalInput((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={modalInput.placeholder}
                  value={modalInput.value}
                  onChange={(e) => setModalInput((prev) => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveModalInput();
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalInput((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalInput}
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for deleting client / location / category */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Delete {deleteConfirm.type === 'client' ? 'Client' : deleteConfirm.type === 'location' ? 'Location' : 'Category'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">"{deleteConfirm.name}"</strong>?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMeta}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {confirmConfig.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{confirmConfig.message}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBill(confirmConfig.billId);
                  setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
