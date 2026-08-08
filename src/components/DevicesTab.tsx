import React, { useState, useEffect } from 'react';
import { Cpu, Plus, FileSpreadsheet, Download, Upload, Edit, Trash2 } from 'lucide-react';
import { Device } from '../types';
import { Pagination } from './Pagination';
import { downloadStyledExcel } from '../utils/excelExport';

interface DevicesTabProps {
  activeCategory: string;
  devices: Device[];
  searchQuery: string;
  onOpenAddDeviceModal: () => void;
  onOpenEditDeviceModal: (device: Device) => void;
  onDeleteDevice: (sl: number) => void;
  onOpenExcelUploadModal?: () => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  activeCategory,
  devices,
  searchQuery,
  onOpenAddDeviceModal,
  onOpenEditDeviceModal,
  onDeleteDevice,
  onOpenExcelUploadModal,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  // Filter devices by category and search query
  const filteredDevices = devices.filter((d) => {
    const matchesCategory =
      (d.category || '').trim().toLowerCase() === (activeCategory || '').trim().toLowerCase();
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.id || (d as any).deviceId || '').toLowerCase().includes(q) ||
      (d.sol || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q) ||
      (d.sim || '').toLowerCase().includes(q) ||
      (d.district || '').toLowerCase().includes(q) ||
      (d.operator || '').toLowerCase().includes(q)
    );
  });

  // Calculate paginated slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const headers = [
      'SL',
      'Category',
      'Status',
      'SOL NO',
      'Location',
      'Device ID',
      'SIM No',
      'Operator',
      'Floor',
      'Placement',
      'Access Type',
      'BM',
      'Price',
      'District',
      'Install Date',
    ];

    const rows = filteredDevices.map((d, index) => [
      index + 1,
      d.category || activeCategory,
      d.status,
      d.sol,
      d.location,
      d.id,
      d.sim,
      d.operator,
      d.floor,
      d.placement,
      d.accessType,
      d.bm,
      d.price,
      d.district,
      d.installDate,
    ]);

    const liveCount = filteredDevices.filter((d) => d.status === 'LIVE').length;
    const offlineCount = filteredDevices.filter((d) => d.status === 'OFFLINE').length;

    downloadStyledExcel({
      title: `${activeCategory} Devices Inventory`,
      subtitle: `MIS Device Registry for ${activeCategory} Category`,
      filename: `${activeCategory.replace(/\s+/g, '_')}_Devices_Report.xls`,
      headers,
      data: rows,
      summaryCards: [
        { label: 'Total Registered Devices', value: filteredDevices.length },
        { label: 'Live Devices', value: liveCount },
        { label: 'Offline / Maintenance', value: offlineCount },
      ],
    });
  };

  const handleDownloadSample = () => {
    const sampleHeaders = [
      'Status',
      'SOL NO',
      'Location',
      'Device ID',
      'SIM No',
      'Operator',
      'Floor',
      'Placement',
      'Access Type',
      'BM',
      'Price',
      'District',
      'Install Date',
    ];
    const sampleRow = [
      'LIVE',
      '9941',
      'Gouripur Branch',
      '300101',
      '01708123884',
      'GP',
      '1st Floor',
      'Main Vault Gate',
      'ENTRY/EXIT',
      '-',
      '৳ 65,000',
      'Mymensingh',
      '2026-02-10',
    ];

    downloadStyledExcel({
      title: `Sample Device Upload Template`,
      subtitle: `Template format for Excel Batch Upload in MIS System`,
      filename: `Device_Upload_Sample_Template.xls`,
      headers: sampleHeaders,
      data: [sampleRow],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center">
            <Cpu className="w-4 h-4 text-indigo-400 mr-2" />
            Category:{' '}
            <span className="text-indigo-400 ml-1">{activeCategory}</span> Devices
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Items:{' '}
            <span className="font-bold text-slate-200">
              {filteredDevices.length}
            </span>{' '}
            Registered Devices
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={onOpenAddDeviceModal}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Device
          </button>
          {onOpenExcelUploadModal && (
            <button
              onClick={onOpenExcelUploadModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload from Excel
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition shadow flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={handleDownloadSample}
            className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Sample Excel
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
            <thead className="bg-slate-950 text-slate-300 uppercase font-bold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-slate-800">SL</th>
                <th className="p-2.5 border-r border-slate-800">Status</th>
                <th className="p-2.5 border-r border-slate-800 bg-indigo-950/50 text-indigo-300">
                  SOL NO
                </th>
                <th className="p-2.5 border-r border-slate-800">Location</th>
                <th className="p-2.5 border-r border-slate-800">Device ID</th>
                <th className="p-2.5 border-r border-slate-800">SIM No</th>
                <th className="p-2.5 border-r border-slate-800">Operator</th>
                <th className="p-2.5 border-r border-slate-800">Floor</th>
                <th className="p-2.5 border-r border-slate-800">Placement</th>
                <th className="p-2.5 border-r border-slate-800">Access Type</th>
                <th className="p-2.5 border-r border-slate-800">BM</th>
                <th className="p-2.5 border-r border-slate-800">Price</th>
                <th className="p-2.5 border-r border-slate-800">District</th>
                <th className="p-2.5 border-r border-slate-800">Install Date</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    className="text-center p-4 text-slate-500 font-sans"
                  >
                    No devices found in {activeCategory}
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((item, idx) => {
                  const globalIdx = startIndex + idx;
                  const statusBadge =
                    item.status === 'LIVE' ? (
                      <span className="bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded text-[10px]">
                        LIVE
                      </span>
                    ) : item.status === 'OFFLINE' ? (
                      <span className="bg-rose-900/50 text-rose-300 border border-rose-700/50 px-2 py-0.5 rounded text-[10px]">
                        OFFLINE
                      </span>
                    ) : (
                      <span className="bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px]">
                        MAINTENANCE
                      </span>
                    );

                  const operatorColor =
                    item.operator === 'GP'
                      ? 'text-blue-400'
                      : item.operator === 'Robi'
                      ? 'text-rose-400'
                      : item.operator === 'Banglalink'
                      ? 'text-amber-400'
                      : 'text-emerald-400';

                  return (
                    <tr key={item.sl} className="hover:bg-slate-800/40">
                      <td className="p-2.5 border-r border-slate-800 font-bold">
                        {globalIdx + 1}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {statusBadge}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-bold bg-indigo-950/30 text-indigo-300">
                        {item.sol}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.location}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-bold text-indigo-400">
                        {item.id}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {item.sim || '-'}
                      </td>
                      <td
                        className={`p-2.5 border-r border-slate-800 font-sans font-bold ${operatorColor}`}
                      >
                        {item.operator}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.floor || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.placement || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.accessType || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.bm || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {item.price || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {item.district || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {item.installDate || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenEditDeviceModal(item)}
                            className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> EDIT
                          </button>
                          <button
                            onClick={() => onDeleteDevice(item.sl)}
                            className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> DELETE
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredDevices.length > 0 && (
          <div className="px-4 pb-3 bg-slate-900/60 border-t border-slate-800">
            <Pagination
              totalItems={filteredDevices.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
