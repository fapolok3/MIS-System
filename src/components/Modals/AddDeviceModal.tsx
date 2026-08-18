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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center">
          <Plus className="w-4 h-4 text-emerald-400 mr-2" />
          Add New Device ({category || activeCategory})
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Category Group / Branch</label>
            {allCategoryItems.length > 0 ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
              />
            )}
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              value={sol}
              onChange={(e) => setSol(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location Name</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">SIM Number</label>
            <input
              type="text"
              value={sim}
              onChange={(e) => setSim(e.target.value)}
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
            <label className="block text-slate-400 mb-1">Floor</label>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Placement</label>
            <input
              type="text"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Access Type</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
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
            <label className="block text-slate-400 mb-1">
              {isHeadOffice ? 'Department' : 'BM'}
            </label>
            <input
              type="text"
              value={bm}
              onChange={(e) => setBm(e.target.value)}
              placeholder={isHeadOffice ? 'e.g. Finance / HR / ICT' : 'e.g. BM Name'}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Price</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="৳ 65,000"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              {isHeadOffice ? 'Division' : 'District'}
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={isHeadOffice ? 'e.g. Operations / Retail' : 'e.g. Dhaka'}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-400 mb-1">Install Date</label>
            <input
              type="date"
              value={installDate}
              onChange={(e) => setInstallDate(e.target.value)}
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
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
            >
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
