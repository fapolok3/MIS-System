import React, { useState, useEffect } from 'react';
import { SIMItem, SystemOptions } from '../../types';

interface EditSIMModalProps {
  isOpen: boolean;
  simItem: SIMItem | null;
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveSIM: (updatedSim: SIMItem) => void;
}

export const EditSIMModal: React.FC<EditSIMModalProps> = ({
  isOpen,
  simItem,
  systemOptions,
  onClose,
  onSaveSIM,
}) => {
  const [formData, setFormData] = useState<SIMItem | null>(null);

  useEffect(() => {
    if (simItem) {
      setFormData({ ...simItem });
    }
  }, [simItem]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSIM(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          Edit SIM Card ({formData.simNumber})
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">SIM Number</label>
            <input
              type="text"
              value={formData.simNumber}
              onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Operator</label>
            <select
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
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
              value={formData.assignedDevice}
              onChange={(e) => setFormData({ ...formData, assignedDevice: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
