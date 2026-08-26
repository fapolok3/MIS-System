import React, { useState, useRef } from 'react';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Printer,
  RotateCcw,
  Ticket as TicketIcon,
  FileCheck,
  FileText,
  Copy,
  Check,
  ArrowLeft,
  Wrench,
  Truck,
  UserCheck,
  AlertTriangle,
  Layers,
  Eye,
  Calendar,
  Box,
  Loader2,
  CheckCircle2,
  FileDown,
  Download,
} from 'lucide-react';
import { Device, IssueTrackerItem, Ticket } from '../types';

interface SupportTicketGeneratorTabProps {
  devices?: Device[];
  tickets?: Ticket[];
  issues?: IssueTrackerItem[];
  appLogo?: string;
  appName?: string;
}

export const SupportTicketGeneratorTab: React.FC<SupportTicketGeneratorTabProps> = ({
  devices = [],
  tickets = [],
  issues = [],
  appLogo = '',
  appName = '',
}) => {
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const generateTicketNumber = () => {
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `ST-${yyyymmdd}-${rand}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateStr;
  };

  // View state: 'entry' (form) or 'invoice' (generated document)
  const [currentView, setCurrentView] = useState<'entry' | 'invoice'>('entry');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  const [copied, setCopied] = useState(false);

  // Company details
  const [companyTitle, setCompanyTitle] = useState('Inovace Technologies Limited');
  const [companySub, setCompanySub] = useState(
    '18 Kazi Nazrul Islam Avenue, 2nd Floor,\nShahbagh, Dhaka-1000, Bangladesh\nSupport & Tech Communication Team\nPhone: +880 1708-123884 | Email: support@tipsoi.com'
  );

  // Section 1: Ticket Metadata
  const [odooTicketNo, setOdooTicketNo] = useState('');
  const [date, setDate] = useState(getTodayFormatted());
  const [supportTicketNo, setSupportTicketNo] = useState(generateTicketNumber());
  const [clientName, setClientName] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [manpowerNeeded, setManpowerNeeded] = useState<'Yes' | 'No' | ''>('No');
  const [priority, setPriority] = useState<'Low' | 'Mid' | 'High' | ''>('Mid');

  // Section 2: Information Checklist
  const [receiverNameChecked, setReceiverNameChecked] = useState(true);
  const [receiverName, setReceiverName] = useState('');
  const [designationChecked, setDesignationChecked] = useState(true);
  const [designation, setDesignation] = useState('');
  const [contactNoChecked, setContactNoChecked] = useState(true);
  const [contactNo, setContactNo] = useState('');
  const [emailChecked, setEmailChecked] = useState(true);
  const [email, setEmail] = useState('');
  const [courierDetailsChecked, setCourierDetailsChecked] = useState(false);
  const [courierDetails, setCourierDetails] = useState('');

  // Section 3: Problem Description
  const [problemDescription, setProblemDescription] = useState('');

  // Section 3: Hardware & Accessories Checklist
  const [hwDevice, setHwDevice] = useState(true);
  const [hwAdapter12V, setHwAdapter12V] = useState(true);
  const [hwMetalPlate, setHwMetalPlate] = useState(false);
  const [hwMount, setHwMount] = useState(false);
  const [hwScrew, setHwScrew] = useState(false);
  const [hwSilicon, setHwSilicon] = useState(false);
  const [hwDrillMachine, setHwDrillMachine] = useState(false);
  const [hwCable, setHwCable] = useState(false);
  const [hwChannelCasing, setHwChannelCasing] = useState(false);
  const [hwInsulationTape, setHwInsulationTape] = useState(false);
  const [hwFoamTape, setHwFoamTape] = useState(false);

  // Section 3: Courier Service Details Checklist
  const [courierGeneral, setCourierGeneral] = useState(false);
  const [courierSundarban, setCourierSundarban] = useState(false);
  const [courierPathao, setCourierPathao] = useState(false);
  const [trackingRefNo, setTrackingRefNo] = useState('');
  const [expectedClosingDate, setExpectedClosingDate] = useState('');

  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  // Direct, reliable Reset handler
  const handleReset = () => {
    setOdooTicketNo('');
    setDate(getTodayFormatted());
    setSupportTicketNo(generateTicketNumber());
    setClientName('');
    setOpportunity('');
    setManpowerNeeded('No');
    setPriority('Mid');

    setReceiverNameChecked(true);
    setReceiverName('');
    setDesignationChecked(true);
    setDesignation('');
    setContactNoChecked(true);
    setContactNo('');
    setEmailChecked(true);
    setEmail('');
    setCourierDetailsChecked(false);
    setCourierDetails('');

    setProblemDescription('');

    setHwDevice(true);
    setHwAdapter12V(true);
    setHwMetalPlate(false);
    setHwMount(false);
    setHwScrew(false);
    setHwSilicon(false);
    setHwDrillMachine(false);
    setHwCable(false);
    setHwChannelCasing(false);
    setHwInsulationTape(false);
    setHwFoamTape(false);

    setCourierGeneral(false);
    setCourierSundarban(false);
    setCourierPathao(false);
    setTrackingRefNo('');
    setExpectedClosingDate('');

    setResetToast(true);
    setTimeout(() => setResetToast(false), 2500);
  };

  // 2-second Loading generation trigger
  const handleGenerateTicket = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentView('invoice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  };

  // High-reliability Direct PDF Download via html-to-image & jsPDF (fully supports modern CSS & oklch)
  const handleDownloadPDF = async () => {
    const docElement = document.getElementById('printable-ticket-document');
    if (!docElement) return;

    try {
      setIsDownloadingPDF(true);

      // Render document cleanly to image with 2.5x pixel ratio for crisp print clarity
      const imgData = await toJpeg(docElement, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          margin: '0',
          backgroundColor: '#ffffff',
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210; // A4 standard width (mm)
      const pdfHeight = 297; // A4 standard height (mm)

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileName = `Support_Ticket_${supportTicketNo || 'Document'}.pdf`;
      pdf.save(fileName);

      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 3000);
    } catch (err) {
      console.error('PDF generation error, trying fallback method:', err);
      try {
        const fallbackImgData = await toPng(docElement, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(fallbackImgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`Support_Ticket_${supportTicketNo || 'Document'}.pdf`);
        setDownloadSuccessToast(true);
        setTimeout(() => setDownloadSuccessToast(false), 3000);
      } catch (fallbackErr) {
        console.error('All PDF generation methods failed, triggering print dialog:', fallbackErr);
        handlePrint();
      }
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // High-compatibility Direct Print Handler (with hidden iframe for sandboxed environments)
  const handlePrint = () => {
    const docElement = document.getElementById('printable-ticket-document');
    if (!docElement) {
      window.print();
      return;
    }

    try {
      // Remove any prior print iframe
      const oldFrame = document.getElementById('print-ticket-iframe');
      if (oldFrame) {
        oldFrame.remove();
      }

      const printFrame = document.createElement('iframe');
      printFrame.id = 'print-ticket-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '210mm';
      printFrame.style.height = '297mm';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (!frameDoc) {
        window.print();
        return;
      }

      const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      const customStyles = `
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 210mm;
          }
          .pdf-container {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm 10mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
        </style>
      `;

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Support_Ticket_${supportTicketNo || 'Document'}</title>
            <meta charset="utf-8" />
            ${styleTags}
            ${customStyles}
          </head>
          <body>
            ${docElement.outerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          } else {
            window.print();
          }
        } catch {
          window.print();
        }
      }, 400);
    } catch (err) {
      console.error('Frame print failed, triggering window.print():', err);
      window.print();
    }
  };

  const handleCopySummary = () => {
    const summary = `
========================================
TIPSOI SUPPORT TICKET INVOICE
========================================
Support Ticket No: ${supportTicketNo}
Odoo Ticket No: ${odooTicketNo || 'N/A'}
Date: ${date}
Client Name: ${clientName || 'N/A'}
Opportunity: ${opportunity || 'N/A'}
Priority: ${priority} | Manpower Needed: ${manpowerNeeded}

--- Contact Details ---
Receiver: ${receiverName || 'N/A'} (${designation || 'N/A'})
Phone: ${contactNo || 'N/A'} | Email: ${email || 'N/A'}
Courier Info: ${courierDetails || 'N/A'}

--- Problem Description ---
${problemDescription || 'None'}

--- Courier & Tracking ---
Courier: ${courierSundarban ? 'Sundarban' : courierPathao ? 'Pathao' : courierGeneral ? 'General' : 'N/A'}
Tracking Ref: ${trackingRefNo || 'N/A'}
Expected Closing: ${formatDateDisplay(expectedClosingDate) !== '—' ? formatDateDisplay(expectedClosingDate) : 'N/A'}
========================================
`.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Global CSS Styles for Printable Document & Clean White Checkboxes */}
      <style>{`
        /* Ticket Document Styling */
        .ticket-page-root {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          font-size: 8.5pt;
        }

        .pdf-container {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0 auto;
          padding: 8mm 10mm;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          position: relative;
          box-sizing: border-box;
          border-radius: 4px;
        }

        .watermark-layer {
          position: absolute;
          top: 250px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          text-align: center;
          opacity: 0.03;
          z-index: 0;
          pointer-events: none;
        }

        .watermark-svg {
          width: 240px;
          height: auto;
          margin: 0 auto;
        }

        .watermark-text {
          font-size: 30pt;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 6px;
          margin-top: 10px;
        }

        .content {
          position: relative;
          z-index: 1;
        }

        .header-container {
          width: 100%;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .header-table {
          width: 100%;
          border-collapse: collapse;
        }

        .company-title {
          font-size: 13pt;
          font-weight: 800;
          color: #0f172a !important;
          margin-bottom: 2px;
          outline: none;
        }

        .company-sub {
          font-size: 8pt;
          color: #475569 !important;
          line-height: 1.35;
          outline: none;
          white-space: pre-line;
        }

        .logo-text-wrapper {
          text-align: right;
        }

        .tipsoi-brand {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .logo-text {
          font-size: 20pt;
          font-weight: 900;
          color: #4f46e5;
          letter-spacing: -0.5px;
          display: inline-block;
          vertical-align: middle;
        }

        .document-badge {
          display: inline-block;
          background: #f8fafc;
          color: #4f46e5;
          border: 1px solid #e2e8f0;
          font-size: 7.5pt;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          margin-top: 4px;
        }

        .section-title {
          background-color: #f8fafc !important;
          color: #0f172a !important;
          border-left: 4px solid #4f46e5;
          font-size: 8.5pt;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 0 4px 4px 0;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .form-table, .info-checklist-table, .two-column-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }

        .form-table td, .info-checklist-table td {
          border: 1px solid #e2e8f0;
          padding: 4.5px 7px;
          vertical-align: middle;
        }

        .lbl {
          background-color: #f8fafc !important;
          font-weight: 600;
          color: #475569 !important;
          width: 20%;
          font-size: 8pt;
        }

        .val {
          width: 30%;
          background-color: #ffffff !important;
        }

        .ticket-input {
          width: 100%;
          border: 1px solid transparent;
          outline: none;
          font-family: inherit;
          font-size: 8pt;
          background: #f8fafc;
          color: #0f172a !important;
          padding: 3px 5px;
          border-radius: 3px;
          transition: background 0.15s, border-color 0.15s;
        }

        .ticket-input:focus {
          background: #ffffff;
          border: 1px solid #4f46e5;
        }

        /* Pure White Background Checkboxes for the Invoice (Anti-Dark Mode Leak) */
        .invoice-checkbox {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 13px !important;
          height: 13px !important;
          border: 1.5px solid #64748b !important;
          border-radius: 2.5px !important;
          background-color: #ffffff !important;
          display: inline-grid;
          place-content: center;
          margin: 0;
          margin-right: 5px;
          vertical-align: middle;
          cursor: pointer;
          position: relative;
        }

        .invoice-checkbox:checked {
          background-color: #ffffff !important;
          border-color: #4f46e5 !important;
        }

        .invoice-checkbox:checked::before {
          content: "";
          width: 7px;
          height: 4px;
          border-left: 2px solid #4f46e5;
          border-bottom: 2px solid #4f46e5;
          transform: rotate(-45deg) translate(0.5px, -0.5px);
          position: absolute;
          top: 2px;
          left: 2px;
        }

        .two-column-table > tbody > tr > td {
          width: 50%;
          vertical-align: top;
        }

        .column-box {
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: #ffffff !important;
          padding: 7px;
          min-height: 270px;
        }

        .column-header {
          color: #059669;
          font-size: 8.5pt;
          font-weight: 700;
          padding-bottom: 5px;
          margin-bottom: 6px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
        }

        .column-header.purple {
          color: #4f46e5;
        }

        .problem-textarea {
          width: 100%;
          height: 240px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          resize: none;
          line-height: 1.45;
          background: #ffffff !important;
          padding: 6px;
          font-family: inherit;
          font-size: 8pt;
          color: #0f172a !important;
          outline: none;
        }

        .problem-textarea:focus {
          border-color: #4f46e5;
        }

        .logistics-grid-table {
          width: 100%;
          border-collapse: collapse;
        }

        .logistics-grid-table td {
          padding: 3.5px 3px;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 8pt;
        }

        .checklist-item-title {
          font-weight: 500;
          color: #0f172a !important;
        }

        .sub-header {
          font-weight: 700;
          color: #475569 !important;
          background-color: #f8fafc !important;
          padding: 3px 6px;
          font-size: 7pt;
          text-transform: uppercase;
          border-radius: 3px;
          margin-top: 5px;
          margin-bottom: 3px;
        }

        .note-card {
          background-color: #eff6ff !important;
          border-left: 4px solid #3b82f6;
          padding: 6px 10px;
          font-size: 7.5pt;
          color: #1d4ed8 !important;
          border-radius: 0 4px 4px 0;
          margin-bottom: 10px;
        }

        .sign-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
        }

        .sign-table td {
          width: 33.33%;
          text-align: center;
          vertical-align: bottom;
        }

        .sign-line {
          width: 75%;
          margin: 0 auto;
          border-top: 1px solid #cbd5e1;
          padding-top: 4px;
          font-size: 7.5pt;
          font-weight: 600;
          color: #475569 !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          header, aside, nav, .print\:hidden, .no-print {
            display: none !important;
          }
          .pdf-container {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm 10mm !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          .ticket-input, .problem-textarea, .company-title, .company-sub {
            background: transparent !important;
            border: 1px solid transparent !important;
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* 2-Second Loading Modal Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-800">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Generating Support Ticket...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Formatting A4 layout, accessories checklist & client specifications.
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Toast */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>All ticket fields have been reset.</span>
        </div>
      )}

      {/* Download Success Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-indigo-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>PDF downloaded successfully!</span>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Support Ticket Generator
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  currentView === 'entry'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {currentView === 'entry' ? '1. Entry & Input Mode' : '2. Generated Invoice Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill all required ticket details, logistics & accessories checklist, then generate & print A4 invoice.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {currentView === 'invoice' ? (
            <>
              <button
                onClick={() => setCurrentView('entry')}
                type="button"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-transparent"
                title="Return back to edit ticket info"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Entry
              </button>

              <button
                onClick={handleCopySummary}
                type="button"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-transparent"
                title="Copy text summary to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>

              <button
                onClick={handlePrint}
                type="button"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Open browser print dialog"
              >
                <Printer className="w-4 h-4 text-indigo-500" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                type="button"
                disabled={isDownloadingPDF}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                title="Download A4 PDF document"
              >
                {isDownloadingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>{isDownloadingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleReset}
              type="button"
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Reset all fields"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Form
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ENTRY PAGE VIEW (Interactive Form for Light & Dark)   */}
      {/* ======================================================== */}
      {currentView === 'entry' && (
        <form onSubmit={handleGenerateTicket} className="space-y-5">
          {/* Section 1: Ticket Metadata & Client Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-md">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  1. Ticket Metadata & Client Details
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                General identification
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Odoo Ticket No
                </label>
                <input
                  type="text"
                  value={odooTicketNo}
                  onChange={(e) => setOdooTicketNo(e.target.value)}
                  placeholder="e.g. ODOO-2026-8841"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date (DD/MM/YYYY)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Ticket No <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={supportTicketNo}
                    onChange={(e) => setSupportTicketNo(e.target.value)}
                    required
                    placeholder="ST-20260826-101"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setSupportTicketNo(generateTicketNumber())}
                    className="px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-xs transition cursor-pointer"
                    title="Generate new ticket number"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Agrani Bank PLC"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opportunity / Project Context
                </label>
                <input
                  type="text"
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  placeholder="e.g. Branch Biometric Device Replacement & Inspection"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manpower Needed?
                </label>
                <div className="flex items-center gap-4 py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="manpower"
                      checked={manpowerNeeded === 'Yes'}
                      onChange={() => setManpowerNeeded('Yes')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="manpower"
                      checked={manpowerNeeded === 'No'}
                      onChange={() => setManpowerNeeded('No')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Level
                </label>
                <div className="flex items-center gap-3 py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <label className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === 'Low'}
                      onChange={() => setPriority('Low')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Low</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === 'Mid'}
                      onChange={() => setPriority('Mid')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Mid</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === 'High'}
                      onChange={() => setPriority('High')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-rose-600 dark:text-rose-400">High</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Information Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-md">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  2. Information Checklist (Receiver & Contact)
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Check items included on invoice
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiverNameChecked}
                      onChange={(e) => setReceiverNameChecked(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Receiver Name</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Md. Rafiqul Islam"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={designationChecked}
                      onChange={(e) => setDesignationChecked(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Designation</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Officer (IT / Admin)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactNoChecked}
                      onChange={(e) => setContactNoChecked(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Contact No</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="e.g. +880 1711-234567"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailChecked}
                      onChange={(e) => setEmailChecked(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Email Address</span>
                  </label>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rafiqul.agranibank@gmail.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courierDetailsChecked}
                      onChange={(e) => setCourierDetailsChecked(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Courier Receiver Details (Full Address)</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={courierDetails}
                  onChange={(e) => setCourierDetails(e.target.value)}
                  placeholder="e.g. Principal Branch, Motijheel C/A, Dhaka-1000 (Attn: Md. Rafiqul)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Problem Description & Logistics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Problem Description (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 rounded-md">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    3. Problem Description
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Detailed error & context
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detailed Issue Description
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={9}
                  placeholder="Describe the issue reported by the client, diagnostic findings, firmware status, or requested component replacement..."
                  className="w-full flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right: Accessories & Logistics Checklist (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-md">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Hardware & Logistics Checklist
                  </h3>
                </div>
              </div>

              {/* Hardware items */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Hardware & Accessories
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Device', state: hwDevice, setState: setHwDevice },
                    { label: '12V Adapter', state: hwAdapter12V, setState: setHwAdapter12V },
                    { label: 'Metal Plate', state: hwMetalPlate, setState: setHwMetalPlate },
                    { label: 'Mount', state: hwMount, setState: setHwMount },
                    { label: 'Screw', state: hwScrew, setState: setHwScrew },
                    { label: 'Silicon', state: hwSilicon, setState: setHwSilicon },
                    { label: 'Drill Machine', state: hwDrillMachine, setState: setHwDrillMachine },
                    { label: 'Cable', state: hwCable, setState: setHwCable },
                    { label: 'Channel / Casing', state: hwChannelCasing, setState: setHwChannelCasing },
                    { label: 'Insulation Tape', state: hwInsulationTape, setState: setHwInsulationTape },
                    { label: 'Foam Tape', state: hwFoamTape, setState: setHwFoamTape },
                  ].map((item, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition select-none ${
                        item.state
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setState(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Courier items */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" /> Courier Service Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition select-none ${
                      courierGeneral
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={courierGeneral}
                      onChange={(e) => setCourierGeneral(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>General Courier</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition select-none ${
                      courierSundarban
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={courierSundarban}
                      onChange={(e) => setCourierSundarban(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Sundarban Courier</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition select-none col-span-2 ${
                      courierPathao
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={courierPathao}
                      onChange={(e) => setCourierPathao(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Pathao Parcel</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tracking / Ref No
                    </label>
                    <input
                      type="text"
                      value={trackingRefNo}
                      onChange={(e) => setTrackingRefNo(e.target.value)}
                      placeholder="e.g. SND-DHK-994821"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Expected Closing Date</span>
                      {expectedClosingDate && (
                        <button
                          type="button"
                          onClick={() => setExpectedClosingDate('')}
                          className="text-[10px] text-slate-400 hover:text-rose-500 transition"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={expectedClosingDate}
                        onChange={(e) => setExpectedClosingDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Form Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white text-sm font-bold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
              <span>{isGenerating ? 'Generating Invoice (Please wait)...' : 'Generate Ticket Invoice'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. GENERATED INVOICE VIEW (Crisp A4 Printable Document)  */}
      {/* ======================================================== */}
      {currentView === 'invoice' && (
        <div className="overflow-x-auto p-2 sm:p-4 bg-slate-200/70 dark:bg-slate-950/90 rounded-xl">
          <div className="pdf-container ticket-page-root select-text" id="printable-ticket-document" ref={invoiceContainerRef}>
              {/* Watermark Layer */}
              <div className="watermark-layer" aria-hidden="true">
                <svg className="watermark-svg" viewBox="0 0 100 80" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <rect x="20" y="28" width="60" height="32" rx="3" fill="none" strokeWidth="2.5" />
                  <path d="M10 60 L90 60 L84 66 L16 66 Z" fill="none" strokeWidth="2.5" />
                  <path d="M30 38 C30 18, 70 18, 70 38" strokeWidth="3" fill="none" />
                  <rect x="24" y="34" width="9" height="15" rx="3" fill="#4f46e5" />
                  <rect x="67" y="34" width="9" height="15" rx="3" fill="#4f46e5" />
                  <path d="M30 45 C22 52, 34 58, 45 54" strokeWidth="2" fill="none" />
                  <circle cx="46" cy="54" r="2.5" fill="#4f46e5" />
                </svg>
                <div className="watermark-text">SUPPORT</div>
              </div>

              <div className="content">
                {/* Header */}
                <div className="header-container">
                  <table className="header-table">
                    <tbody>
                      <tr>
                        <td style={{ width: '55%', verticalAlign: 'top' }}>
                          <div className="company-title font-bold text-slate-900 text-sm tracking-tight">
                            {companyTitle || 'Company Name'}
                          </div>
                          <div className="company-sub text-slate-600 text-[8pt] leading-tight mt-1 whitespace-pre-line">
                            {companySub || 'Company details & contact info'}
                          </div>
                        </td>
                        <td style={{ width: '45%', verticalAlign: 'top' }} className="logo-text-wrapper">
                          <div className="tipsoi-brand">
                            {appLogo ? (
                              <img
                                src={appLogo}
                                alt={appName || 'System Logo'}
                                className="w-7 h-7 object-contain rounded inline-block"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <Box className="w-6 h-6 text-indigo-600 inline-block" />
                            )}
                            <span className="logo-text">Tipsoi</span>
                          </div>
                          <div>
                            <span className="document-badge">Support Ticket Invoice</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 1: Ticket Metadata */}
                <div className="section-title">1. Ticket Metadata & Client Details</div>
                <table className="form-table">
                  <tbody>
                    <tr>
                      <td className="lbl">Odoo Ticket No:</td>
                      <td className="val">
                        <span className="font-mono font-semibold text-slate-800 text-[8pt]">
                          {odooTicketNo || '—'}
                        </span>
                      </td>
                      <td className="lbl">Date:</td>
                      <td className="val">
                        <span className="text-slate-800 text-[8pt] font-medium">
                          {date || '—'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="lbl">Support Ticket No:</td>
                      <td className="val">
                        <span className="font-mono font-bold text-indigo-600 text-[8.5pt]">
                          {supportTicketNo || '—'}
                        </span>
                      </td>
                      <td className="lbl">Client Name:</td>
                      <td className="val">
                        <span className="font-semibold text-slate-900 text-[8pt]">
                          {clientName || '—'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="lbl">Opportunity:</td>
                      <td className="val" colSpan={3}>
                        <span className="text-slate-800 text-[8pt]">
                          {opportunity || '—'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="lbl">Manpower Needed?</td>
                      <td className="val">
                        <label className="inline-flex items-center mr-4 pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={manpowerNeeded === 'Yes'}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', color: '#0f172a' }}>Yes</span>
                        </label>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={manpowerNeeded === 'No'}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', color: '#0f172a' }}>No</span>
                        </label>
                      </td>
                      <td className="lbl">Priority:</td>
                      <td className="val">
                        <label className="inline-flex items-center mr-2 pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={priority === 'Low'}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', color: '#0f172a' }}>Low</span>
                        </label>
                        <label className="inline-flex items-center mr-2 pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={priority === 'Mid'}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', color: '#0f172a' }}>Mid</span>
                        </label>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={priority === 'High'}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', color: '#0f172a', fontWeight: 'bold' }}>High</span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Section 2: Information Checklist */}
                <div className="section-title">2. Information Checklist</div>
                <table className="info-checklist-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '50%' }}>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={receiverNameChecked}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', fontWeight: 600, color: '#334155', marginRight: '4px' }}>
                            Receiver Name:
                          </span>
                        </label>
                        <span className="text-slate-900 font-medium text-[8pt]">
                          {receiverName || '—'}
                        </span>
                      </td>
                      <td style={{ width: '50%' }}>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={designationChecked}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', fontWeight: 600, color: '#334155', marginRight: '4px' }}>
                            Designation:
                          </span>
                        </label>
                        <span className="text-slate-900 font-medium text-[8pt]">
                          {designation || '—'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '50%' }}>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={contactNoChecked}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', fontWeight: 600, color: '#334155', marginRight: '4px' }}>
                            Contact No:
                          </span>
                        </label>
                        <span className="text-slate-900 font-medium text-[8pt]">
                          {contactNo || '—'}
                        </span>
                      </td>
                      <td style={{ width: '50%' }}>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={emailChecked}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', fontWeight: 600, color: '#334155', marginRight: '4px' }}>
                            Email:
                          </span>
                        </label>
                        <span className="text-slate-900 font-medium text-[8pt]">
                          {email || '—'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label className="inline-flex items-center pointer-events-none">
                          <input
                            type="checkbox"
                            className="invoice-checkbox"
                            checked={courierDetailsChecked}
                            disabled
                            readOnly
                          />
                          <span style={{ fontSize: '8pt', fontWeight: 600, color: '#334155', marginRight: '4px' }}>
                            Courier Receiver Details:
                          </span>
                        </label>
                        <span className="text-slate-900 font-medium text-[8pt]">
                          {courierDetails || '—'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Section 3: Problem Description & Logistics Columns */}
                <div className="section-title">3. Problem Description & Logistics</div>
                <table className="two-column-table">
                  <tbody>
                    <tr>
                      {/* Left Column: Problem Description */}
                      <td style={{ paddingRight: '5px' }}>
                        <div className="column-box">
                          <div className="column-header">Problem Description</div>
                          <div className="w-full h-[240px] border border-slate-200 rounded p-2 text-[8pt] text-slate-800 leading-relaxed overflow-y-auto whitespace-pre-wrap bg-white font-sans">
                            {problemDescription || 'No specific problem description provided.'}
                          </div>
                        </div>
                      </td>

                      {/* Right Column: Hardware & Courier Checklist */}
                      <td style={{ paddingLeft: '5px' }}>
                        <div className="column-box">
                          <div className="column-header purple">Accessories & Logistics Details</div>

                          <div className="sub-header">Hardware & Accessories</div>
                          <table className="logistics-grid-table">
                            <tbody>
                              <tr>
                                <td style={{ width: '50%' }}>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwDevice}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Device</span>
                                  </label>
                                </td>
                                <td style={{ width: '50%' }}>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwAdapter12V}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">12V Adapter</span>
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwMetalPlate}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Metal Plate</span>
                                  </label>
                                </td>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwMount}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Mount</span>
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwScrew}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Screw</span>
                                  </label>
                                </td>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwSilicon}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Silicon</span>
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwDrillMachine}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Drill Machine</span>
                                  </label>
                                </td>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwCable}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Cable</span>
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwChannelCasing}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Channel/Casing</span>
                                  </label>
                                </td>
                                <td>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwInsulationTape}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Insulation Tape</span>
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={2}>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={hwFoamTape}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Foam Tape</span>
                                  </label>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="sub-header" style={{ marginTop: '6px' }}>Courier Details</div>
                          <table className="logistics-grid-table">
                            <tbody>
                              <tr>
                                <td style={{ width: '33%' }}>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={courierGeneral}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">General</span>
                                  </label>
                                </td>
                                <td style={{ width: '33%' }}>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={courierSundarban}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Sundarban</span>
                                  </label>
                                </td>
                                <td style={{ width: '34%' }}>
                                  <label className="inline-flex items-center pointer-events-none">
                                    <input
                                      type="checkbox"
                                      className="invoice-checkbox"
                                      checked={courierPathao}
                                      disabled
                                      readOnly
                                    />
                                    <span className="checklist-item-title">Pathao</span>
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={3}>
                                  <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>
                                    Tracking / Ref:
                                  </span>
                                  <span className="font-mono text-slate-800 font-semibold text-[8pt] ml-1.5">
                                    {trackingRefNo || '—'}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={3}>
                                  <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>
                                    Closing Date:
                                  </span>
                                  <span className="text-slate-800 font-medium text-[8pt] ml-1.5">
                                    {formatDateDisplay(expectedClosingDate)}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Note Card */}
                <div className="note-card">
                  <strong>Note:</strong> Microsoft To-Do List is strongly recommended for daily follow-up and prompt ticket resolution.
                </div>

                {/* Signatures Area */}
                <table className="sign-table">
                  <tbody>
                    <tr>
                      <td>
                        <div className="sign-line">Prepared By (Support)</div>
                      </td>
                      <td>
                        <div className="sign-line">Client / Receiver</div>
                      </td>
                      <td>
                        <div className="sign-line">Authorized Signature</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
