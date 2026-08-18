import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Device } from '../../types';

interface ExcelUploadModalProps {
  isOpen: boolean;
  activeCategory: string;
  onClose: () => void;
  onImportDevices: (devices: Device[]) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  activeCategory,
  onClose,
  onImportDevices,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Device>[]>([]);
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

        // Map flexible headers
        const mappedDevices: Partial<Device>[] = rawData.map((row) => {
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

          const categoryVal = findVal('Category', 'Cat', 'Device Category') || activeCategory;
          const statusVal = findVal('Status', 'Device Status') || 'LIVE';
          const solVal = findVal('SOL NO', 'SOL', 'SOL No', 'Sol Number') || '-';
          const locationVal = findVal('Location Name', 'Location', 'Branch', 'Site Name') || 'Branch Location';
          const deviceIdVal = findVal('Device ID', 'ID', 'DeviceId', 'Device_ID') || `DEV-${Math.floor(100000 + Math.random() * 900000)}`;
          const simVal = findVal('SIM No', 'SIM Number', 'SIM', 'MSISDN') || '-';
          const operatorVal = findVal('Operator', 'SIM Operator', 'Telco') || 'GP';
          const floorVal = findVal('Floor', 'Floor Level') || 'Ground Floor';
          const placementVal = findVal('Placement', 'Placement Area', 'Position') || 'Main Gate';
          const accessTypeVal = findVal('Access Type', 'Access') || 'ENTRY/EXIT';
          const bmVal = findVal('Department', 'Dept', 'BM', 'Branch Manager') || '-';
          const priceVal = findVal('Price', 'Device Price', 'Cost') || '৳ 65,000';
          const districtVal = findVal('Division', 'Div', 'District', 'City', 'Region') || 'Dhaka';
          const installDateVal = findVal('Install Date', 'Date', 'Installation Date') || new Date().toISOString().split('T')[0];

          return {
            category: categoryVal,
            status: statusVal as any,
            sol: solVal,
            location: locationVal,
            id: deviceIdVal,
            sim: simVal,
            operator: operatorVal as any,
            floor: floorVal,
            placement: placementVal,
            accessType: accessTypeVal,
            bm: bmVal,
            price: priceVal,
            district: districtVal,
            installDate: installDateVal,
          };
        });

