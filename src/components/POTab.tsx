import React from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface POTabProps {
  pos: PurchaseOrder[];
  onOpenAddPOModal: () => void;
  onDeletePO: (id: string) => void;
}

export const POTab: React.FC<POTabProps> = ({ pos, onOpenAddPOModal, onDeletePO }) => {
  const totalCount = pos.length;
  const completeCount = pos.filter((p) => p.status === 'COMPLETED').length;
  const ongoingCount = pos.filter((p) => p.status === 'ONGOING').length;
  const pendingCount = pos.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex justify-between items-center">
        <h2 className="text-sm font-bold text-white uppercase flex items-center">
          <FileText className="w-4 h-4 text-indigo-400 mr-2" />
          Purchase Order (PO) Tracker
        </h2>

        <button
          onClick={onOpenAddPOModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Create New PO
        </button>
      </div>

      {/* PO DASHBOARD CARDS INTEGRATED */}
      <div className="po-card-grid">
        <div className="po-card total">
          <div className="po-card-title">Total PO</div>
          <div className="po-card-value">{totalCount}</div>
        </div>
        <div className="po-card complete">
          <div className="po-card-title">Total PO Complete</div>
          <div className="po-card-value">{completeCount}</div>
        </div>
        <div className="po-card ongoing">
          <div className="po-card-title">Ongoing</div>
          <div className="po-card-value">{ongoingCount}</div>
        </div>
        <div className="po-card pending">
          <div className="po-card-title">Pending</div>
          <div className="po-card-value">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-300 uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="p-3">PO Number</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Category</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Total Price</th>
              <th className="p-3">PO Issue Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
            {pos.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-slate-500 font-sans">
                  No Purchase Orders recorded.
                </td>
              </tr>
            ) : (
              pos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-indigo-400 font-bold">{po.poNumber}</td>
                  <td className="p-3 font-sans">{po.vendor}</td>
                  <td className="p-3 font-sans">{po.category}</td>
                  <td className="p-3">{po.qty} Devices</td>
                  <td className="p-3">{po.totalPrice}</td>
                  <td className="p-3">{po.issueDate}</td>
                  <td className="p-3">
                    {po.status === 'COMPLETED' ? (
                      <span className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-sans text-[10px] border border-emerald-700/50">
                        COMPLETED
                      </span>
                    ) : po.status === 'ONGOING' ? (
                      <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded font-sans text-[10px] border border-amber-700/50">
                        ONGOING
                      </span>
                    ) : (
                      <span className="bg-rose-900/50 text-rose-300 px-2 py-0.5 rounded font-sans text-[10px] border border-rose-700/50">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDeletePO(po.id)}
                      className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer inline-flex items-center gap-1"
                      title="Delete Purchase Order"
                    >
                      <Trash2 className="w-3 h-3" /> DELETE
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
