import React, { useState } from 'react';
import { SIMItem, SystemOptions } from '../../types';

interface AddSIMModalProps {
  isOpen: boolean;
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveSIM: (sim: SIMItem) => void;
}

export const AddSIMModal: React.FC<AddSIMModalProps> = ({
  isOpen,
  systemOptions,
  onClose,
  onSaveSIM,
}) => {
  const [simNumber, setSimNumber] = useState('');
  const [operator, setOperator] = useState(systemOptions.simOperators[0] || 'GP');
  const [assignedDevice, setAssignedDevice] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<any>(systemOptions.simStatuses[0] || 'ACTIVE');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSIM: SIMItem = {
      id: `sim-${Date.now()}`,
      simNumber,
      operator,
      assignedDevice: assignedDevice || '-',
      location: location || '-',
      status,
    };
    onSaveSIM(newSIM);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          Add SIM Card Inventory
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">SIM Number</label>
            <input
              type="text"
              value={simNumber}
              onChange={(e) => setSimNumber(e.target.value)}
              placeholder="e.g. 01708123884"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.simOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Assigned Device</label>
            <input
              type="text"
              value={assignedDevice}
              onChange={(e) => setAssignedDevice(e.target.value)}
              placeholder="e.g. DEV-300101"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gouripur Branch"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.simStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-bold cursor-pointer hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
            >
              Add SIM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
