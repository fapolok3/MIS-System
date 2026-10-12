import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PurchaseOrder, SystemOptions, CategoryGroup } from '../../types';

interface POExcelUploadModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onImportPOs: (pos: PurchaseOrder[]) => void;
  systemOptions?: SystemOptions;
  categoryGroups?: CategoryGroup[];
  poCount?: number;
}

export const POExcelUploadModal: React.FC<POExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportPOs,
  systemOptions,
  categoryGroups = [],
  poCount = 0,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<PurchaseOrder>[]>([]);
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
        const defaultVendor = systemOptions?.vendors?.[0] || 'BracNet Ltd';
        const defaultCategory = categoryGroups?.[0]?.items?.[0] || 'Main Branch';
        const defaultStatus = systemOptions?.poStatuses?.[0] || 'ONGOING';

        const mappedPOs: Partial<PurchaseOrder>[] = rawData.map((row, index) => {
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

          // 1. PO Number
          let poNumberVal = findVal(
            'PO Number',
            'PONumber',
            'PO No',
            'PO #',
            'Order Number',
            'PO_Number'
          );
          if (!poNumberVal) {
            poNumberVal = `PO-${new Date().getFullYear()}-${9901 + poCount + index}`;
          }

          // 2. Vendor
          let vendorVal = findVal('Vendor Name', 'Vendor', 'Supplier', 'Provider', 'Company');
          if (!vendorVal) {
            vendorVal = defaultVendor;
          }

          // 3. Category / Deployment
          let categoryVal = findVal(
            'Category',
            'Category / Deployment',
            'Deployment Category',
            'Location Category',
            'Device Category',
            'Type'
          );
          if (!categoryVal) {
            categoryVal = defaultCategory;
          }

          // 4. Quantity
          let qtyRaw = findVal('Device Quantity', 'Quantity', 'Qty', 'Unit Qty', 'Count');
          let qtyVal = parseInt(qtyRaw.replace(/[^0-9]/g, ''), 10);
          if (isNaN(qtyVal) || qtyVal <= 0) {
            qtyVal = 1;
          }

          // 5. Total Price
          let priceRaw = findVal('Total Price', 'Price', 'Amount', 'Total Amount', 'Total Cost', 'Cost');
          let priceVal = priceRaw;
          if (!priceVal) {
            priceVal = '৳ 0';
          } else if (!priceVal.startsWith('৳') && !priceVal.toLowerCase().includes('bdt')) {
            priceVal = `৳ ${priceVal}`;
          }

          // 6. Issue Date
          let dateVal = findVal('PO Issue Date', 'Issue Date', 'Date', 'Order Date', 'Creation Date');
          if (!dateVal) {
            dateVal = todayStr;
          }

          // 7. Status
          let statusVal = findVal('Fulfillment Status', 'Status', 'PO Status', 'Order Status').toUpperCase();
          if (!['PENDING', 'ONGOING', 'COMPLETED'].includes(statusVal)) {
            if (statusVal.includes('DONE') || statusVal.includes('COMPLETE')) {
              statusVal = 'COMPLETED';
            } else if (statusVal.includes('WAIT') || statusVal.includes('PEND')) {
              statusVal = 'PENDING';
            } else {
              statusVal = defaultStatus;
            }
          }

          return {
            id: `po-${Date.now()}-${index}`,
            poNumber: poNumberVal,
            vendor: vendorVal,
            category: categoryVal,
            qty: qtyVal,
            totalPrice: priceVal,
            issueDate: dateVal,
            status: statusVal as 'PENDING' | 'ONGOING' | 'COMPLETED',
          };
        });

        setParsedData(mappedPOs);
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
        'PO Number': 'PO-2026-9901',
        'Vendor Name': systemOptions?.vendors?.[0] || 'BracNet Ltd',
        'Category / Deployment': 'Main Branch',
        'Device Quantity': 25,
        'Total Price': '৳ 1,625,000',
        'PO Issue Date': todayStr,
        'Fulfillment Status': 'ONGOING',
      },
      {
        'PO Number': 'PO-2026-9902',
        'Vendor Name': systemOptions?.vendors?.[1] || 'Flora Systems',
        'Category / Deployment': 'Sub Branch',
        'Device Quantity': 15,
        'Total Price': '৳ 975,000',
        'PO Issue Date': todayStr,
        'Fulfillment Status': 'COMPLETED',
      },
      {
        'PO Number': 'PO-2026-9903',
        'Vendor Name': systemOptions?.vendors?.[2] || 'Smart Technologies',
        'Category / Deployment': 'Data Centre (DC)',
        'Device Quantity': 8,
        'Total Price': '৳ 520,000',
        'PO Issue Date': todayStr,
        'Fulfillment Status': 'PENDING',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase_Orders');
    XLSX.writeFile(workbook, 'Purchase_Order_Import_Template.xlsx');
  };

  const handleImportSubmit = () => {
    if (parsedData.length === 0) return;

    const fullPOs: PurchaseOrder[] = parsedData.map((p, index) => ({
      id: p.id || `po-${Date.now()}-${index}`,
      poNumber: p.poNumber || `PO-2026-${9901 + poCount + index}`,
      vendor: p.vendor || 'BracNet Ltd',
      category: p.category || 'Main Branch',
      qty: p.qty || 1,
      totalPrice: p.totalPrice || '৳ 0',
      issueDate: p.issueDate || new Date().toISOString().split('T')[0],
      status: (p.status || 'ONGOING') as any,
    }));

    onImportPOs(fullPOs);
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
                Bulk Import Purchase Orders (PO)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload Excel or CSV file to batch insert purchase orders into the system
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
                Need the standard spreadsheet format? Download the official Purchase Order template.
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
                  Supported columns: PO Number, Vendor Name, Category / Deployment, Device Quantity, Total Price, PO Issue Date, Fulfillment Status
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
                  Preview Data ({parsedData.length} purchase orders found)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                  Ready to import
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-56">
                <table className="w-full text-left text-[11px] border-collapse min-w-[700px]">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">#</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">PO Number</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Vendor</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Category</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Qty</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Total Price</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800">Issue Date</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-300">{row.poNumber}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-800 dark:text-slate-200">{row.vendor}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-sans">{row.category}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.qty}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">{row.totalPrice}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">{row.issueDate}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : row.status === 'ONGOING'
                              ? 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                              : 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
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
            onClick={handleModalClose}
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
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import {parsedData.length > 0 ? `${parsedData.length} Purchase Orders` : 'Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
