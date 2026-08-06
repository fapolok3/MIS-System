import React from 'react';
import { Smartphone, Plus, Trash2 } from 'lucide-react';
import { SIMItem } from '../types';

interface SIMTabProps {
  sims: SIMItem[];
  onOpenAddSIMModal: () => void;
  onDeleteSIM: (id: string) => void;
}

export const SIMTab: React.FC<SIMTabProps> = ({
  sims,
  onOpenAddSIMModal,
  onDeleteSIM,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex justify-between items-center">
        <h2 className="text-sm font-bold text-white uppercase flex items-center">
          <Smartphone className="w-4 h-4 text-indigo-400 mr-2" />
          Cellular SIM Inventory & Assignment
        </h2>
        <button
          onClick={onOpenAddSIMModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add SIM
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-300 uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="p-3">SIM Number</th>
              <th className="p-3">Operator</th>
              <th className="p-3">Assigned Device</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
            {sims.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">
                  No SIM cards registered.
                </td>
              </tr>
            ) : (
              sims.map((sim) => (
                <tr key={sim.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold">{sim.simNumber}</td>
                  <td className="p-3 font-sans font-bold text-blue-400">
                    {sim.operator}
                  </td>
                  <td className="p-3 text-indigo-400">{sim.assignedDevice}</td>
                  <td className="p-3 font-sans">{sim.location}</td>
                  <td className="p-3">
                    {sim.status === 'ACTIVE' ? (
                      <span className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded text-[10px] border border-emerald-700/50">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="bg-rose-900/50 text-rose-300 px-2 py-0.5 rounded text-[10px] border border-rose-700/50">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDeleteSIM(sim.id)}
                      className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1 mx-auto"
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