        setParsedData(mappedDevices);
      } catch (err: any) {
        console.error(err);
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls or .csv file.');
        setParsedData([]);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const isHeadOffice = (activeCategory || '').trim().toLowerCase() === 'all head office units';

  const handleDownloadSampleExcel = () => {
    const sampleRows = isHeadOffice
      ? [
          {
            Category: activeCategory || 'All Head Office Units',
            Status: 'LIVE',
            'SOL NO': 'HO-01',
            'Location Name': 'Head Office Tower',
            'Device ID': 'HO-300101',
            'SIM No': '01708123884',
            Operator: 'GP',
            Floor: '8th Floor',
            Placement: 'Server Room',
            'Access Type': 'BIOMETRIC',
            Department: 'Information Technology (IT)',
            Price: '৳ 65,000',
            Division: 'Operations & IT',
            'Install Date': '2026-02-10',
          },
          {
            Category: activeCategory || 'All Head Office Units',
            Status: 'LIVE',
            'SOL NO': 'HO-02',
            'Location Name': 'Head Office Annex',
            'Device ID': 'HO-300102',
            'SIM No': '01819234567',
            Operator: 'Robi',
            Floor: '4th Floor',
            Placement: 'HR Executive Entry',
            'Access Type': 'FACE RECOGNITION',
            Department: 'Human Resources (HR)',
            Price: '৳ 70,000',
            Division: 'Human Resource Division',
            'Install Date': '2026-03-15',
          },
        ]
      : [
          {
            Category: activeCategory || 'ACCESS CONTROL SYSTEM',
            Status: 'LIVE',
            'SOL NO': '9941',
            'Location Name': 'Gouripur Branch',
            'Device ID': '300101',
            'SIM No': '01708123884',
            Operator: 'GP',
            Floor: '1st Floor',
            Placement: 'Main Vault Gate',
            'Access Type': 'ENTRY/EXIT',
            BM: 'Mr. Karim',
            Price: '৳ 65,000',
            District: 'Mymensingh',
            'Install Date': '2026-02-10',
          },
          {
            Category: activeCategory || 'ACCESS CONTROL SYSTEM',
            Status: 'LIVE',
            'SOL NO': '9942',
            'Location Name': 'Uttara Branch',
            'Device ID': '300102',
            'SIM No': '01819234567',
            Operator: 'Robi',
            Floor: 'Ground Floor',
            Placement: 'Server Room Gate',
            'Access Type': 'ENTRY ONLY',
            BM: 'Mr. Rahman',
            Price: '৳ 70,000',
            District: 'Dhaka',
            'Install Date': '2026-03-15',
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');
    XLSX.writeFile(workbook, `${activeCategory.replace(/\s+/g, '_')}_Import_Template.xlsx`);
  };

  const handleImportSubmit = () => {
    if (parsedData.length === 0) return;

    const fullDevices: Device[] = parsedData.map((d, index) => ({
      sl: 0, // Will be auto assigned
      category: d.category || activeCategory,
      status: d.status || 'LIVE',
      sol: d.sol || '-',
      location: d.location || 'Unknown Location',
      id: d.id || `DEV-${Date.now()}-${index}`,
      sim: d.sim || '-',
      operator: d.operator || 'GP',
      floor: d.floor || 'Ground Floor',
      placement: d.placement || 'Main Area',
      accessType: d.accessType || 'ENTRY/EXIT',
      bm: d.bm || '-',
      price: d.price || '৳ 0',
      district: d.district || 'Dhaka',
      installDate: d.installDate || new Date().toISOString().split('T')[0],
    }));

    onImportDevices(fullDevices);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Upload Devices from Excel
              </h3>
              <p className="text-xs text-slate-400">
                Bulk import device records into <span className="text-emerald-400 font-semibold">{activeCategory}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Action Row: Sample download banner */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex flex-wrap justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Need a formatted Excel file? Download our standard template.</span>
            </div>
            <button
              onClick={handleDownloadSampleExcel}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
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
                ? 'border-emerald-400 bg-emerald-950/20 text-emerald-300'
                : file
                ? 'border-slate-600 bg-slate-800/40 text-slate-200'
                : 'border-slate-700 bg-slate-950/50 hover:border-slate-500 text-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
              <Upload className="w-6 h-6" />
            </div>
            {file ? (
              <div>
                <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {file.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB — Click or drag to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-200">
                  Click to browse or drag & drop Excel file (.xlsx, .xls, .csv)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports columns: Category, Status, SOL NO, Location Name, Device ID, SIM No, Operator, Floor, Placement, Access Type, {isHeadOffice ? 'Department' : 'BM'}, Price, {isHeadOffice ? 'Division' : 'District'}, Install Date
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 uppercase tracking-wide">
                  Preview Data ({parsedData.length} records found)
                </span>
                <span className="text-emerald-400 text-[11px] font-mono">
                  Ready to import
                </span>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-56">
                <table className="w-full text-left text-[11px] border-collapse min-w-[900px]">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2 border-r border-slate-800">#</th>
                      <th className="p-2 border-r border-slate-800">Category</th>
                      <th className="p-2 border-r border-slate-800">Device ID</th>
                      <th className="p-2 border-r border-slate-800">SOL</th>
                      <th className="p-2 border-r border-slate-800">Location</th>
                      <th className="p-2 border-r border-slate-800">Status</th>
                      <th className="p-2 border-r border-slate-800">SIM No</th>
                      <th className="p-2 border-r border-slate-800">Operator</th>
                      <th className="p-2">{isHeadOffice ? 'Division' : 'District'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="p-2 border-r border-slate-800 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-800 text-emerald-400 font-bold">{row.category}</td>
                        <td className="p-2 border-r border-slate-800 font-bold text-indigo-300">{row.id}</td>
                        <td className="p-2 border-r border-slate-800">{row.sol}</td>
                        <td className="p-2 border-r border-slate-800">{row.location}</td>
                        <td className="p-2 border-r border-slate-800">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'LIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-800">{row.sim}</td>
                        <td className="p-2 border-r border-slate-800">{row.operator}</td>
                        <td className="p-2">{row.district}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleImportSubmit}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
              parsedData.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import {parsedData.length > 0 ? `${parsedData.length} Devices` : 'Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
