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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center">
          <Edit className="w-4 h-4 text-indigo-400 mr-2" />
          Edit Device Details
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Category Group / Branch</label>
            {allCategoryItems.length > 0 ? (
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
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
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
              />
            )}
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                handleChange('status', e.target.value)
              }
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.deviceStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">SOL No</label>
            <input
              type="text"
              value={formData.sol}
              onChange={(e) => handleChange('sol', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location Name</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Device ID</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">SIM Number</label>
            <input
              type="text"
              value={formData.sim}
              onChange={(e) => handleChange('sim', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Operator</label>
            <select
              value={formData.operator}
              onChange={(e) =>
                handleChange('operator', e.target.value)
              }
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
            <label className="block text-slate-400 mb-1">Floor</label>
            <input
              type="text"
              value={formData.floor}
              onChange={(e) => handleChange('floor', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Placement</label>
            <input
              type="text"
              value={formData.placement}
              onChange={(e) => handleChange('placement', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Access Type</label>
            <select
              value={formData.accessType}
              onChange={(e) => handleChange('accessType', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.accessTypes.map((at) => (
                <option key={at} value={at}>
                  {at}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">BM</label>
            <input
              type="text"
              value={formData.bm}
              onChange={(e) => handleChange('bm', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Price</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">District</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-400 mb-1">Install Date</label>
            <input
              type="date"
              value={formData.installDate}
              onChange={(e) => handleChange('installDate', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div className="col-span-2 flex justify-end space-x-2 pt-3 border-t border-slate-800">
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
