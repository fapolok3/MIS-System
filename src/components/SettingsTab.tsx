import React, { useState } from 'react';
import {
  Settings,
  FolderPlus,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  ListPlus,
  Layers,
  Cpu,
  Radio,
  Building,
  AlertTriangle,
  Users,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react';
import { CategoryGroup, SystemOptions } from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';
import { saveSupabaseCategoryGroups } from '../lib/supabase';

interface SettingsTabProps {
  categoryGroups: CategoryGroup[];
  setCategoryGroups: React.Dispatch<React.SetStateAction<CategoryGroup[]>>;
  systemOptions: SystemOptions;
  setSystemOptions: React.Dispatch<React.SetStateAction<SystemOptions>>;
  onResetOptions: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  categoryGroups,
  setCategoryGroups,
  systemOptions,
  setSystemOptions,
  onResetOptions,
}) => {
  // Category Group Form
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('branch');

  // New Category Item Form (under selected group)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    categoryGroups[0]?.id || 'branch'
  );
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dropdown options new item inputs
  const [inputs, setInputs] = useState<Record<keyof SystemOptions, string>>({
    deviceStatuses: '',
    simOperators: '',
    accessTypes: '',
    locationTypes: '',
    issueTypes: '',
    ticketPriorities: '',
    ticketStatuses: '',
    vendors: '',
    poStatuses: '',
    simStatuses: '',
    technicians: '',
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Add Category Group
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;

    const newGroup: CategoryGroup = {
      id: `group-${Date.now()}`,
      title: newGroupTitle.trim(),
      icon: newGroupIcon,
      items: [],
    };

    setCategoryGroups((prev) => {
      const updated = [...prev, newGroup];
      saveSupabaseCategoryGroups(updated);
      return updated;
    });
    setSelectedGroupId(newGroup.id);
    setNewGroupTitle('');
    showToast(`Category Group "${newGroup.title}" added successfully!`);
  };

  // Add Category Item to selected group
  const handleAddCategoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !selectedGroupId) return;

    setCategoryGroups((prev) => {
      const updated = prev.map((group) => {
        if (group.id === selectedGroupId) {
          if (group.items.includes(newCategoryName.trim())) {
            showToast(`Category "${newCategoryName.trim()}" already exists!`);
            return group;
          }
          return {
            ...group,
            items: [...group.items, newCategoryName.trim()],
          };
        }
        return group;
      });
      saveSupabaseCategoryGroups(updated);
      return updated;
    });

    showToast(`Added "${newCategoryName.trim()}" to category tree!`);
    setNewCategoryName('');
  };

  // Delete Category Item from group
  const handleDeleteCategoryItem = (groupId: string, itemToDelete: string) => {
    askConfirmation(
      'Confirm Category Deletion',
      `Are you sure you want to remove category "${itemToDelete}" from the category tree?`,
      () => {
        setCategoryGroups((prev) => {
          const updated = prev.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                items: group.items.filter((item) => item !== itemToDelete),
              };
            }
            return group;
          });
          saveSupabaseCategoryGroups(updated);
          return updated;
        });
        showToast(`Removed "${itemToDelete}" from category tree.`);
      }
    );
  };

  // Delete whole Category Group
  const handleDeleteGroup = (groupId: string, groupTitle: string) => {
    askConfirmation(
      'Confirm Group Deletion',
      `Are you sure you want to delete category group "${groupTitle}" and all its subcategories?`,
      () => {
        setCategoryGroups((prev) => {
          const updated = prev.filter((g) => g.id !== groupId);
          saveSupabaseCategoryGroups(updated);
          return updated;
        });
        showToast(`Category Group "${groupTitle}" deleted.`);
      }
    );
  };

  // Add item to a system dropdown list
  const handleAddOption = (key: keyof SystemOptions) => {
    const value = inputs[key]?.trim();
    if (!value) return;

    if (systemOptions[key].includes(value)) {
      showToast(`"${value}" already exists in option list!`);
      return;
    }

    setSystemOptions((prev) => ({
      ...prev,
      [key]: [...prev[key], value],
    }));

    setInputs((prev) => ({ ...prev, [key]: '' }));
    showToast(`Added "${value}" to system dropdown options!`);
  };

  // Remove item from a system dropdown list
  const handleRemoveOption = (key: keyof SystemOptions, valueToRemove: string) => {
    askConfirmation(
      'Confirm Option Removal',
      `Are you sure you want to remove option "${valueToRemove}"?`,
      () => {
        setSystemOptions((prev) => ({
          ...prev,
          [key]: prev[key].filter((item) => item !== valueToRemove),
        }));
        showToast(`Removed "${valueToRemove}" from options.`);
      }
    );
  };

  const optionSections: {
    key: keyof SystemOptions;
    title: string;
    description: string;
    icon: React.ReactNode;
    badgeColor: string;
  }[] = [
    {
      key: 'deviceStatuses',
      title: 'Device Status Options',
      description: 'Appears in Device add/edit status dropdowns',
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    },
    {
      key: 'accessTypes',
      title: 'Device Access Types',
      description: 'Appears in Device access type configuration',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    },
    {
      key: 'simOperators',
      title: 'SIM Operators',
      description: 'Appears in Device and SIM Management operator dropdowns',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    },
    {
      key: 'locationTypes',
      title: 'Location & Branch Types',
      description: 'Appears in Service Tickets location category dropdown',
      icon: <Building className="w-4 h-4 text-purple-400" />,
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800',
    },
    {
      key: 'issueTypes',
      title: 'Service Issue Types',
      description: 'Appears in Service Ticket issue selection',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
    },
    {
      key: 'ticketPriorities',
      title: 'Ticket Priority Levels',
      description: 'Appears in Service Ticket priority options',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
    },
    {
      key: 'ticketStatuses',
      title: 'Ticket Statuses',
      description: 'Appears in Service Ticket status updates',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800',
    },
    {
      key: 'vendors',
      title: 'Vendors & Suppliers',
      description: 'Appears in Purchase Order vendor selection',
      icon: <ShoppingBag className="w-4 h-4 text-teal-400" />,
      badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-800',
    },
    {
      key: 'poStatuses',
      title: 'Purchase Order Statuses',
      description: 'Appears in Purchase Order status dropdowns',
      icon: <ListPlus className="w-4 h-4 text-emerald-400" />,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    },
    {
      key: 'simStatuses',
      title: 'SIM Card Statuses',
      description: 'Appears in SIM Inventory status dropdowns',
      icon: <Radio className="w-4 h-4 text-sky-400" />,
      badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
    },
    {
      key: 'technicians',
      title: 'Technicians & Engineers',
      description: 'Appears in Service Ticket technician assignment',
      icon: <Users className="w-4 h-4 text-orange-400" />,
      badgeColor: 'bg-orange-950/80 text-orange-300 border-orange-800',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-2xl font-semibold text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-950 border border-indigo-800/80 rounded-xl text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              System Settings & Dynamic Options
            </h2>
            <p className="text-xs text-slate-400">
              Manage MIS Device Categories, Sidebar Tree, and custom System Dropdown Options.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: MIS TREE & CATEGORIES MANAGER (+ Category) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
        <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Category Tree & MIS Group Manager
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
            + Category Creation Hub
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Form 1: Add New Category Item under Group */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add New Category Item (+ Category)
            </h4>
            <p className="text-[11px] text-slate-400">
              Items added here will immediately appear under the chosen group in the Sidebar MIS Tree and in Category selection dropdowns.
            </p>

            <form onSubmit={handleAddCategoryItem} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Select MIS Category Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {categoryGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.title} ({group.items.length} items)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  New Category Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Gouripur Sub-Branch / ATM Enclosure"
                    required
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 transition"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Form 2: Add New Category Group */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              Create New Category Group
            </h4>
            <p className="text-[11px] text-slate-400">
              Create a new top-level tree header in the sidebar (e.g. Regional Offices, ATM Networks, Security Doors).
            </p>

            <form onSubmit={handleAddGroup} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Group Title
                </label>
                <input
                  type="text"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  placeholder="e.g. Regional Data Centres"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Icon Type
                </label>
                <select
                  value={newGroupIcon}
                  onChange={(e) => setNewGroupIcon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="branch">Branch (Building Icon)</option>
                  <option value="security">Info Security (Shield Icon)</option>
                  <option value="infra">Infrastructure (Network Icon)</option>
                  <option value="headoffice">Head Office (Layers Icon)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Create Category Group
              </button>
            </form>
          </div>
        </div>

        {/* Existing Category Groups List Display */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Current Category Tree Structure
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryGroups.map((group) => (
              <div
                key={group.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-indigo-400 text-xs flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {group.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteGroup(group.id, group.title);
                    }}
                    className="p-1.5 rounded-md bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700/60 hover:border-rose-600 transition cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold"
                    title={`Delete Category Group "${group.title}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.items.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">
                      No categories yet. Add one above!
                    </span>
                  ) : (
                    group.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950 text-slate-200 border border-slate-800 text-[11px] hover:border-slate-700 transition"
                      >
                        <span className="font-medium">{item}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCategoryItem(group.id, item);
                          }}
                          className="p-0.5 rounded hover:bg-rose-900/80 text-slate-400 hover:text-rose-200 transition cursor-pointer flex items-center justify-center"
                          title={`Remove "${item}" category`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: SYSTEM DROPDOWN OPTIONS MANAGER */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
        <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              System Dropdown Options Configurator
            </h3>
          </div>
          <span className="text-[11px] text-indigo-400 font-bold bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800">
            Dynamic Form Options
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Add or remove options for any dropdown in the system. Any newly added item here will automatically populate in forms across Devices, Service Tracker, POs, and SIM Management!
        </p>

        {/* Options Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {optionSections.map((section) => {
            const list = systemOptions[section.key] || [];

            return (
              <div
                key={section.key}
                className="bg-slate-900 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    {section.icon}
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {section.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  {/* Badges List */}
                  <div className="flex flex-wrap gap-1.5 min-h-[60px] max-h-[120px] overflow-y-auto p-1 bg-slate-950/60 rounded border border-slate-800/50">
                    {list.length === 0 ? (
                      <span className="text-[11px] text-slate-500 p-1">
                        No options available.
                      </span>
                    ) : (
                      list.map((item) => (
                        <span
                          key={item}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${section.badgeColor}`}
                        >
                          {item}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveOption(section.key, item);
                            }}
                            className="p-0.5 hover:bg-rose-900/80 text-slate-300 hover:text-rose-200 rounded transition cursor-pointer flex items-center justify-center ml-0.5"
                            title={`Remove "${item}"`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Option Form */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={inputs[section.key] || ''}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [section.key]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption(section.key);
                        }
                      }}
                      placeholder="Add new option..."
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOption(section.key)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer flex items-center justify-center transition"
                      title="Add option"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
