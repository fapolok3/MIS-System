import React, { useState, useEffect } from 'react';
import { PurchaseOrder, SystemOptions, CategoryGroup } from '../../types';

interface AddPOModalProps {
  isOpen: boolean;
  categoryGroups?: CategoryGroup[];
  systemOptions: SystemOptions;
  onClose: () => void;
  onSavePO: (po: PurchaseOrder) => void;
  poCount: number;
}

export const AddPOModal: React.FC<AddPOModalProps> = ({
  isOpen,
  categoryGroups = [],
  systemOptions,
  onClose,
  onSavePO,
  poCount,
}) => {
  const defaultCategory = categoryGroups?.[0]?.items?.[0] || 'Main Branch';
  const [poNumber, setPoNumber] = useState(`PO-2026-${9901 + poCount}`);
  const [vendor, setVendor] = useState(systemOptions.vendors[0] || 'BracNet Ltd');
  const [category, setCategory] = useState(defaultCategory);
  const [qty, setQty] = useState(10);
  const [totalPrice, setTotalPrice] = useState('৳ 650,000');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<any>(
    systemOptions.poStatuses[0] || 'ONGOING'
  );

  useEffect(() => {
    if (isOpen) {
      setPoNumber(`PO-2026-${9901 + poCount}`);
      setVendor(systemOptions.vendors[0] || 'BracNet Ltd');
      const initialCat = categoryGroups?.[0]?.items?.[0] || 'Main Branch';
      setCategory(initialCat);
      setQty(10);
      setTotalPrice('৳ 650,000');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setStatus(systemOptions.poStatuses[0] || 'ONGOING');
    }
  }, [isOpen, categoryGroups, poCount, systemOptions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poNumber || `PO-2026-${9901 + poCount}`,
      vendor: vendor || 'INOVACE Tech',
      category: category || defaultCategory,
      qty,
      totalPrice,
      issueDate,
      status,
    };
    onSavePO(newPO);
    onClose();
  };

  // Flatten all category items to check for fallback
  const allCategoryItems = categoryGroups.flatMap((g) => g.items);

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
          Create New Purchase Order (PO)
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">PO Number</label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-2026-9901"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Vendor Name</label>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Category (Device MIS Tree)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {categoryGroups.length > 0 ? (
                categoryGroups.map((group) => (
                  <optgroup
                    key={group.id}
                    label={group.title}
                    className="bg-slate-100 dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 font-bold"
                  >
                    {group.items.map((item) => (
                      <option
                        key={item}
                        value={item}
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal"
                      >
                        {item}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                <option value="Main Branch">Main Branch</option>
              )}
              {category && !allCategoryItems.includes(category) && (
                <optgroup label="Other" className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                  <option value={category} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {category}
                  </option>
                </optgroup>
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Quantity</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                min={1}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Total Price</label>
              <input
                type="text"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.poStatuses.map((st) => (
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
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer shadow-xs"
            >
              Create PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
