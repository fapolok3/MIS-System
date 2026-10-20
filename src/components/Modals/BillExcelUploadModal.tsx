import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BillItem } from '../../types';

interface BillExcelUploadModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onImportBills: (bills: BillItem[]) => void;
  clients?: string[];
  locations?: string[];
  categories?: string[];
  billCount?: number;
}

export const BillExcelUploadModal: React.FC<BillExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportBills,
  clients = [],
  locations = [],
  categories = [],
  billCount = 0,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<BillItem>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    resetUploadState();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    resetUploadState();
    onClose?.();
  };

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

        const todayStr = new Date().toISOString().split('T')[0];
        const defaultClient = clients[0] || 'Black Bank PLC';
        const defaultLocation = locations[0] || 'Gulistan Branch, Dhaka';
        const defaultCategory = categories[0] || 'Installation & Hardware Support';

        const mappedBills: Partial<BillItem>[] = rawData.map((row, index) => {
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

          // 1. Bill Number
          let billNumVal = findVal(
            'Bill Number',
            'Bill No',
            'Bill #',
            'BillNumber',
            'Bill_Number',
            'Bill ID'
          );
          if (!billNumVal) {
            const pad = (n: number) => String(n).padStart(2, '0');
            const d = new Date();
            billNumVal = `BILL-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${1001 + billCount + index}`;
          }

          // 2. Invoice Number
          let invoiceNumVal = findVal(
            'Invoice Number',
            'Invoice No',
            'Invoice #',
            'Invoice',
            'Invoice_Number'
          );
          if (!invoiceNumVal) {
            invoiceNumVal = `INV-${new Date().getFullYear()}-${5001 + index}`;
          }

          // 3. Vendor
          let vendorVal = findVal('Vendor Name', 'Vendor', 'Supplier', 'Provider', 'Company');
          if (!vendorVal) {
            vendorVal = 'Unique Business Systems';
          }

          // 4. Client
          let clientVal = findVal('Client Name', 'Client', 'Customer', 'Bank');
          if (!clientVal) {
            clientVal = defaultClient;
          }

          // 5. Client Location
          let locationVal = findVal('Client Location', 'Location', 'Branch', 'Premises', 'Office');
          if (!locationVal) {
            locationVal = defaultLocation;
          }

          // 6. Description
          let descVal = findVal('Description', 'Details', 'Particulars', 'Item Description', 'Work Done', 'Service');
          if (!descVal) {
            descVal = 'Monthly Maintenance & Hardware Support Bill';
          }

          // 7. Category / Bill Type
          let typeVal = findVal('Bill Type', 'Category', 'Type', 'Service Type');
          if (!typeVal) {
            typeVal = defaultCategory;
          }

          // 8. Amount
          let amountRaw = findVal('Amount (BDT)', 'Amount (৳)', 'Amount', 'Price', 'Total', 'Total Amount', 'Bill Amount');
          let cleanAmt = amountRaw.replace(/[^0-9.]/g, '');
          let amountVal = parseFloat(cleanAmt);
          if (isNaN(amountVal) || amountVal < 0) {
            amountVal = 0;
          }

          // 9. Dates
          let handoverVal = findVal('Handover Date', 'Handover', 'HandoverDate') || todayStr;
          let submissionVal = findVal('Submission Date', 'Submission', 'Submit Date', 'SubmissionDate', 'Date') || todayStr;
          let receivedVal = findVal('Received Date', 'Receive Date', 'ReceivedDate');
          let paymentVal = findVal('Payment Date', 'Paid Date', 'PaymentDate');

          // 10. Status
          let statusRaw = findVal('Status', 'Bill Status', 'Payment Status').toLowerCase();
          let statusVal: 'Pending' | 'Submitted' | 'Partial' | 'Paid' = 'Pending';
          if (statusRaw.includes('paid') || statusRaw.includes('done') || statusRaw.includes('complete')) {
            statusVal = 'Paid';
          } else if (statusRaw.includes('submit')) {
            statusVal = 'Submitted';
          } else if (statusRaw.includes('part')) {
            statusVal = 'Partial';
          } else {
            statusVal = 'Pending';
          }

          // 11. Payment Method
          let methodRaw = findVal('Payment Method', 'Method', 'Payment Type');
          let methodVal = methodRaw || 'Bank Transfer';

          // 12. Approved By & Remarks
          let approvedVal = findVal('Approved By', 'Approver', 'Authorized By');
          let remarksVal = findVal('Remarks', 'Note', 'Comments');

          return {
            id: `bill-${Date.now()}-${index}`,
            billNumber: billNumVal,
            invoiceNumber: invoiceNumVal,
            vendor: vendorVal,
            client: clientVal,
            clientLocation: locationVal,
            description: descVal,
            billType: typeVal,
            amount: amountVal,
            handoverDate: handoverVal,
            submissionDate: submissionVal,
            receivedDate: receivedVal,
            paymentDate: paymentVal,
            status: statusVal,
            approvedBy: approvedVal,
            paymentMethod: methodVal,
            remarks: remarksVal,
          };
        });

        setParsedData(mappedBills);
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
        'Bill Number': 'BILL-20261013-100001',
        'Invoice Number': 'INV-2026-5001',
        'Vendor Name': 'Unique Business Systems',
        'Client Name': clients[0] || 'Black Bank PLC',
        'Client Location': locations[0] || 'Gulistan Branch, Dhaka',
        'Description': 'CCTV Surveillance & DVR hardware installation and cabling',
        'Bill Type': categories[0] || 'Installation & Hardware Support',
        'Amount (BDT)': 45000,
        'Handover Date': todayStr,
        'Submission Date': todayStr,
        'Received Date': todayStr,
        'Payment Date': todayStr,
        'Status': 'Paid',
        'Payment Method': 'Bank Transfer',
        'Approved By': 'Executive Director (IT)',
        'Remarks': 'Payment disbursed via corporate BEFTN',
      },
      {
        'Bill Number': 'BILL-20261013-100002',
        'Invoice Number': 'INV-2026-5002',
        'Vendor Name': 'SecureTech Solutions',
        'Client Name': clients[1] || 'Black Bank PLC',
        'Client Location': locations[1] || 'Dhanmondi Branch, Dhaka',
        'Description': 'Biometric Access Control replacement and sensor calibration',
        'Bill Type': categories[1] || 'Quarterly Preventive Maintenance',
        'Amount (BDT)': 18500,
        'Handover Date': todayStr,
        'Submission Date': todayStr,
        'Received Date': todayStr,
        'Payment Date': '',
        'Status': 'Submitted',
        'Payment Method': 'Bank Transfer',
        'Approved By': 'Branch Operations Manager',
        'Remarks': 'Pending final accounts voucher clearance',
      },
      {
        'Bill Number': 'BILL-20261013-100003',
        'Invoice Number': 'INV-2026-5003',
        'Vendor Name': 'DataEdge Systems',
        'Client Name': clients[2] || 'Black Bank PLC',
        'Client Location': locations[2] || 'Mirpur-10 Branch, Dhaka',
        'Description': 'UPS Battery Bank routine replacement and voltage test',
        'Bill Type': categories[2] || 'Emergency Repair & Replacement',
        'Amount (BDT)': 32000,
        'Handover Date': todayStr,
        'Submission Date': todayStr,
        'Received Date': '',
        'Payment Date': '',
        'Status': 'Pending',
        'Payment Method': 'Cheque',
        'Approved By': '',
        'Remarks': 'Waiting for branch manager sign-off',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 26 },
      { wch: 38 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 24 },
      { wch: 32 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills_Template');
    XLSX.writeFile(workbook, 'Bill_Register_Import_Template.xlsx');
  };

  const handleImportSubmit = () => {
    if (parsedData.length === 0) return;

    const fullBills: BillItem[] = parsedData.map((b, index) => ({
      id: b.id || `bill-${Date.now()}-${index}`,
      billNumber: b.billNumber || `BILL-${Date.now()}-${index}`,
      invoiceNumber: b.invoiceNumber || `INV-${index + 1}`,
      vendor: b.vendor || 'Vendor',
      client: b.client || 'Client',
      clientLocation: b.clientLocation || 'Location',
      description: b.description || 'Description',
      billType: b.billType || 'General',
      amount: Number(b.amount) || 0,
      handoverDate: b.handoverDate || new Date().toISOString().split('T')[0],
      submissionDate: b.submissionDate || new Date().toISOString().split('T')[0],
      receivedDate: b.receivedDate || '',
      paymentDate: b.paymentDate || '',
      status: (b.status || 'Pending') as 'Pending' | 'Submitted' | 'Partial' | 'Paid',
      approvedBy: b.approvedBy || '',
      paymentMethod: b.paymentMethod || 'Bank Transfer',
      remarks: b.remarks || '',
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onImportBills(fullBills);
    handleModalClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Import Bills from Excel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload Excel or CSV file to batch insert corporate bills into the register
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Action Row: Sample download banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                Need the standard spreadsheet format? Download the official Bill Register template.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>

            {file ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>{file.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB — Click or drag to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Click to browse or drag & drop Excel file (.xlsx, .xls, .csv)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl mx-auto">
                  Supported columns: Bill Number, Invoice Number, Vendor, Client, Client Location, Description, Bill Type, Amount (BDT), Dates, Status, Payment Method
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
                  Preview Data ({parsedData.length} bills detected)
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Total Amount: ৳
                  {parsedData
                    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[11px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">SL</th>
                      <th className="p-2.5">Bill #</th>
                      <th className="p-2.5">Client & Location</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount (৳)</th>
                      <th className="p-2.5">Submission</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {parsedData.slice(0, 15).map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {b.billNumber}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {b.client}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {b.clientLocation}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          {b.billType}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳{(Number(b.amount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">
                          {b.submissionDate || '-'}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : b.status === 'Submitted'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : b.status === 'Partial'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 15 && (
                <p className="text-[11px] text-slate-400 text-right">
                  Showing first 15 of {parsedData.length} records...
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={parsedData.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import {parsedData.length > 0 ? `${parsedData.length} Bills` : 'Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
