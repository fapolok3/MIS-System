import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { Device, SystemOptions, CategoryGroup } from '../../types';

interface EditDeviceModalProps {
  device: Device | null;
  isOpen: boolean;
  categoryGroups?: CategoryGroup[];
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveDevice: (device: Device) => void;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  device,
  isOpen,
  categoryGroups = [],
  systemOptions,
  onClose,
  onSaveDevice,
}) => {
  const [formData, setFormData] = useState<Device | null>(device);

  useEffect(() => {
    setFormData(device);
  }, [device]);

  if (!isOpen || !formData) return null;

  // Flatten all category items from categoryGroups for selection option
  const allCategoryItems = categoryGroups.flatMap((g) => g.items);
  if (formData.category && !allCategoryItems.includes(formData.category)) {
    allCategoryItems.unshift(formData.category);
  }

  const handleChange = (
    field: keyof Device,
    value: string | number
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSaveDevice(formData);
      onClose();
    }
  };

  const isHeadOffice = (formData.category || '').trim().toLowerCase() === 'all head office units';

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center">
          <Edit className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
          Edit Device Details
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Category Group / Branch</label>
            {allCategoryItems.length > 0 ? (
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {allCategoryItems.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                handleChange('status', e.target.value)
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.deviceStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SOL No</label>
            <input
              type="text"
              value={formData.sol}
              onChange={(e) => handleChange('sol', e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Location Name</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Device ID</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SIM Number</label>
            <input
              type="text"
              value={formData.sim}
              onChange={(e) => handleChange('sim', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Operator</label>
            <select
              value={formData.operator}
              onChange={(e) =>
                handleChange('operator', e.target.value)
              }
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
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Floor</label>
            <input
              type="text"
              value={formData.floor}
              onChange={(e) => handleChange('floor', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Placement</label>
            <input
              type="text"
              value={formData.placement}
              onChange={(e) => handleChange('placement', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Access Type</label>
            <select
              value={formData.accessType}
              onChange={(e) => handleChange('accessType', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.accessTypes.map((at) => (
                <option key={at} value={at}>
                  {at}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              {isHeadOffice ? 'Department' : 'BM'}
            </label>
            <input
              type="text"
              value={formData.bm}
              onChange={(e) => handleChange('bm', e.target.value)}
              placeholder={isHeadOffice ? 'e.g. Finance / HR / ICT' : 'e.g. BM Name'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Price</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              {isHeadOffice ? 'Division' : 'District'}
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder={isHeadOffice ? 'e.g. Operations / Retail' : 'e.g. Dhaka'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Install Date</label>
            <input
              type="date"
              value={formData.installDate}
              onChange={(e) => handleChange('installDate', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="col-span-2 flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
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
