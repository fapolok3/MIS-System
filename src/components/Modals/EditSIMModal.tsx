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
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
          Edit SIM Card ({formData.simNumber})
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              SIM Number <span className="text-slate-400 font-normal">(Optional / Can be blank)</span>
            </label>
            <input
              type="text"
              value={formData.simNumber}
              onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
              placeholder="Leave empty for blank"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Operator</label>
            <select
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.simOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Assigned Device</label>
            <input
              type="text"
              value={formData.assignedDevice}
              onChange={(e) => setFormData({ ...formData, assignedDevice: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.simStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
