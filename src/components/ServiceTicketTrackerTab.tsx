import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  FileSpreadsheet,
  FileText,
  FileDown,
  User,
  Phone,
  Tag,
  DollarSign,
  Truck,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadStyledExcel, getActiveSystemBranding, triggerDownload } from '../utils/excelExport';
import { ServiceTicketItem } from '../types';

export const STANDARD_SERVICE_PRODUCTS = [
  { name: 'Battery & Power Management Circuit', price: '1200' },
  { name: 'Backup Battery', price: '840' },
  { name: 'Power Protection Circuit', price: '600' },
  { name: 'RTC Clock', price: '540' },
  { name: 'Display Unit', price: '900' },
  { name: 'GPRS Network Communication Module', price: '1320' },
  { name: 'RFID Module (125KHz)', price: '1080' },
  { name: 'Fingerprint Module', price: '3720' },
  { name: 'Memory Chip', price: '660' },
  { name: 'Mainboard', price: '5400' },
  { name: 'Switch', price: '240' },
  { name: 'Button', price: '240' },
  { name: 'Cables', price: '240' },
  { name: 'Relay', price: '240' },
  { name: 'Small Components', price: '240' },
  { name: 'Front Cover (Top Plate)', price: '420' },
  { name: 'Door Lock Hub', price: '1380' },
  { name: 'SMPS Adapter (12V 2A)', price: '660' },
];

export const DEFAULT_ISSUE_TYPES = [
  'Sim Connectivity',
  'Display Damage',
  'Beeper Problem',
  'Location Shift',
  'Power Issue',
  'Push Button',
  'Debug Mode',
  'Sensor',
];

export const LOCATION_TYPES = [
  'Main Branch',
  'Sub Branch',
  'Sepal Tower',
  'Pinacle Tower',
  'Anik Tower',
  'Nina Kabba',
  'Rajuk Parking',
  'DC',
  'DR',
  'DPDC',
  'ROC',
  'ADC',
  'SME',
];

interface ServiceTicketTrackerTabProps {
  tickets: ServiceTicketItem[];
  onSaveTicket: (ticket: ServiceTicketItem) => void;
  onDeleteTicket: (id: string) => void;
  onNavigateToReport: () => void;
  editTicket?: ServiceTicketItem | null;
  onClearEditTicket?: () => void;
}

