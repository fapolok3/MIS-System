import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (groupTitle: string, categoryName: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [parentGroup, setParentGroup] = useState('Branch MIS');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddCategory(parentGroup, name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase flex items-center">
          <FolderPlus className="w-4 h-4 text-indigo-400 mr-2" />
          Add Dynamic Category
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Regional Office (ROC)"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Parent Group
            </label>
            <select
              value={parentGroup}
              onChange={(e) => setParentGroup(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none"
            >
              <option value="Branch MIS">Branch MIS</option>
              <option value="Info Security">Info Security</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Head Office">Head Office</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-bold cursor-pointer hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold cursor-pointer"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
