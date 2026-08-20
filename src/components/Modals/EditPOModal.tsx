import React, { useState, useEffect } from 'react';
import { PurchaseOrder, SystemOptions, CategoryGroup } from '../../types';

interface EditPOModalProps {
  isOpen: boolean;
  po: PurchaseOrder | null;
  categoryGroups?: CategoryGroup[];
  systemOptions: SystemOptions;
  onClose: () => void;
  onSavePO: (updatedPO: PurchaseOrder) => void;
}

export const EditPOModal: React.FC<EditPOModalProps> = ({
  isOpen,
  po,
  categoryGroups = [],
  systemOptions,
  onClose,
  onSavePO,
}) => {
  const [formData, setFormData] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (po) {
      setFormData({ ...po });
    }
  }, [po]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePO(formData);
    onClose();
  };

  const allCategoryItems = categoryGroups.flatMap((g) => g.items);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          Edit Purchase Order ({formData.poNumber})
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">PO Number</label>
            <input
              type="text"
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Vendor Name</label>
            <select
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Category (Device MIS Tree)</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {categoryGroups.length > 0 ? (
                categoryGroups.map((group) => (
                  <optgroup
                    key={group.id}
                    label={group.title}
                    className="bg-slate-900 text-indigo-400 font-bold"
                  >
                    {group.items.map((item) => (
                      <option
                        key={item}
                        value={item}
                        className="bg-slate-800 text-slate-100 font-normal"
                      >
                        {item}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                <option value={formData.category}>{formData.category}</option>
              )}
              {formData.category && !allCategoryItems.includes(formData.category) && (
                <optgroup label="Current" className="bg-slate-900 text-slate-400">
                  <option value={formData.category} className="bg-slate-800 text-white">
                    {formData.category}
                  </option>
                </optgroup>
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 1 })}
                min={1}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Total Price</label>
              <input
                type="text"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Issue Date</label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              required
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
              {systemOptions.poStatuses.map((st) => (
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