export const ServiceTicketTrackerTab: React.FC<ServiceTicketTrackerTabProps> = ({
  tickets,
  onSaveTicket,
  onDeleteTicket,
  onNavigateToReport,
  editTicket,
  onClearEditTicket,
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const generateIssueNumber = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `ISS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
      d.getHours()
    )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // 1 · Ticket Identity
  const [issueNumber, setIssueNumber] = useState(generateIssueNumber());
  const [odooId, setOdooId] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // 2 · Client & Device
  const [client, setClient] = useState('Black Bank PLC');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [locationType, setLocationType] = useState('Main Branch');
  const [deviceId, setDeviceId] = useState('');
  const [productSelect, setProductSelect] = useState('');
  const [productCustom, setProductCustom] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [segment, setSegment] = useState('Corporate');
  const [kam, setKam] = useState('');

  // 3 · Dates & SLA
  const [requestDate, setRequestDate] = useState(getTodayDate());
  const [requestTime, setRequestTime] = useState(getCurrentTime());
  const [plannedDate, setPlannedDate] = useState(getTodayDate());
  const [serviceDate, setServiceDate] = useState('');
  const [slaThreshold, setSlaThreshold] = useState<number>(3);

  // 4 · Issue Details
  const [availableIssues, setAvailableIssues] = useState<string[]>(DEFAULT_ISSUE_TYPES);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [newIssueInput, setNewIssueInput] = useState('');
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [priority, setPriority] = useState<string>('Medium');
  const [status, setStatus] = useState<string>('Open');
  const [replace, setReplace] = useState<string>('No');
  const [replaceDeviceId, setReplaceDeviceId] = useState('');

  // 5 · Operations & Assignment
  const [assignPerson, setAssignPerson] = useState('');
  const [accessories, setAccessories] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('Onsite');
  const [challanBy, setChallanBy] = useState('');
  const [handedOverTo, setHandedOverTo] = useState('');
  const [unitQty, setUnitQty] = useState<number>(1);

  // 6 · Billing
  const [invoiceHandover, setInvoiceHandover] = useState('No');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [vendorBill, setVendorBill] = useState('');

  // 7 · Notes
  const [remarks, setRemarks] = useState('');
  const [visitEmail, setVisitEmail] = useState('');
  const [comments, setComments] = useState('');

  // View modal for preview
  const [viewTicketModal, setViewTicketModal] = useState<ServiceTicketItem | null>(null);

  // Dynamic SLA Calculation
  const { resolutionDays, slaStatus } = useMemo(() => {
    if (!requestDate) return { resolutionDays: '', slaStatus: 'Pending' };
    const end = serviceDate || getTodayDate();
    const req = new Date(requestDate);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - req.getTime();
    const diffDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    if (!serviceDate) {
      return { resolutionDays: diffDays, slaStatus: 'Pending' };
    }
    if (diffDays <= slaThreshold) {
      return { resolutionDays: diffDays, slaStatus: 'Within SLA' };
    }
    return { resolutionDays: diffDays, slaStatus: 'Breached' };
  }, [requestDate, serviceDate, slaThreshold]);

  // Load ticket for edit if provided via props
  useEffect(() => {
    if (editTicket) {
      populateFormForEdit(editTicket);
    }
  }, [editTicket]);

  const populateFormForEdit = (t: ServiceTicketItem) => {
    setEditingId(t.id);
    setIssueNumber(t.issueNumber);
    setOdooId(t.odooId || '');
    setEmailFrom(t.emailFrom || '');
    setEmailSubject(t.emailSubject || '');
    setClient(t.client || 'Black Bank PLC');
    setContactPerson(t.contactPerson || '');
    setContactNumber(t.contactNumber || '');
    setDistrict(t.district || 'Dhaka');
    setAddress(t.address || '');
    setDeviceLocation(t.deviceLocation || '');
    setLocationType(t.locationType || 'Main Branch');
    setDeviceId(t.deviceId || '');

    // Product handling
    const standardMatch = STANDARD_SERVICE_PRODUCTS.find((p) => p.name === t.product);
    if (standardMatch) {
      setProductSelect(standardMatch.name);
      setProductCustom('');
      setProductPrice(standardMatch.price);
    } else if (t.product) {
      setProductSelect('__other__');
      setProductCustom(t.product);
      setProductPrice(t.productPrice || '');
    } else {
      setProductSelect('');
      setProductCustom('');
      setProductPrice('');
    }

    setSegment(t.segment || 'Corporate');
    setKam(t.kam || '');
    setRequestDate(t.requestDate || getTodayDate());
    setRequestTime(t.requestTime || getCurrentTime());
    setPlannedDate(t.plannedDate || getTodayDate());
    setServiceDate(t.serviceDate || '');
    setSlaThreshold(t.slaThreshold || 3);

    // Issues
    const parsedIssues = (t.issues || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setSelectedIssues(parsedIssues);
    // ensure available issues contains any custom issue
    parsedIssues.forEach((iss) => {
      if (!availableIssues.includes(iss)) {
        setAvailableIssues((prev) => [...prev, iss]);
      }
    });

    setPriority(t.priority || 'Medium');
    setStatus(t.status || 'Open');
    setReplace(t.replace || 'No');
    setReplaceDeviceId(t.replaceDeviceId || '');
    setAssignPerson(t.assignPerson || '');
    setAccessories(t.accessories || '');
    setDeliveryOption(t.deliveryOption || 'Onsite');
    setChallanBy(t.challanBy || '');
    setHandedOverTo(t.handedOverTo || '');
    setUnitQty(t.unitQty || 1);
    setInvoiceHandover(t.invoiceHandover || 'No');
    setPaymentMethod(t.paymentMethod || 'Cash');
    setVendorBill(t.vendorBill || '');
    setRemarks(t.remarks || '');
    setVisitEmail(t.visitEmail || '');
    setComments(t.comments || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductChange = (val: string) => {
    setProductSelect(val);
    if (val === '__other__') {
      setProductCustom('');
      setProductPrice('');
    } else if (val) {
      const found = STANDARD_SERVICE_PRODUCTS.find((p) => p.name === val);
      if (found) {
        setProductCustom('');
        setProductPrice(found.price);
      }
    } else {
      setProductCustom('');
      setProductPrice('');
    }
  };

  const handleToggleIssue = (issueName: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issueName) ? prev.filter((i) => i !== issueName) : [...prev, issueName]
    );
  };

  const handleAddNewIssueType = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newIssueInput.trim();
    if (!clean) return;
    if (!availableIssues.includes(clean)) {
      setAvailableIssues((prev) => [...prev, clean]);
    }
    if (!selectedIssues.includes(clean)) {
      setSelectedIssues((prev) => [...prev, clean]);
    }
    setNewIssueInput('');
    setShowAddIssueModal(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormError('');
    setIssueNumber(generateIssueNumber());
    setOdooId('');
    setEmailFrom('');
    setEmailSubject('');
    setClient('Black Bank PLC');
    setContactPerson('');
    setContactNumber('');
    setDistrict('Dhaka');
    setAddress('');
    setDeviceLocation('');
    setLocationType('Main Branch');
    setDeviceId('');
    setProductSelect('');
    setProductCustom('');
    setProductPrice('');
    setSegment('Corporate');
    setKam('');
    setRequestDate(getTodayDate());
    setRequestTime(getCurrentTime());
    setPlannedDate(getTodayDate());
    setServiceDate('');
    setSlaThreshold(3);
    setSelectedIssues([]);
    setPriority('Medium');
    setStatus('Open');
    setReplace('No');
    setReplaceDeviceId('');
    setAssignPerson('');
    setAccessories('');
    setDeliveryOption('Onsite');
    setChallanBy('');
    setHandedOverTo('');
    setUnitQty(1);
    setInvoiceHandover('No');
    setPaymentMethod('Cash');
    setVendorBill('');
    setRemarks('');
    setVisitEmail('');
    setComments('');

    if (onClearEditTicket) onClearEditTicket();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!odooId.trim()) {
      setFormError('Odoo ID is required.');
      return;
    }
    if (!client.trim()) {
      setFormError('Client Name is required.');
      return;
    }
    if (!contactPerson.trim() || !contactNumber.trim()) {
      setFormError('Contact Person and Contact Number are required.');
      return;
    }
    if (!address.trim() || !deviceLocation.trim()) {
      setFormError('Address and Device Location are required.');
      return;
    }
    if (!deviceId.trim()) {
      setFormError('Device ID is required.');
      return;
    }
    if (!productSelect) {
      setFormError('Product is required.');
      return;
    }
    if (productSelect === '__other__' && !productCustom.trim()) {
      setFormError('Please enter custom product name.');
      return;
    }
    if (selectedIssues.length === 0) {
      setFormError('Select at least one Issue Type.');
      return;
    }
    if (replace === 'Yes' && !replaceDeviceId.trim()) {
      setFormError('Please specify the New / Replace Device ID.');
      return;
    }
    if (!assignPerson.trim()) {
      setFormError('Assign Person / Technician is required.');
      return;
    }

    const finalProduct = productSelect === '__other__' ? productCustom.trim() : productSelect;

    const newTicket: ServiceTicketItem = {
      id: editingId || issueNumber || `ISS-${Date.now()}`,
      issueNumber,
      odooId: odooId.trim(),
      emailFrom: emailFrom.trim(),
      emailSubject: emailSubject.trim(),
      client: client.trim(),
      contactPerson: contactPerson.trim(),
      contactNumber: contactNumber.trim(),
      district: district.trim(),
      address: address.trim(),
      deviceLocation: deviceLocation.trim(),
      locationType,
      deviceId: deviceId.trim(),
      product: finalProduct,
      productPrice: productPrice.trim(),
      segment,
      kam: kam.trim(),
      requestDate,
      requestTime,
      plannedDate,
      serviceDate,
      slaThreshold: Number(slaThreshold) || 3,
      resolutionDays: String(resolutionDays),
      slaStatus,
      issues: selectedIssues.join(', '),
      priority,
      status,
      replace,
      replaceDeviceId: replace === 'Yes' ? replaceDeviceId.trim() : 'N/A',
      assignPerson: assignPerson.trim(),
      accessories: accessories.trim(),
      deliveryOption,
      challanBy: challanBy.trim(),
      handedOverTo: handedOverTo.trim(),
      unitQty: Number(unitQty) || 1,
      invoiceHandover,
      paymentMethod,
      vendorBill: vendorBill.trim(),
      remarks: remarks.trim(),
      visitEmail: visitEmail.trim(),
      comments: comments.trim(),
      createdAt: editingId
        ? tickets.find((t) => t.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTicket(newTicket);
    setToastMessage(
      editingId
        ? `Ticket ${issueNumber} updated successfully!`
        : `Ticket ${issueNumber} created successfully!`
    );
    resetForm();
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Export All Saved Tickets to Styled Excel
  const handleExportExcel = () => {
    if (tickets.length === 0) {
      setToastMessage('No tickets found to export.');
      return;
    }

    try {
      const headers = [
        'Issue Number',
        'Odoo ID',
        'Client',
        'Device Location',
        'Device ID',
        'Product',
        'Price (BDT)',
        'Request Date',
        'Priority',
        'SLA Status',
        'Status',
        'Replace',
        'Replace Device ID',
        'Assign Person',
        'Payment Method',
        'Remarks',
      ];

      const rows = tickets.map((t) => [
        t.issueNumber,
        t.odooId || '-',
        t.client,
        t.deviceLocation,
        t.deviceId,
        t.product,
        t.productPrice || '-',
        t.requestDate,
        t.priority,
        t.slaStatus,
        t.status,
        t.replace,
        t.replaceDeviceId || '-',
        t.assignPerson,
        t.paymentMethod || 'Cash',
        t.remarks || '-',
      ]);

      downloadStyledExcel({
        title: 'SERVICE TICKET TRACKER REPORT',
        subtitle: `Recorded Hardware & Software Support Tickets (${tickets.length} Records)`,
        filename: `Service_Tickets_Tracker_${new Date().toISOString().split('T')[0]}`,
        headers,
        data: rows,
        summaryCards: [
          { label: 'Total Tickets', value: tickets.length },
          { label: 'Completed', value: tickets.filter((t) => t.status === 'Done').length },
          { label: 'In Progress', value: tickets.filter((t) => t.status === 'In Progress').length },
          { label: 'SLA Breached', value: tickets.filter((t) => t.slaStatus === 'Breached').length },
        ],
      });
      setToastMessage('Excel report (.xlsx) exported successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      setToastMessage('Failed to export Excel file. Please try again.');
    }
  };

  // Export Complete Service Ticket Tracker Register as PDF
  const handleExportPDF = () => {
    if (tickets.length === 0) {
      setToastMessage('No tickets found to export.');
      return;
    }

    try {
      const branding = getActiveSystemBranding();
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageW = 297;
      const margin = 12;

      // Header band
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageW, 26, 'F');
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 26, pageW, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(branding.appName.toUpperCase() || 'BLACK BANK PLC', margin, 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 210, 230);
      doc.text(branding.tagline || 'Service Ticket Tracker · Operational Management', margin, 18);

      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('SERVICE TICKET TRACKER REGISTER', pageW - margin, 10, { align: 'right' });
      doc.setFontSize(7);
      doc.setTextColor(200, 210, 230);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 15, { align: 'right' });
      doc.text(
        `Total Tickets: ${tickets.length}  |  Done: ${
          tickets.filter((t) => t.status === 'Done').length
        }  |  Breached: ${tickets.filter((t) => t.slaStatus === 'Breached').length}`,
        pageW - margin,
        20,
        { align: 'right' }
      );

      const body = tickets.map((t) => [
        t.issueNumber,
        t.odooId || '-',
        t.client,
        t.deviceLocation,
        t.deviceId,
        t.product,
        t.requestDate,
        t.priority,
        t.slaStatus,
        t.status,
        t.assignPerson,
      ]);

      autoTable(doc, {
        startY: 32,
        head: [
          [
            'Issue #',
            'Odoo ID',
            'Client',
            'Location',
            'Device ID',
            'Product',
            'Request Date',
            'Priority',
            'SLA',
            'Status',
            'Assignee',
          ],
        ],
        body,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 32 },
          1: { cellWidth: 20 },
          4: { fontStyle: 'bold' },
          8: { halign: 'center' },
          9: { halign: 'center', fontStyle: 'bold' },
        },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 200, pageW, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text('Black Bank PLC · Support Operations', margin, 206);
        doc.text(
          `Page ${i} of ${pageCount}  |  Computer-generated document`,
          pageW - margin,
          206,
          { align: 'right' }
        );
      }

      const pdfBlob = doc.output('blob');
      triggerDownload(pdfBlob, `Service_Tickets_Tracker_${new Date().toISOString().split('T')[0]}.pdf`);
      setToastMessage('PDF report (.pdf) exported successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setToastMessage('Failed to export PDF file. Please try again.');
    }
  };

  // PDF Generator for Single Ticket
  const downloadSingleTicketPDF = (t: ServiceTicketItem) => {
    try {
      const branding = getActiveSystemBranding();
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const margin = 14;
      let y = 18;

      // Header band
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageW, 24, 'F');
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 24, pageW, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${(branding.appName || 'BLACK BANK PLC').toUpperCase()} — SERVICE TICKET`, margin, 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(branding.tagline || 'Hardware Maintenance & On-Site Support Operations', margin, 18);

      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`TICKET: ${t.issueNumber}`, pageW - margin, 12, { align: 'right' });
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text(`Odoo ID: ${t.odooId || '-'}  |  Date: ${t.requestDate}`, pageW - margin, 18, {
        align: 'right',
      });

      y = 33;
      doc.setTextColor(30, 41, 59);

      const renderSection = (title: string, pairs: [string, string | number | undefined][]) => {
        if (y > 250) {
          doc.addPage();
          y = 18;
        }
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageW - 2 * margin, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229);
        doc.text(title.toUpperCase(), margin + 2.5, y + 4.5);
        y += 9;

        doc.setFontSize(8);
        pairs.forEach(([label, val]) => {
          if (y > 275) {
            doc.addPage();
            y = 18;
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text(String(label) + ':', margin + 2.5, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          const strVal = String(val || '—');
          const split = doc.splitTextToSize(strVal, pageW - margin - 60);
          doc.text(split, margin + 45, y);
          y += Math.max(4.5, split.length * 4);
        });
        y += 2.5;
      };

      renderSection('1 · Ticket Identity', [
        ['Issue Number', t.issueNumber],
        ['Odoo Ticket ID', t.odooId],
        ['Email From', t.emailFrom],
        ['Email Subject', t.emailSubject],
      ]);

      renderSection('2 · Client & Device Details', [
        ['Client Name', t.client],
        ['Contact Person', t.contactPerson],
        ['Contact Number', t.contactNumber],
        ['District', t.district],
        ['Address / Premises', t.address],
        ['Device Location', t.deviceLocation],
        ['Location Type', t.locationType],
        ['Device ID', t.deviceId],
        ['Product / Component', t.product + (t.productPrice ? ` (BDT ${t.productPrice})` : '')],
        ['Segment / KAM', `${t.segment || '-'} / ${t.kam || '-'}`],
      ]);

      renderSection('3 · Dates & SLA Performance', [
        ['Request Date & Time', `${t.requestDate} ${t.requestTime || ''}`],
        ['Planned Provide Date', t.plannedDate],
        ['Service Provide Date', t.serviceDate || 'Pending Delivery'],
        ['SLA Threshold', `${t.slaThreshold} Days`],
        ['Resolution Days', `${t.resolutionDays || 0} Days`],
        ['SLA Compliance', t.slaStatus],
      ]);

      renderSection('4 · Issue Specification', [
        ['Issue Type(s)', t.issues],
        ['Priority', t.priority],
        ['Ticket Status', t.status],
        ['Device Replaced?', t.replace],
        ['Replacement Device ID', t.replaceDeviceId || 'N/A'],
      ]);

      renderSection('5 · Operations & Logistics', [
        ['Technician / Assignee', t.assignPerson],
        ['Accessories Provided', t.accessories || 'None'],
        ['Delivery Mode', t.deliveryOption],
        ['Challan Received By', t.challanBy],
        ['Handed Over To', t.handedOverTo],
        ['Unit Quantity', t.unitQty || 1],
      ]);

      renderSection('6 · Billing & Commercials', [
        ['Invoice Handover', t.invoiceHandover],
        ['Payment Method', t.paymentMethod],
        ['Vendor Bill Reference', t.vendorBill || 'N/A'],
      ]);

      renderSection('7 · Notes & Remarks', [
        ['Remarks', t.remarks],
        ['Visit Email Details', t.visitEmail],
        ['Comments', t.comments],
      ]);

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Black Bank PLC · Support Operations  |  Generated on ${new Date().toLocaleString()}`,
          margin,
          290
        );
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, 290, { align: 'right' });
      }

      const pdfBlob = doc.output('blob');
      triggerDownload(pdfBlob, `${t.issueNumber}_Report.pdf`);
      setToastMessage(`Ticket ${t.issueNumber} PDF downloaded successfully!`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to export single ticket PDF:', err);
      setToastMessage('Failed to download ticket PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Service Ticket Tracker</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Log, track, SLA monitor, and dispatch hardware/software service tickets for bank branches.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Export all tickets to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Export all tickets to PDF (.pdf)"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToReport}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>View Service Ticket Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Form (2 cols) + Saved List (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM PANEL */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? `✏️ Edit Service Ticket — ${issueNumber}` : '📝 Add New Service Ticket'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1 · Ticket Identity */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>1 · Ticket Identity</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Issue Number (Auto) *
                  </label>
                  <input
                    type="text"
                    value={issueNumber}
                    readOnly
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Odoo ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ODOO-88219"
                    value={odooId}
                    onChange={(e) => setOdooId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Email From
                  </label>
                  <input
                    type="email"
                    placeholder="sender@bank.com"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Ticket raised for device restart / replacement..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 2 · Client & Device */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>2 · Client & Device Details</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rahman"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Address / Premises *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 12, Road 4, Sector 7, Uttara"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Device Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulistan Branch / 2nd Floor"
                    value={deviceLocation}
                    onChange={(e) => setDeviceLocation(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Location Type *
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {LOCATION_TYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Device ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEV-1029"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Product Component & Price *
                    </label>
                    {productPrice && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        Base Rate: ৳{productPrice}
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={productSelect}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Select Product Component --</option>
                    {STANDARD_SERVICE_PRODUCTS.map((prod) => (
                      <option key={prod.name} value={prod.name}>
                        {prod.name} — ৳{prod.price}
                      </option>
                    ))}
                    <option value="__other__">Other (Type manually)</option>
                  </select>

                  {productSelect === '__other__' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter custom product name"
                        value={productCustom}
                        onChange={(e) => setProductCustom(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Unit price (৳)"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Segment
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option>Corporate</option>
                    <option>Retail</option>
                    <option>SME</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Key Account Manager (KAM)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KAM Tanvir"
                    value={kam}
                    onChange={(e) => setKam(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 3 · Dates & SLA */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>3 · Dates & SLA Performance</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Request Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Request Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Planned Provide Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Service Provide Date
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    SLA Threshold (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={slaThreshold}
                    onChange={(e) => setSlaThreshold(Number(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Resolution Time (Auto)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${resolutionDays} day(s)`}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    SLA Status (Auto)
                  </label>
                  <div
                    className={`w-full rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-between border ${
                      slaStatus === 'Within SLA'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                        : slaStatus === 'Breached'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <span>{slaStatus}</span>
                    <span className="text-[10px] font-mono font-normal">
                      Threshold: {slaThreshold}d
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 · Issue Details */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>4 · Issue Specification</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddIssueModal(true)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                >
                  + Add New Issue Type
                </button>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Issue Types * (Multi-select)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl max-h-36 overflow-y-auto">
                    {availableIssues.map((iss) => {
                      const isChecked = selectedIssues.includes(iss);
                      return (
                        <label
                          key={iss}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                            isChecked
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleIssue(iss)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate" title={iss}>
                            {iss}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Issue Priority *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Low">🟢 Low</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="High">🟠 High</option>
                      <option value="Critical">🔴 Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Current Ticket Status *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Open">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Working">Working</option>
                      <option value="RMA">RMA</option>
                      <option value="Repairing">Repairing</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Replace Device? *
                    </label>
                    <select
                      value={replace}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReplace(val);
                        if (val !== 'Yes') {
                          setReplaceDeviceId('');
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                {replace === 'Yes' && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 shadow-xs space-y-1">
                    <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                      New / Replace Device ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DEV-NEW-2026-X"
                      value={replaceDeviceId}
                      onChange={(e) => setReplaceDeviceId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      Specify the serial number or ID of the replacement device.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 5 · Operations & Assignment */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-500" />
                <span>5 · Operations & Logistics</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Assign Person / Technician *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eng. Shakil"
                    value={assignPerson}
                    onChange={(e) => setAssignPerson(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Accessories
                  </label>
                  <input
                    type="text"
                    placeholder="Adapter, Cable, Battery..."
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Delivery Option
                  </label>
                  <select
                    value={deliveryOption}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option>Onsite</option>
                    <option>Courier</option>
                    <option>Hand Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Challan Received By
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Officer name"
                    value={challanBy}
                    onChange={(e) => setChallanBy(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Handed Over To
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Branch Executive"
                    value={handedOverTo}
                    onChange={(e) => setHandedOverTo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Unit Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unitQty}
                    onChange={(e) => setUnitQty(Number(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 6 · Billing (Optional) */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                <span>6 · Billing & Financials (Optional)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Invoice Handover
                  </label>
                  <select
                    value={invoiceHandover}
                    onChange={(e) => setInvoiceHandover(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>Bank Transfer</option>
                    <option>Online</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Vendor Bill Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VB-9901"
                    value={vendorBill}
                    onChange={(e) => setVendorBill(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 7 · Notes */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>7 · Notes & Remarks</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Internal observations..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Visit Email Details
                  </label>
                  <textarea
                    rows={2}
                    value={visitEmail}
                    onChange={(e) => setVisitEmail(e.target.value)}
                    placeholder="Confirmation correspondence..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Comments
                  </label>
                  <textarea
                    rows={2}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Customer feedback / resolution notes..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Update Service Ticket' : 'Save Service Ticket'}</span>
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RECENT SAVED TICKETS SIDE PANEL */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Saved Tickets ({tickets.length})
                </h3>
              </div>
              <button
                onClick={onNavigateToReport}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View All &rarr;
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-400 text-xs">
                <Wrench className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p>No service tickets recorded yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Fill out the form on the left to create your first ticket.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
                {tickets.slice(0, 15).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-400/50 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                          {t.issueNumber}
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {t.deviceId} · {t.client}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {t.deviceLocation}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          t.status === 'Done'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.status === 'Open'
                            ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="truncate max-w-[140px]">{t.issues}</span>
                      <span
                        className={`font-semibold ${
                          t.slaStatus === 'Within SLA'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : t.slaStatus === 'Breached'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {t.slaStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => setViewTicketModal(t)}
                        title="View Full Details"
                        className="flex-1 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => populateFormForEdit(t)}
                        title="Edit Ticket"
                        className="flex-1 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => downloadSingleTicketPDF(t)}
                        title="Download PDF"
                        className="flex-1 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => onDeleteTicket(t.id)}
                        title="Delete Ticket"
                        className="p-1 rounded bg-slate-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Issue Modal */}
      {showAddIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add New Issue Type
              </h3>
              <button
                onClick={() => setShowAddIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddNewIssueType} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Issue Type Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Firmware Glitch, Keypad Jam..."
                  value={newIssueInput}
                  onChange={(e) => setNewIssueInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIssueModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  Add Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details View Modal */}
      {viewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Ticket Overview — {viewTicketModal.issueNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewTicketModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  1 · Ticket Identity
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Issue #:</span> {viewTicketModal.issueNumber}
                  </div>
                  <div>
                    <span className="text-slate-400">Odoo ID:</span> {viewTicketModal.odooId}
                  </div>
                  <div>
                    <span className="text-slate-400">Email From:</span>{' '}
                    {viewTicketModal.emailFrom || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Subject:</span>{' '}
                    {viewTicketModal.emailSubject || '—'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  2 · Client & Device
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Client:</span> {viewTicketModal.client}
                  </div>
                  <div>
                    <span className="text-slate-400">Contact:</span>{' '}
                    {viewTicketModal.contactPerson} ({viewTicketModal.contactNumber})
                  </div>
                  <div>
                    <span className="text-slate-400">District / Premises:</span>{' '}
                    {viewTicketModal.district} · {viewTicketModal.address}
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span>{' '}
                    {viewTicketModal.deviceLocation} ({viewTicketModal.locationType})
                  </div>
                  <div>
                    <span className="text-slate-400">Device ID:</span> {viewTicketModal.deviceId}
                  </div>
                  <div>
                    <span className="text-slate-400">Product:</span> {viewTicketModal.product} (৳
                    {viewTicketModal.productPrice || '0'})
                  </div>
                  <div>
                    <span className="text-slate-400">Segment / KAM:</span>{' '}
                    {viewTicketModal.segment || '—'} / {viewTicketModal.kam || '—'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  3 · Dates & SLA
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Request:</span> {viewTicketModal.requestDate}{' '}
                    {viewTicketModal.requestTime}
                  </div>
                  <div>
                    <span className="text-slate-400">Planned Date:</span>{' '}
                    {viewTicketModal.plannedDate}
                  </div>
                  <div>
                    <span className="text-slate-400">Service Provided:</span>{' '}
                    {viewTicketModal.serviceDate || 'Pending'}
                  </div>
                  <div>
                    <span className="text-slate-400">SLA Status:</span>{' '}
                    <span
                      className={`font-bold ${
                        viewTicketModal.slaStatus === 'Within SLA'
                          ? 'text-emerald-600'
                          : viewTicketModal.slaStatus === 'Breached'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {viewTicketModal.slaStatus} ({viewTicketModal.resolutionDays}d /{' '}
                      {viewTicketModal.slaThreshold}d limit)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  4 · Issue & Replacement
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div className="col-span-2">
                    <span className="text-slate-400">Issues:</span> {viewTicketModal.issues}
                  </div>
                  <div>
                    <span className="text-slate-400">Priority:</span> {viewTicketModal.priority}
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span> {viewTicketModal.status}
                  </div>
                  <div>
                    <span className="text-slate-400">Replace Device:</span>{' '}
                    {viewTicketModal.replace}
                  </div>
                  <div>
                    <span className="text-slate-400">New Device ID:</span>{' '}
                    {viewTicketModal.replaceDeviceId || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                  5 · Operations & Billing
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Technician:</span>{' '}
                    {viewTicketModal.assignPerson}
                  </div>
                  <div>
                    <span className="text-slate-400">Delivery:</span>{' '}
                    {viewTicketModal.deliveryOption}
                  </div>
                  <div>
                    <span className="text-slate-400">Accessories:</span>{' '}
                    {viewTicketModal.accessories || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Handed Over To:</span>{' '}
                    {viewTicketModal.handedOverTo || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Payment:</span>{' '}
                    {viewTicketModal.paymentMethod} (Invoice: {viewTicketModal.invoiceHandover})
                  </div>
                  <div>
                    <span className="text-slate-400">Vendor Bill:</span>{' '}
                    {viewTicketModal.vendorBill || '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewTicketModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => downloadSingleTicketPDF(viewTicketModal)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
