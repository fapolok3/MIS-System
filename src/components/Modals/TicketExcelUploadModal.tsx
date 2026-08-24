import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Ticket, SystemOptions } from '../../types';

interface TicketExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTickets: (tickets: Ticket[]) => void;
  systemOptions?: SystemOptions;
  ticketCount?: number;
}

export const TicketExcelUploadModal: React.FC<TicketExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportTickets,
  systemOptions,
  ticketCount = 0,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Ticket>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (uploadedFile: File) => {
    setError(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        if (!rawData || rawData.length === 0) {
          setError('The uploaded Excel file appears to be empty.');
          setParsedData([]);
          return;
        }

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const dateCompact = dateStr.replace(/-/g, '');

        // Map flexible headers for the 21 columns
        const mappedTickets: Partial<Ticket>[] = rawData.map((row, index) => {
          const findVal = (...keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                (rk) => rk.trim().toLowerCase() === k.toLowerCase()
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const padIndex = String(ticketCount + index + 1).padStart(3, '0');
          const autoId = `INV-BBL-${dateCompact}${padIndex}`;

          const issueNumberVal = findVal('Issue Number', 'Ticket ID', 'Ticket No', 'Ticket', 'ID', 'Issue No', 'SL') || autoId;
          const emailSubjectVal = findVal('Email Subject', 'Subject', 'Title', 'Issue Title', 'Email') || 'Service Request Notice';
          const emailFromVal = findVal('Email From', 'From', 'Sender', 'Reported By', 'Requester') || 'helpdesk@bank.com';
          const reqDateVal = findVal('Service Request Date', 'Request Date', 'Req Date', 'Date') || dateStr;
          const reqTimeVal = findVal('Request Time', 'Req Time', 'Time') || '10:00 AM';
          const planDateVal = findVal('Planned Provide Date', 'Planned Date', 'Plan Date', 'Target Date') || dateStr;
          const countDateVal = findVal('Date to count', 'Count Date', 'Counting Date') || dateStr;
          const provDateVal = findVal('Service Provide Date', 'Provide Date', 'Prov Date', 'Resolution Date') || 'Pending';
          const deviceLocVal = findVal('Device Location', 'Location', 'Branch', 'Branch Name', 'Site') || 'Main Branch';
          const deviceIdVal = findVal('Device ID', 'Device ID', 'Device', 'DeviceId') || 'DEV-1001';
          const locTypeVal = findVal('Location Type', 'Location Type / Category', 'Loc Type', 'Category') || 'Main Branch';
          const issueTypeVal = findVal('Issue Type', 'Problem Type', 'Issue Category', 'Problem') || 'Network Disconnection';
          const receivedByVal = findVal('Challan Received By', 'Received By', 'Challan Receiver', 'Receiver') || 'System Logged';
          
          let priorityVal = findVal('Issue Priority', 'Priority', 'Severity').toUpperCase();
          if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priorityVal)) {
            priorityVal = 'HIGH';
          }

          let statusVal = findVal('Current Status', 'Status', 'Ticket Status', 'State').toUpperCase();
          if (!statusVal) {
            statusVal = 'OPEN';
          }

          const resTimeRaw = findVal('Resolution Time (Days)', 'Resolution Time', 'Res Time', 'Days Taken');
          const resTimeVal = resTimeRaw && !isNaN(Number(resTimeRaw)) ? Number(resTimeRaw) : 0;

          const slaThreshRaw = findVal('SLA Threshold (Days)', 'SLA Threshold', 'SLA Days', 'Threshold');
          const slaThreshVal = slaThreshRaw && !isNaN(Number(slaThreshRaw)) ? Number(slaThreshRaw) : 2;

          let slaStatusVal = findVal('SLA Status', 'SLA', 'SLA Compliance');
          if (!slaStatusVal) {
            slaStatusVal = resTimeVal > slaThreshVal ? 'SLA BREACH' : 'WITHIN SLA';
          }

          const techVal = findVal('Technician details', 'Technician', 'Tech Details', 'Tech', 'Assign Person', 'Engineer') || 'Unassigned';
          const remarksVal = findVal('Remarks', 'Remark', 'Comments', 'Note', 'Description') || '';
          const emailDetailsVal = findVal('Visit Email Details', 'Email Details', 'Visit Details', 'Log Details') || '';

          return {
            id: issueNumberVal,
            subject: emailSubjectVal,
            from: emailFromVal,
            reqDate: reqDateVal,
            reqTime: reqTimeVal,
            planDate: planDateVal,
            countDate: countDateVal,
            provDate: provDateVal,
            location: deviceLocVal,
            deviceId: deviceIdVal,
            locType: locTypeVal,
            issueType: issueTypeVal,
            receivedBy: receivedByVal,
            priority: priorityVal as any,
            status: statusVal as any,
            resTime: resTimeVal,
            slaThreshold: slaThreshVal,
            slaStatus: slaStatusVal,
            tech: techVal,
            remarks: remarksVal,
            emailDetails: emailDetailsVal,
          };
        });

        setParsedData(mappedTickets);
      } catch (err: any) {
        console.error(err);
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls or .csv file.');
        setParsedData([]);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleDownloadSampleExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sampleRows = [
      {
        'Issue Number': 'INV-BBL-20260301001',
        'Email Subject': 'Urgent: Router Power Disconnection at Gulshan Branch',
        'Email From': 'gulshan.branch@bank.com',
        'Service Request Date': todayStr,
        'Request Time': '09:30 AM',
        'Planned Provide Date': todayStr,
        'Date to count': todayStr,
        'Service Provide Date': 'Pending',
        'Device Location': 'Gulshan Branch',
        'Device ID': 'DEV-994101',
        'Location Type': 'Main Branch',
        'Issue Type': 'Network Disconnection',
        'Challan Received By': 'BM Mr. Rahim',
        'Issue Priority': 'HIGH',
        'Current Status': 'OPEN',
        'Resolution Time (Days)': 0,
        'SLA Threshold (Days)': 2,
        'SLA Status': 'WITHIN SLA',
        'Technician details': 'Tanvir Hasan (01711000000)',
        'Remarks': 'Device offline due to secondary switch failure',
        'Visit Email Details': 'Physical onsite technician dispatched with replacement router',
      },
      {
        'Issue Number': 'INV-BBL-20260301002',
        'Email Subject': 'ATM Biometric Reader Failure',
        'Email From': 'atm.ops@bank.com',
        'Service Request Date': todayStr,
        'Request Time': '11:15 AM',
        'Planned Provide Date': todayStr,
        'Date to count': todayStr,
        'Service Provide Date': todayStr,
        'Device Location': 'Dhanmondi SME Unit',
        'Device ID': 'DEV-994202',
        'Location Type': 'SME Branch',
        'Issue Type': 'Hardware Failure',
        'Challan Received By': 'Security Lead Kamal',
        'Issue Priority': 'CRITICAL',
        'Current Status': 'RESOLVED',
        'Resolution Time (Days)': 1,
        'SLA Threshold (Days)': 2,
        'SLA Status': 'WITHIN SLA',
        'Technician details': 'Rahim Ahmed (01819000000)',
        'Remarks': 'Reader cleaned and firmware updated',
        'Visit Email Details': 'Issue resolved onsite and verified by branch manager',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service_Tickets');
    XLSX.writeFile(workbook, 'Service_Ticket_Import_Template.xlsx');
  };

  const handleImportSubmit = () => {
    if (parsedData.length === 0) return;

    const fullTickets: Ticket[] = parsedData.map((t, index) => ({
      id: t.id || `INV-BBL-${Date.now()}-${index}`,
      subject: t.subject || 'Service Request',
      from: t.from || 'system@bank.com',
      reqDate: t.reqDate || new Date().toISOString().split('T')[0],
      reqTime: t.reqTime || '10:00 AM',
      planDate: t.planDate || t.reqDate || new Date().toISOString().split('T')[0],
      countDate: t.countDate || t.reqDate || new Date().toISOString().split('T')[0],
      provDate: t.provDate || 'Pending',
      location: t.location || 'Branch Office',
      deviceId: t.deviceId || 'DEV-1001',
      locType: t.locType || 'Main Branch',
      issueType: t.issueType || 'Network Disconnection',
      receivedBy: t.receivedBy || 'System Logged',
      priority: (t.priority || 'HIGH') as any,
      status: (t.status || 'OPEN') as any,
      resTime: typeof t.resTime === 'number' ? t.resTime : 0,
      slaThreshold: typeof t.slaThreshold === 'number' ? t.slaThreshold : 2,
      slaStatus: t.slaStatus || 'WITHIN SLA',
      tech: t.tech || 'Unassigned',
      remarks: t.remarks || '',
      emailDetails: t.emailDetails || '',
    }));

    onImportTickets(fullTickets);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Upload Service Tickets from Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk import ticket records into <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Service Ticket & SLA Tracker</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Action Row: Sample download banner */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg p-3 flex flex-wrap justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>Need a formatted Excel file with all 21 columns? Download our standard template.</span>
            </div>
            <button
              onClick={handleDownloadSampleExcel}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Download Excel Template
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
                : file
                ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-400 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            {file ? (
              <div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {file.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB — Click or drag to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Click to browse or drag & drop Excel file (.xlsx, .xls, .csv)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl mx-auto">
                  Supports all 21 columns: Issue Number, Email Subject, Email From, Service Request Date, Request Time, Planned Provide Date, Date to count, Service Provide Date, Device Location, Device ID, Location Type, Issue Type, Challan Received By, Issue Priority, Current Status, Resolution Time, SLA Threshold, SLA Status, Technician details, Remarks, Visit Email Details
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-200 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Preview Data ({parsedData.length} records found)
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-mono">
                  Ready to import
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-56">
                <table className="w-full text-left text-[11px] border-collapse min-w-[1200px]">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">#</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Issue Number</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Subject</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Location</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Device ID</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Issue Type</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Priority</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Status</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Technician</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">SLA Status</th>
                      <th className="p-2">Req Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-300">{row.id}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 max-w-[200px] truncate text-slate-800 dark:text-slate-200">{row.subject}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">{row.location}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold">{row.deviceId}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">{row.issueType}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.priority === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
                              : row.priority === 'HIGH'
                              ? 'bg-orange-50 text-orange-700 border border-orange-300 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
                              : 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                          }`}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'RESOLVED' || row.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">{row.tech}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.slaStatus === 'SLA BREACH'
                              ? 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                          }`}>
                            {row.slaStatus}
                          </span>
                        </td>
                        <td className="p-2">{row.reqDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleImportSubmit}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              parsedData.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import {parsedData.length > 0 ? `${parsedData.length} Tickets` : 'Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
