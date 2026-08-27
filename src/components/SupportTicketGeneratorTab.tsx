import React, { useState, useRef, useEffect } from 'react';
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
  Building,
  MapPin,
  PenTool,
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
  appName = 'Tipsoi',
}) => {
  const getTodayFormattedDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // View state: 'entry' (form) or 'invoice' (generated document)
  const [currentView, setCurrentView] = useState<'entry' | 'invoice'>('entry');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  const [copied, setCopied] = useState(false);

  // Company details
  const [companyTitle, setCompanyTitle] = useState('INOVACE TECHNOLOGIES LIMITED');
  const [companySub, setCompanySub] = useState(
    '📍 18 Kazi Nazrul Islam Avenue, 2nd Floor, Shahbagh, Dhaka-1000, Bangladesh\nTechnical Support Team | 📞 +880 1708-123884 | support@inovacetech.com'
  );

  // Section 1: Ticket Metadata & Client Details
  const [odooTicketNo, setOdooTicketNo] = useState('');
  const [date, setDate] = useState(getTodayFormattedDate());
  const [clientName, setClientName] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [address, setAddress] = useState('');
  const [manpowerNeeded, setManpowerNeeded] = useState<'Yes' | 'No'>('No');
  const [priority, setPriority] = useState<'Low' | 'Mid' | 'High'>('Mid');

  // Section 2: Service Receiver & Contact Checklist
  const [receiverName, setReceiverName] = useState('');
  const [designation, setDesignation] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [courierReceiver, setCourierReceiver] = useState('');

  // Section 3: Problem Description
  const [problemDescription, setProblemDescription] = useState('');

  // Section 4: Hardware & Accessories Checklist (3x4 Grid = 12 Items)
  const [hwDevice, setHwDevice] = useState(true);
  const [hwAdapter12V, setHwAdapter12V] = useState(true);
  const [hwMetalPlate, setHwMetalPlate] = useState(false);
  const [hwMount, setHwMount] = useState(false);
  const [hwScrew, setHwScrew] = useState(false);
  const [hwSilicon, setHwSilicon] = useState(false);
  const [hwDrillMachine, setHwDrillMachine] = useState(false);
  const [hwCable, setHwCable] = useState(false);
  const [hwChannel, setHwChannel] = useState(false);
  const [hwDuctTape, setHwDuctTape] = useState(false);
  const [hwFoamTape, setHwFoamTape] = useState(false);
  const [hwOther, setHwOther] = useState(false);

  // Logistics: Courier & Date
  const [courierService, setCourierService] = useState<string>('Sundarban Courier');
  const [otherCourier, setOtherCourier] = useState<string>('');
  const [expectedClosingDate, setExpectedClosingDate] = useState<string>(getTodayFormattedDate());

  // Signatures
  const [preparedBy, setPreparedBy] = useState<string>('Taqi Year');
  const [authorizedBy, setAuthorizedBy] = useState<string>('Rafsin Hasan');

  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  // Autocomplete helper from existing tickets / devices
  const branchOptions = Array.from(
    new Set([
      ...devices.map((d) => d.branchName).filter(Boolean),
      ...tickets.map((t) => t.branchName).filter(Boolean),
      ...issues.map((i) => i.branchName).filter(Boolean),
    ])
  );

  const handleBranchSelect = (selectedBranch: string) => {
    setClientName(selectedBranch);
    // Try to auto-populate address or details if found in devices
    const matchedDev = devices.find((d) => d.branchName === selectedBranch);
    if (matchedDev) {
      if (matchedDev.location && !address) {
        setAddress(matchedDev.location);
      }
      if (matchedDev.vendor && !opportunity) {
        setOpportunity(`Device Sl: ${matchedDev.sl || matchedDev.id} (${matchedDev.deviceModel || 'Biometric'})`);
      }
    }
  };

  // Direct, reliable Reset handler
  const handleReset = () => {
    setOdooTicketNo('');
    setDate(getTodayFormattedDate());
    setClientName('');
    setOpportunity('');
    setAddress('');
    setManpowerNeeded('No');
    setPriority('Mid');

    setReceiverName('');
    setDesignation('');
    setContactNo('');
    setEmail('');
    setCourierReceiver('');

    setProblemDescription('');

    setHwDevice(true);
    setHwAdapter12V(true);
    setHwMetalPlate(false);
    setHwMount(false);
    setHwScrew(false);
    setHwSilicon(false);
    setHwDrillMachine(false);
    setHwCable(false);
    setHwChannel(false);
    setHwDuctTape(false);
    setHwFoamTape(false);
    setHwOther(false);

    setCourierService('Sundarban Courier');
    setOtherCourier('');
    setExpectedClosingDate(getTodayFormattedDate());
    setPreparedBy('Taqi Year');
    setAuthorizedBy('Rafsin Hasan');

    setResetToast(true);
    setTimeout(() => setResetToast(false), 2500);
  };

  // 1.5-second Generation trigger
  const handleGenerateTicket = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentView('invoice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  // High-reliability Direct PDF Download via html-to-image & jsPDF
  const handleDownloadPDF = async () => {
    const docElement = document.getElementById('printable-ticket-document');
    if (!docElement) return;

    try {
      setIsDownloadingPDF(true);

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

      const fileName = `Support_Ticket_${odooTicketNo ? odooTicketNo.replace(/[^a-zA-Z0-9-_]/g, '_') : 'Document'}.pdf`;
      pdf.save(fileName);

      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 3000);
    } catch (err) {
      console.error('PDF generation error, fallback to PNG:', err);
      try {
        const fallbackImgData = await toPng(docElement, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(fallbackImgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`Support_Ticket_${odooTicketNo || 'Document'}.pdf`);
        setDownloadSuccessToast(true);
        setTimeout(() => setDownloadSuccessToast(false), 3000);
      } catch (fallbackErr) {
        console.error('All PDF download methods failed, triggering print dialog:', fallbackErr);
        handlePrint();
      }
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // High-compatibility Direct Print Handler
  const handlePrint = () => {
    const docElement = document.getElementById('printable-ticket-document');
    if (!docElement) {
      window.print();
      return;
    }

    try {
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
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            width: 210mm;
          }
          .pdf-page {
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
          .controls-bar, .no-print, .print\\:hidden {
            display: none !important;
          }
        </style>
      `;

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Support_Ticket_${odooTicketNo || 'Document'}</title>
            <meta charset="utf-8" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&family=Alex+Brush&family=Caveat:wght@700&display=swap" rel="stylesheet">
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
TIPSOI SUPPORT TICKET & INVOICE
========================================
Odoo Ticket No: ${odooTicketNo || 'N/A'}
Date: ${date}
Client Name: ${clientName || 'N/A'}
Opportunity: ${opportunity || 'N/A'}
Address: ${address || 'N/A'}
Priority: ${priority} | Manpower Needed: ${manpowerNeeded}

--- Receiver & Contact Checklist ---
Receiver: ${receiverName || 'N/A'} (${designation || 'N/A'})
Contact No: ${contactNo || 'N/A'} | Email: ${email || 'N/A'}
Courier Receiver: ${courierReceiver || 'N/A'}

--- Problem Description ---
${problemDescription || 'None'}

--- Accessories & Logistics ---
Courier: ${courierService === 'Other' ? otherCourier || 'Other Courier' : courierService}
Expected Closing Date: ${expectedClosingDate || 'N/A'}
Prepared By: ${preparedBy} | Authorized By: ${authorizedBy}
========================================
`.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Import Webfonts for authentic typography matching the HTML */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&family=Alex+Brush&family=Caveat:wght@700&display=swap"
        rel="stylesheet"
      />

      {/* Embedded CSS matching exact styles from user HTML */}
      <style>{`
        :root {
          --brand-primary: #3b82f6;
          --brand-dark: #0f172a;
          --brand-indigo: #4338ca;
          --brand-emerald: #059669;
          --bg-page: #f1f5f9;
          --card-bg: #ffffff;
          --border-color: #cbd5e1;
          --text-dark: #0f172a;
          --text-muted: #475569;
        }

        .pdf-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0 auto;
          padding: 11mm 13mm;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
          position: relative;
          border-radius: 6px;
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .watermark-layer {
          position: absolute;
          top: 48%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          opacity: 0.04;
          pointer-events: none;
          text-align: center;
          z-index: 0;
        }

        .content-layer {
          position: relative;
          z-index: 1;
        }

        .header-banner {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
          border-radius: 10px;
          padding: 14px 18px;
          color: #ffffff !important;
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 16px;
          align-items: center;
          margin-bottom: 12px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
        }

        .company-title {
          font-size: 14.5pt;
          font-weight: 800;
          color: #ffffff !important;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: -0.3px;
        }

        .company-sub {
          font-size: 7.8pt;
          color: #cbd5e1 !important;
          line-height: 1.45;
          margin-top: 4px;
        }

        .brand-block {
          text-align: center;
          background: rgba(255, 255, 255, 0.95) !important;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 175px;
        }

        .doc-badge {
          display: inline-block;
          background: #2563eb !important;
          color: #ffffff !important;
          font-size: 7.2pt;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 4px;
          margin-top: 4px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          text-align: center;
        }

        .section-box {
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          margin-bottom: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .section-header {
          background: linear-gradient(90deg, #1e293b 0%, #334155 100%) !important;
          padding: 6.5px 12px;
          font-size: 8.8pt;
          font-weight: 800;
          color: #ffffff !important;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-family: 'Space Grotesk', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-header.blue {
          background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%) !important;
        }

        .section-header.indigo {
          background: linear-gradient(90deg, #3730a3 0%, #4f46e5 100%) !important;
        }

        .section-header.emerald {
          background: linear-gradient(90deg, #065f46 0%, #059669 100%) !important;
        }

        .form-grid-4 {
          display: grid;
          grid-template-columns: 125px 1fr 120px 1fr;
          gap: 1px;
          background: #e2e8f0;
        }

        .form-cell {
          background: #ffffff !important;
          padding: 6px 10px;
          font-size: 8.5pt;
          display: flex;
          align-items: center;
          color: #0f172a !important;
        }

        .form-cell.lbl {
          background: #f8fafc !important;
          font-weight: 700;
          color: #334155 !important;
        }

        .address-textarea-doc {
          width: 100%;
          min-height: 30px;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 8.5pt;
          font-weight: 600;
          color: #0f172a !important;
          background: transparent;
          resize: none;
          line-height: 1.4;
          padding: 0;
        }

        .problem-area-doc {
          width: 100%;
          min-height: 52px;
          padding: 6px 10px;
          line-height: 18px;
          background: linear-gradient(transparent, transparent 17px, #cbd5e1 18px) !important;
          background-size: 100% 18px !important;
          resize: none;
          font-weight: 500;
          font-size: 8.5pt;
          border: none;
          outline: none;
          font-family: inherit;
          color: #0f172a !important;
          white-space: pre-wrap;
        }

        .doc-checkbox {
          accent-color: #2563eb !important;
          width: 13px !important;
          height: 13px !important;
          background-color: #ffffff !important;
          border-radius: 3px !important;
          margin-right: 5px;
          cursor: pointer;
          vertical-align: middle;
        }

        .custom-doc-check {
          width: 13px;
          height: 13px;
          background: #ffffff !important;
          border: 1.5px solid #64748b !important;
          border-radius: 3px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
          color: transparent;
          margin-right: 6px;
          box-sizing: border-box;
          flex-shrink: 0;
          line-height: 1;
        }

        .custom-doc-check.checked {
          background: #ffffff !important;
          border-color: #2563eb !important;
          color: #2563eb !important;
        }

        .checkbox-group-doc {
          display: flex;
          gap: 14px;
          align-items: center;
          background: #ffffff !important;
        }

        .checkbox-label-doc {
          font-size: 8.5pt;
          font-weight: 600;
          color: #1e293b !important;
          cursor: default;
          display: inline-flex;
          align-items: center;
          background: #ffffff !important;
        }

        .logistics-container {
          padding: 10px 12px;
          background: #ffffff !important;
        }

        .sub-header-pill {
          font-size: 7.8pt;
          font-weight: 800;
          color: #047857 !important;
          background: #dcfce7 !important;
          padding: 3px 9px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .logistics-grid-3x4 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px 10px;
          margin-bottom: 10px;
        }

        .item-check-doc {
          display: flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 6px;
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          cursor: default;
        }

        .item-check-doc.active {
          background: #ffffff !important;
          border: 1.5px solid #2563eb !important;
        }

        .item-title-doc {
          font-size: 8.2pt;
          font-weight: 600;
          color: #1e293b !important;
        }

        .courier-bar {
          background: #ffffff !important;
          border-radius: 8px;
          padding: 7px 10px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
          align-items: center;
          border: 1.5px solid #cbd5e1;
        }

        .note-card-doc {
          background: #eff6ff !important;
          border-left: 4px solid #2563eb !important;
          padding: 8px 12px;
          font-size: 8pt;
          color: #1e40af !important;
          border-radius: 0 8px 8px 0;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .signature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 18px;
          text-align: center;
        }

        .sig-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          background: #fafafa !important;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }

        .sig-space {
          height: 42px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          margin-bottom: 4px;
          width: 100%;
        }

        .sig-taqi {
          font-family: 'Caveat', cursive;
          font-size: 26pt;
          font-weight: 700;
          color: #0f172a !important;
          transform: rotate(-3deg);
          text-shadow: 0.5px 0.5px 0px #0f172a;
        }

        .sig-rafsin {
          font-family: 'Alex Brush', cursive;
          font-size: 23pt;
          font-weight: 700;
          color: #1e1b4b !important;
          transform: rotate(-2deg);
        }

        .sig-line {
          width: 90%;
          border-top: 2px solid #334155 !important;
          padding-top: 5px;
          font-size: 7.8pt;
          font-weight: 800;
          color: #1e293b !important;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .pdf-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            padding: 8mm 10mm !important;
          }
          .controls-bar, .no-print, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Loading Modal Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Generating Support Ticket...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Formatting Support Ticket & Invoice document layout according to template specifications.
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full" />
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
        <div className="fixed bottom-6 right-6 z-50 bg-blue-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-blue-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>PDF downloaded successfully!</span>
        </div>
      )}

      {/* Top Navigation & Action Controls Bar (Print/Download bar inside the web interface) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg">
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
                {currentView === 'entry' ? '1. Entry Form Mode' : '2. Generated Invoice Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill all required ticket metadata, logistics checklist & client address to generate the official invoice.
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
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-transparent"
                title="Return back to edit fields"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit
              </button>

              <button
                onClick={handleCopySummary}
                type="button"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-transparent"
                title="Copy text summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>

              <button
                onClick={handlePrint}
                type="button"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Print ticket invoice"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Print Document</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                type="button"
                disabled={isDownloadingPDF}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
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
      {/* 1. ENTRY FORM VIEW (Fast, Clean, Responsive Input)       */}
      {/* ======================================================== */}
      {currentView === 'entry' && (
        <form onSubmit={handleGenerateTicket} className="space-y-5">
          {/* Section 1: Ticket Metadata & Client Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-md">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  1. Ticket Metadata & Client Details
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Primary Identification
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
                  placeholder="e.g. INC-2026-9874"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter Client Name or Select"
                    required
                    list="branch-list-ticket"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                  <datalist id="branch-list-ticket">
                    {branchOptions.map((b, idx) => (
                      <option key={idx} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opportunity
                </label>
                <input
                  type="text"
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  placeholder="e.g. Opportunity Details / Device info"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              {/* Full Address Textarea */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address (Full Client Branch / Office Address)
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Full Client Branch / Office Address (Multi-line support)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-y"
                />
              </div>

              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manpower Needed?
                </label>
                <div className="flex items-center gap-4 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-[38px]">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="manpower"
                      checked={manpowerNeeded === 'Yes'}
                      onChange={() => setManpowerNeeded('Yes')}
                      className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="manpower"
                      checked={manpowerNeeded === 'No'}
                      onChange={() => setManpowerNeeded('No')}
                      className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-[38px]">
                  <button
                    type="button"
                    onClick={() => setPriority('Low')}
                    className={`text-xs font-medium rounded-md transition flex items-center justify-center cursor-pointer ${
                      priority === 'Low'
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-300 dark:border-slate-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('Mid')}
                    className={`text-xs font-medium rounded-md transition flex items-center justify-center cursor-pointer ${
                      priority === 'Mid'
                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Mid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('High')}
                    className={`text-xs font-medium rounded-md transition flex items-center justify-center cursor-pointer ${
                      priority === 'High'
                        ? 'bg-rose-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    High
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Service Receiver & Contact Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-md">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  2. Service Receiver & Contact Checklist
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Contact & Logistics Receiver
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receiver Name
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Job Title / Designation"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact No
                </label>
                <input
                  type="text"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courier Receiver (Product Courier Receiver Name, Full Address & Contact Details)
                </label>
                <textarea
                  value={courierReceiver}
                  onChange={(e) => setCourierReceiver(e.target.value)}
                  rows={2}
                  placeholder="Product Courier Receiver Name, Full Address & Contact Details"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-y"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Problem Description */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  3. Problem Description
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Issues / Symptoms Reported
              </span>
            </div>

            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={3}
              placeholder="Write problem details here..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-y leading-relaxed"
            />
          </div>

          {/* Section 4: Accessories & Logistics Checklist (3x4 Grid Layout) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-md">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  4. Accessories & Logistics Checklist
                </h3>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full font-semibold">
                3x4 Hardware Checklist
              </span>
            </div>

            {/* 3x4 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { label: 'Device', state: hwDevice, setState: setHwDevice },
                { label: 'Twelve Volt Adapter', state: hwAdapter12V, setState: setHwAdapter12V },
                { label: 'Metal Plate', state: hwMetalPlate, setState: setHwMetalPlate },
                { label: 'Mount', state: hwMount, setState: setHwMount },
                { label: 'Screw', state: hwScrew, setState: setHwScrew },
                { label: 'Silicon', state: hwSilicon, setState: setHwSilicon },
                { label: 'Drill Machine', state: hwDrillMachine, setState: setHwDrillMachine },
                { label: 'Cable', state: hwCable, setState: setHwCable },
                { label: 'Channel', state: hwChannel, setState: setHwChannel },
                { label: 'Duct Tape / Elec. Tape', state: hwDuctTape, setState: setHwDuctTape },
                { label: 'Foam Tape', state: hwFoamTape, setState: setHwFoamTape },
                { label: 'Other Accessories', state: hwOther, setState: setHwOther },
              ].map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                    item.state
                      ? 'bg-white dark:bg-slate-900 border-blue-600 ring-1 ring-blue-600/30 text-blue-950 dark:text-blue-200 font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setState(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-white"
                  />
                  <span className="text-xs">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Courier Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Courier Service
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={courierService}
                    onChange={(e) => setCourierService(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select Courier --</option>
                    <option value="Sundarban Courier">Sundarban Courier</option>
                    <option value="Pathao Parcel">Pathao Parcel</option>
                    <option value="Other">Other</option>
                  </select>
                  {courierService === 'Other' && (
                    <input
                      type="text"
                      value={otherCourier}
                      onChange={(e) => setOtherCourier(e.target.value)}
                      placeholder="Specify Courier Name"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Expected Closing Date
                </label>
                <input
                  type="date"
                  value={expectedClosingDate}
                  onChange={(e) => setExpectedClosingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Signature Names Config */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-slate-500" /> Prepared By (Support Team Signature)
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  placeholder="e.g. Taqi Year"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-slate-500" /> Authorized Signature Name
                </label>
                <input
                  type="text"
                  value={authorizedBy}
                  onChange={(e) => setAuthorizedBy(e.target.value)}
                  placeholder="e.g. Rafsin Hasan"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Primary Form Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white text-sm font-bold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
              <span>{isGenerating ? 'Generating Invoice (Please wait)...' : 'Generate Support Ticket & Invoice'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. GENERATED INVOICE VIEW (Exact HTML Blueprint Layout)  */}
      {/* ======================================================== */}
      {currentView === 'invoice' && (
        <div className="overflow-x-auto p-2 sm:p-4 bg-slate-200/70 dark:bg-slate-950/90 rounded-xl flex justify-center">
          <div
            className="pdf-page select-text"
            id="printable-ticket-document"
            ref={invoiceContainerRef}
          >
            {/* Watermark Background Layer */}
            <div className="watermark-layer" aria-hidden="true">
              <svg width="350" height="250" viewBox="0 0 450 150" fill="none">
                <path
                  d="M70 115 C45 115 25 95 25 70 C25 45 45 25 70 25 C95 25 115 45 115 70 C115 80 110 90 100 90 C92 90 87 83 87 73 C87 55 73 40 55 40 C37 40 23 55 23 73 C23 93 37 107 57 107 C65 107 72 104 77 98"
                  stroke="#3b0764"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M42 75 C42 67 48 60 56 60 C64 60 70 67 70 75 C70 82 65 87 58 87"
                  stroke="#3b0764"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="content-layer">
              {/* Vibrant Top Header Banner */}
              <div className="header-banner">
                <div>
                  <div className="company-title">
                    {companyTitle}
                  </div>
                  <div className="company-sub">
                    📍 18 Kazi Nazrul Islam Avenue, 2nd Floor, Shahbagh, Dhaka-1000, Bangladesh<br />
                    <b>Technical Support Team</b> | 📞 +880 1708-123884 | ✉️ support@inovacetech.com
                  </div>
                </div>
                <div className="brand-block">
                  {/* System Logo & Tipsoi Brand Text Centered */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '3px', width: '100%' }}>
                    {appLogo ? (
                      <img
                        src={appLogo}
                        alt={appName || 'Tipsoi'}
                        className="max-h-[30px] max-w-[70px] object-contain inline-block"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div style={{ width: '28px', height: '28px', background: '#3b0764', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
                          <g stroke="#ffffff" strokeWidth="10" strokeLinecap="round" fill="none">
                            <path d="M 50 82 A 36 36 0 1 1 80 50 C 80 60 74 66 64 66 C 56 66 50 50 A 20 20 0 1 0 30 70" />
                            <path d="M 40 50 A 9 9 0 0 1 58 50 C 58 56 53 60 47 60" />
                          </g>
                        </svg>
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: '15pt',
                        color: '#1e1b4b',
                        letterSpacing: '-0.5px',
                        lineHeight: 1,
                      }}
                    >
                      Tipsoi
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span className="doc-badge">SUPPORT TICKET INVOICE</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Ticket Metadata */}
              <div className="section-box">
                <div className="section-header blue">1. Ticket Metadata & Client Details</div>
                <div className="form-grid-4">
                  <div className="form-cell lbl">Odoo Ticket No:</div>
                  <div className="form-cell">
                    <span className="font-bold text-slate-900">{odooTicketNo || '—'}</span>
                  </div>
                  <div className="form-cell lbl">Date:</div>
                  <div className="form-cell">
                    <span className="font-bold text-slate-900">{date || '—'}</span>
                  </div>

                  <div className="form-cell lbl">Client Name:</div>
                  <div className="form-cell">
                    <span className="font-bold text-blue-900">{clientName || '—'}</span>
                  </div>
                  <div className="form-cell lbl">Opportunity:</div>
                  <div className="form-cell">
                    <span className="font-semibold text-slate-800">{opportunity || '—'}</span>
                  </div>

                  {/* Formatted Address Field */}
                  <div className="form-cell lbl">Address:</div>
                  <div className="form-cell" style={{ gridColumn: 'span 3' }}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4', fontWeight: 600, color: '#0f172a' }}>
                      {address || '—'}
                    </div>
                  </div>

                  <div className="form-cell lbl">Manpower Needed?</div>
                  <div className="form-cell">
                    <div className="checkbox-group-doc">
                      <span className="checkbox-label-doc">
                        <span className={`custom-doc-check ${manpowerNeeded === 'Yes' ? 'checked' : ''}`}>
                          {manpowerNeeded === 'Yes' ? '✓' : ''}
                        </span>
                        <span>Yes</span>
                      </span>
                      <span className="checkbox-label-doc">
                        <span className={`custom-doc-check ${manpowerNeeded === 'No' ? 'checked' : ''}`}>
                          {manpowerNeeded === 'No' ? '✓' : ''}
                        </span>
                        <span>No</span>
                      </span>
                    </div>
                  </div>

                  <div className="form-cell lbl">Priority Level:</div>
                  <div className="form-cell">
                    <div className="checkbox-group-doc">
                      <span className="checkbox-label-doc">
                        <span className={`custom-doc-check ${priority === 'Low' ? 'checked' : ''}`}>
                          {priority === 'Low' ? '✓' : ''}
                        </span>
                        <span>Low</span>
                      </span>
                      <span className="checkbox-label-doc">
                        <span className={`custom-doc-check ${priority === 'Mid' ? 'checked' : ''}`}>
                          {priority === 'Mid' ? '✓' : ''}
                        </span>
                        <span>Mid</span>
                      </span>
                      <span className="checkbox-label-doc">
                        <span className={`custom-doc-check ${priority === 'High' ? 'checked' : ''}`}>
                          {priority === 'High' ? '✓' : ''}
                        </span>
                        <span style={{ color: priority === 'High' ? '#dc2626' : undefined, fontWeight: priority === 'High' ? 700 : undefined }}>
                          High
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Receiver Info */}
              <div className="section-box">
                <div className="section-header indigo">2. Service Receiver & Contact Checklist</div>
                <div className="form-grid-4">
                  <div className="form-cell lbl">Receiver Name:</div>
                  <div className="form-cell">
                    <span className="font-bold text-slate-900">{receiverName || '—'}</span>
                  </div>
                  <div className="form-cell lbl">Designation:</div>
                  <div className="form-cell">
                    <span className="font-semibold text-slate-800">{designation || '—'}</span>
                  </div>

                  <div className="form-cell lbl">Contact No:</div>
                  <div className="form-cell">
                    <span className="font-mono font-bold text-slate-900">{contactNo || '—'}</span>
                  </div>
                  <div className="form-cell lbl">Email Address:</div>
                  <div className="form-cell">
                    <span className="font-semibold text-slate-800">{email || '—'}</span>
                  </div>

                  {/* Formatted Courier Receiver Field */}
                  <div className="form-cell lbl">Courier Receiver:</div>
                  <div className="form-cell" style={{ gridColumn: 'span 3' }}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4', fontWeight: 600, color: '#0f172a' }}>
                      {courierReceiver || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Problem Description */}
              <div className="section-box">
                <div className="section-header">3. Problem Description</div>
                <div className="problem-area-doc" style={{ cursor: 'default' }}>
                  {problemDescription || 'No specific problem description provided.'}
                </div>
              </div>

              {/* Section 4: Logistics & Accessories (3x4 Grid Layout) */}
              <div className="section-box">
                <div className="section-header emerald">4. Accessories & Logistics Checklist</div>
                <div className="logistics-container">
                  <span className="sub-header-pill">Hardware & Accessories Checklist</span>

                  <div className="logistics-grid-3x4">
                    <div className={`item-check-doc ${hwDevice ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwDevice ? 'checked' : ''}`}>
                        {hwDevice ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Device</span>
                    </div>

                    <div className={`item-check-doc ${hwAdapter12V ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwAdapter12V ? 'checked' : ''}`}>
                        {hwAdapter12V ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Twelve Volt Adapter</span>
                    </div>

                    <div className={`item-check-doc ${hwMetalPlate ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwMetalPlate ? 'checked' : ''}`}>
                        {hwMetalPlate ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Metal Plate</span>
                    </div>

                    <div className={`item-check-doc ${hwMount ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwMount ? 'checked' : ''}`}>
                        {hwMount ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Mount</span>
                    </div>

                    <div className={`item-check-doc ${hwScrew ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwScrew ? 'checked' : ''}`}>
                        {hwScrew ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Screw</span>
                    </div>

                    <div className={`item-check-doc ${hwSilicon ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwSilicon ? 'checked' : ''}`}>
                        {hwSilicon ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Silicon</span>
                    </div>

                    <div className={`item-check-doc ${hwDrillMachine ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwDrillMachine ? 'checked' : ''}`}>
                        {hwDrillMachine ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Drill Machine</span>
                    </div>

                    <div className={`item-check-doc ${hwCable ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwCable ? 'checked' : ''}`}>
                        {hwCable ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Cable</span>
                    </div>

                    <div className={`item-check-doc ${hwChannel ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwChannel ? 'checked' : ''}`}>
                        {hwChannel ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Channel</span>
                    </div>

                    <div className={`item-check-doc ${hwDuctTape ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwDuctTape ? 'checked' : ''}`}>
                        {hwDuctTape ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Duct Tape / Elec. Tape</span>
                    </div>

                    <div className={`item-check-doc ${hwFoamTape ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwFoamTape ? 'checked' : ''}`}>
                        {hwFoamTape ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Foam Tape</span>
                    </div>

                    <div className={`item-check-doc ${hwOther ? 'active' : ''}`}>
                      <span className={`custom-doc-check ${hwOther ? 'checked' : ''}`}>
                        {hwOther ? '✓' : ''}
                      </span>
                      <span className="item-title-doc">Other Accessories</span>
                    </div>
                  </div>

                  <div className="courier-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="item-title-doc" style={{ fontWeight: 700 }}>
                        Courier Service:
                      </span>
                      <span style={{ fontSize: '8.5pt', fontWeight: 700, color: '#0f172a', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                        {courierService === 'Other' ? (otherCourier || 'Other Courier') : (courierService || '—')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Expected Closing Date:
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '7.5pt',
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        {expectedClosingDate || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note Footer Card */}
              <div className="note-card-doc">
                <b>📌 Note:</b> After receiving this invoice, please use <b>Microsoft ToDo list</b> for real-time tracking, status updates, and timely follow-ups.
              </div>

              {/* Signatures Layout */}
              <div className="signature-grid">
                <div className="sig-box">
                  <div className="sig-space sig-taqi">{preparedBy || 'Taqi Year'}</div>
                  <div className="sig-line">Prepared By (Support Team)</div>
                </div>
                <div className="sig-box">
                  <div className="sig-space"></div>
                  <div className="sig-line">Sales Admin & Logistics</div>
                </div>
                <div className="sig-box">
                  <div className="sig-space sig-rafsin">{authorizedBy || 'Rafsin Hasan'}</div>
                  <div className="sig-line">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
