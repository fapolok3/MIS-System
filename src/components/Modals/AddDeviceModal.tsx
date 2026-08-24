import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Device, SystemOptions, CategoryGroup } from '../../types';

interface AddDeviceModalProps {
  isOpen: boolean;
  activeCategory: string;
  categoryGroups?: CategoryGroup[];
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveDevice: (device: Omit<Device, 'sl'>) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  activeCategory,
  categoryGroups = [],
  systemOptions,
  onClose,
  onSaveDevice,
}) => {
  const [category, setCategory] = useState(activeCategory);
  const [status, setStatus] = useState<string>(systemOptions.deviceStatuses[0] || 'LIVE');
  const [sol, setSol] = useState('');
  const [location, setLocation] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [sim, setSim] = useState('');
  const [operator, setOperator] = useState<string>(systemOptions.simOperators[0] || 'GP');
  const [floor, setFloor] = useState('');
  const [placement, setPlacement] = useState('');
  const [accessType, setAccessType] = useState<string>(systemOptions.accessTypes[0] || 'ENTRY/EXIT');
  const [bm, setBm] = useState('-');
  const [price, setPrice] = useState('৳ 65,000');
  const [district, setDistrict] = useState('');
  const [installDate, setInstallDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Sync category and reset fields when modal opens or activeCategory changes
  useEffect(() => {
    if (isOpen) {
      setCategory(activeCategory);
      setSol('');
      setLocation('');
      setDeviceId('');
      setSim('');
      setFloor('');
      setPlacement('');
      setBm('-');
      setDistrict('');
      setPrice('৳ 65,000');
      setInstallDate(new Date().toISOString().split('T')[0]);
      setStatus(systemOptions.deviceStatuses[0] || 'LIVE');
      setOperator(systemOptions.simOperators[0] || 'GP');
      setAccessType(systemOptions.accessTypes[0] || 'ENTRY/EXIT');
    }
  }, [isOpen, activeCategory, systemOptions]);

  if (!isOpen) return null;

  // Flatten all category items from categoryGroups for selection option
  const allCategoryItems = categoryGroups.flatMap((g) => g.items);
  if (activeCategory && !allCategoryItems.includes(activeCategory)) {
    allCategoryItems.unshift(activeCategory);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDevice({
      category: category || activeCategory,
      status: status as any,
      sol,
      location,
      id: deviceId,
      sim,
      operator: operator as any,
      floor,
      placement,
      accessType,
      bm,
      price,
      district,
      installDate,
    });
    onClose();
  };

  const isHeadOffice = (category || activeCategory || '').trim().toLowerCase() === 'all head office units';

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center">
          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-2" />
          Add New Device ({category || activeCategory})
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Category Group / Branch</label>
            {allCategoryItems.length > 0 ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              value={sol}
              onChange={(e) => setSol(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Location Name</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SIM Number</label>
            <input
              type="text"
              value={sim}
              onChange={(e) => setSim(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
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
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Placement</label>
            <input
              type="text"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Access Type</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
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
              value={bm}
              onChange={(e) => setBm(e.target.value)}
              placeholder={isHeadOffice ? 'e.g. Finance / HR / ICT' : 'e.g. BM Name'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Price</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="৳ 65,000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              {isHeadOffice ? 'Division' : 'District'}
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={isHeadOffice ? 'e.g. Operations / Retail' : 'e.g. Dhaka'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Install Date</label>
            <input
              type="date"
              value={installDate}
              onChange={(e) => setInstallDate(e.target.value)}
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
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer shadow-xs"
            >
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
