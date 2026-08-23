import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Server,
  Box,
  Filter,
  Tag,
  AlertCircle,
  Headphones,
  Clock,
} from 'lucide-react';
import { CategoryGroup, SystemOptions, AppSettings } from '../types';
import { ConfirmModal } from './Modals/ConfirmModal';
import {
  saveSupabaseCategoryGroups,
  deleteSupabaseCategoryGroup,
  saveSupabaseSystemOptions,
  saveSupabaseAppSettings,
  defaultAppSettings,
} from '../lib/supabase';

interface SettingsTabProps {
  categoryGroups: CategoryGroup[];
  setCategoryGroups: React.Dispatch<React.SetStateAction<CategoryGroup[]>>;
  systemOptions: SystemOptions;
  setSystemOptions: React.Dispatch<React.SetStateAction<SystemOptions>>;
  appSettings?: AppSettings;
  setAppSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  onResetOptions?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  categoryGroups,
  setCategoryGroups,
  systemOptions,
  setSystemOptions,
  appSettings = defaultAppSettings,
  setAppSettings,
  onResetOptions,
}) => {
  // Brand & Logo Form State
  const [appNameInput, setAppNameInput] = useState(appSettings.appName || 'BBL DM System');
  const [taglineInput, setTaglineInput] = useState(appSettings.tagline || 'Enterprise Management Suite');
  const [logoInput, setLogoInput] = useState(appSettings.appLogo || '');
  const [urlInputMode, setUrlInputMode] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (appSettings) {
      if (appSettings.appName !== undefined) setAppNameInput(appSettings.appName);
      if (appSettings.tagline !== undefined) setTaglineInput(appSettings.tagline);
      if (appSettings.appLogo !== undefined) setLogoInput(appSettings.appLogo);
    }
  }, [appSettings]);

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
    slaStatuses: '',
  });

  // Filter tab for System Dropdown Options
  const [optionFilterTab, setOptionFilterTab] = useState<
    'ALL' | 'ISSUE_TRACKER' | 'SERVICE' | 'DEVICES' | 'PO'
  >('ALL');

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

  // Compress & Resize image to keep payload lightweight for Supabase & LocalStorage
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      if (!imgUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
          setLogoInput(compressedDataUrl);
          showToast('Logo image loaded successfully! Click "Save Brand & Logo Settings" to apply.');
        } else {
          setLogoInput(imgUrl);
        }
      };
      img.onerror = () => {
        setLogoInput(imgUrl);
      };
      img.src = imgUrl;
    };
    reader.readAsDataURL(file);
  };

  // Save Brand & Logo settings
  const handleSaveBrandSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingBrand(true);

    const updated: AppSettings = {
      appName: appNameInput.trim() || 'BBL DM System',
      appLogo: logoInput.trim(),
      tagline: taglineInput.trim() || 'Enterprise Management Suite',
    };

    if (setAppSettings) {
      setAppSettings(updated);
    }

    try {
      localStorage.setItem('appSettings', JSON.stringify(updated));
    } catch (err) {
      console.warn('localStorage save appSettings error', err);
    }

    const saved = await saveSupabaseAppSettings(updated);
    setIsSavingBrand(false);

    if (saved) {
      showToast('Brand settings & Logo saved to Supabase successfully!');
    } else {
      showToast('Brand settings saved locally! Ensure the app_settings table exists in Supabase.');
    }
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    askConfirmation(
      'Remove System Logo',
      'Are you sure you want to remove the custom logo? The default system icon will be displayed.',
      () => {
        setLogoInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        const updated: AppSettings = {
          appName: appNameInput.trim() || 'BBL DM System',
          appLogo: '',
          tagline: taglineInput.trim() || 'Enterprise Management Suite',
        };
        if (setAppSettings) setAppSettings(updated);
        try {
          localStorage.setItem('appSettings', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
        saveSupabaseAppSettings(updated);
        showToast('Custom logo removed. Default icon restored.');
      }
    );
  };

  // Reset to default
  const handleResetBrandDefaults = () => {
    askConfirmation(
      'Reset Branding to Defaults',
      'Reset application name to "BBL DM System" and clear custom logo?',
      () => {
        setAppNameInput('BBL DM System');
        setTaglineInput('Enterprise Management Suite');
        setLogoInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        const updated = { ...defaultAppSettings };
        if (setAppSettings) setAppSettings(updated);
        try {
          localStorage.setItem('appSettings', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
        saveSupabaseAppSettings(updated);
        showToast('Brand settings reset to defaults.');
      }
    );
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
      try {
        localStorage.setItem('categoryGroups', JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
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
      try {
        localStorage.setItem('categoryGroups', JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
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
          try {
            localStorage.setItem('categoryGroups', JSON.stringify(updated));
          } catch (err) {
            console.warn(err);
          }
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
        deleteSupabaseCategoryGroup(groupId);
        setCategoryGroups((prev) => {
          const updated = prev.filter((g) => g.id !== groupId);
          saveSupabaseCategoryGroups(updated);
          try {
            localStorage.setItem('categoryGroups', JSON.stringify(updated));
          } catch (err) {
            console.warn(err);
          }
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

    const existingList = systemOptions[key] || [];
    if (existingList.includes(value)) {
      showToast(`"${value}" already exists in option list!`);
      return;
    }

    setSystemOptions((prev) => {
      const currentList = prev[key] || [];
      const updated = {
        ...prev,
        [key]: [...currentList, value],
      };
      saveSupabaseSystemOptions(updated);
      try {
        localStorage.setItem('systemOptions', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });

    setInputs((prev) => ({ ...prev, [key]: '' }));
    showToast(`Added "${value}" to system dropdown options!`);
  };

  // Remove item from a system dropdown list
  const handleRemoveOption = (key: keyof SystemOptions, valueToRemove: string) => {
    askConfirmation(
      'Confirm Option Removal',
      `Are you sure you want to remove option "${valueToRemove}"?`,
      () => {
        setSystemOptions((prev) => {
          const currentList = prev[key] || [];
          const updated = {
            ...prev,
            [key]: currentList.filter((item) => item !== valueToRemove),
          };
          saveSupabaseSystemOptions(updated);
          try {
            localStorage.setItem('systemOptions', JSON.stringify(updated));
          } catch (e) {
            console.warn('localStorage save error', e);
          }
          return updated;
        });
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
    groups: ('ISSUE_TRACKER' | 'SERVICE' | 'DEVICES' | 'PO')[];
    feedTag: string;
  }[] = [
    // SERVICE TICKET & ISSUE TRACKER DROPDOWNS
    {
      key: 'issueTypes',
      title: 'Issue Types',
      description: 'Appears in Service Ticket & SLA Tracker, Issue Tracker & Reports',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
      groups: ['ISSUE_TRACKER', 'SERVICE'],
      feedTag: 'Feeds Service Ticket & Issue Tracker',
    },
    {
      key: 'ticketPriorities',
      title: 'Priority Levels',
      description: 'Appears in Service Ticket & SLA Tracker priorities & Issue Tracker',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
      groups: ['ISSUE_TRACKER', 'SERVICE'],
      feedTag: 'Feeds Service Ticket & Issue Priorities',
    },
    {
      key: 'ticketStatuses',
      title: 'Ticket / Service Statuses',
      description: 'Appears in Service Ticket & SLA Tracker, and Issue Tracker status options',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800',
      groups: ['ISSUE_TRACKER', 'SERVICE'],
      feedTag: 'Feeds Service Ticket & Issue Status',
    },
    {
      key: 'slaStatuses',
      title: 'SLA Tracking Statuses',
      description: 'Appears in Service Ticket & SLA Tracker (WITHIN SLA, SLA BREACH, NEAR BREACH)',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
      groups: ['SERVICE'],
      feedTag: 'Feeds SLA Tracker Status',
    },
    {
      key: 'technicians',
      title: 'Assign Person / Technicians',
      description: 'Appears in Issue Tracker, Issue Reports & Service Ticket assignee lists',
      icon: <Users className="w-4 h-4 text-orange-400" />,
      badgeColor: 'bg-orange-950/80 text-orange-300 border-orange-800',
      groups: ['ISSUE_TRACKER', 'SERVICE'],
      feedTag: 'Feeds Assign Person Dropdown',
    },
    {
      key: 'locationTypes',
      title: 'Location & Branch Types',
      description: 'Appears in Branch MIS & Location categories',
      icon: <Building className="w-4 h-4 text-purple-400" />,
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800',
      groups: ['ISSUE_TRACKER'],
      feedTag: 'Feeds Location Categories',
    },
    // DEVICES & SIM DROPDOWNS
    {
      key: 'deviceStatuses',
      title: 'Device Status Options',
      description: 'Appears in Device add/edit status dropdowns',
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      groups: ['DEVICES'],
      feedTag: 'Feeds Device Inventory',
    },
    {
      key: 'accessTypes',
      title: 'Device Access Types',
      description: 'Appears in Device access type configuration',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
      groups: ['DEVICES'],
      feedTag: 'Feeds Device Access Types',
    },
    {
      key: 'simOperators',
      title: 'SIM Operators',
      description: 'Appears in Device and SIM Management operator dropdowns',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
      groups: ['DEVICES'],
      feedTag: 'Feeds SIM Operators',
    },
    {
      key: 'simStatuses',
      title: 'SIM Card Statuses',
      description: 'Appears in SIM Inventory status dropdowns',
      icon: <Radio className="w-4 h-4 text-sky-400" />,
      badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
      groups: ['DEVICES'],
      feedTag: 'Feeds SIM Card Status',
    },
    // PO & VENDOR DROPDOWNS
    {
      key: 'vendors',
      title: 'Vendors & Suppliers',
      description: 'Appears in Purchase Order vendor selection',
      icon: <ShoppingBag className="w-4 h-4 text-teal-400" />,
      badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-800',
      groups: ['PO'],
      feedTag: 'Feeds PO Vendors',
    },
    {
      key: 'poStatuses',
      title: 'Purchase Order Statuses',
      description: 'Appears in Purchase Order status dropdowns',
      icon: <ListPlus className="w-4 h-4 text-emerald-400" />,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      groups: ['PO'],
      feedTag: 'Feeds PO Statuses',
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
              System Settings & Brand Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Manage System Logo, Brand Identity, MIS Tree Categories, and Custom System Dropdown Options.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 0: BRAND IDENTITY & SYSTEM LOGO CONFIGURATION */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md">
        <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Brand Identity & Logo Configuration (BBL DM System)
            </h3>
          </div>
          <span className="text-[11px] text-amber-400 font-bold bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800">
            Logo & Branding Sync
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
            <form onSubmit={handleSaveBrandSettings} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  System / Application Name
                </label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="e.g. BBL DM System"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Appears in Header navigation, Login Modal, and window title bar.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  placeholder="e.g. Enterprise Management Suite"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Logo Upload / URL Switch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    System Logo
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUrlInputMode(false)}
                      className={`text-[11px] px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                        !urlInputMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrlInputMode(true)}
                      className={`text-[11px] px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                        urlInputMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {!urlInputMode ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                      id="logo-file-input"
                    />
                    <label
                      htmlFor="logo-file-input"
                      className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition text-center"
                    >
                      <Upload className="w-6 h-6 text-indigo-400" />
                      <div>
                        <span className="text-indigo-400 font-semibold">
                          Click to upload logo
                        </span>{' '}
                        <span className="text-slate-400">or drag and drop</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        PNG, JPG, SVG, WebP (Square or Horizontal recommended)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="url"
                      value={logoInput}
                      onChange={(e) => setLogoInput(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                    <p className="text-[10px] text-slate-400">
                      Enter a direct image link or Supabase Storage public URL.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingBrand}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer flex items-center gap-2 transition shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSavingBrand ? 'Saving to Supabase...' : 'Save Brand & Logo Settings'}
                  </span>
                </button>

                {logoInput && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-rose-900/60 rounded-lg cursor-pointer flex items-center gap-1.5 transition font-medium"
                    title="Remove custom logo and restore default icon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetBrandDefaults}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer flex items-center gap-1.5 transition font-medium"
                  title="Reset all branding values to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Previews */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-3 text-indigo-400">
                <ImageIcon className="w-4 h-4" />
                Live Branding Previews
              </h4>

              <div className="space-y-4">
                {/* 1. Header Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    1. Header Navigation Bar Preview:
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-inner">
                    <div className="flex items-center space-x-2.5">
                      {logoInput ? (
                        <img
                          src={logoInput}
                          alt="Logo Preview"
                          className="w-7 h-7 rounded-md object-contain bg-slate-900 border border-slate-700/80 p-0.5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Box className="text-indigo-500 w-6 h-6 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-white tracking-wide block leading-tight">
                          {appNameInput || 'BBL DM System'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                      Header Bar
                    </span>
                  </div>
                </div>

                {/* 2. Login Card Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    2. Login Screen Card Preview:
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col items-center text-center shadow-inner">
                    {logoInput ? (
                      <img
                        src={logoInput}
                        alt="Logo Preview"
                        className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-slate-700/80 p-1 mb-2 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-2">
                        <Server className="w-5 h-5" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-white leading-tight">
                      {appNameInput || 'BBL DM System'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {taglineInput || 'Enterprise Management Suite'}
                    </span>
                  </div>
                </div>
                {/* 3. Browser Tab & Favicon Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    3. Browser Tab & Favicon Preview:
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center shadow-inner">
                    <div className="bg-slate-900 border border-slate-700/80 rounded-t-md px-3 py-1.5 flex items-center space-x-2 max-w-[200px] border-b-2 border-indigo-500">
                      {logoInput ? (
                        <img
                          src={logoInput}
                          alt="Favicon"
                          className="w-4 h-4 rounded-sm object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                      <span className="text-[11px] font-medium text-slate-200 truncate">
                        {appNameInput || 'BBL DM System'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-[11px] text-indigo-200">
              Logo is instantly set as the browser tab Favicon and synced with Supabase!
            </div>
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
        <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                System Dropdown Options Configurator
              </h3>
              <p className="text-xs text-slate-400">
                Configure dynamic dropdown options for all modules. Add custom options that immediately flow into forms!
              </p>
            </div>
          </div>
          <span className="text-[11px] text-indigo-400 font-bold bg-indigo-950/80 px-3 py-1 rounded border border-indigo-800 self-start md:self-auto">
            Dynamic Form Options
          </span>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setOptionFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'ALL'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All Dropdowns ({optionSections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('SERVICE')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'SERVICE'
                ? 'bg-cyan-600 text-white font-bold shadow-sm ring-2 ring-cyan-400/40'
                : 'bg-slate-900 text-cyan-300 hover:text-white hover:bg-slate-800 border border-cyan-900/60'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span>Service Ticket & SLA ({optionSections.filter((s) => s.groups.includes('SERVICE')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('ISSUE_TRACKER')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'ISSUE_TRACKER'
                ? 'bg-rose-600 text-white font-bold shadow-sm ring-2 ring-rose-400/40'
                : 'bg-slate-900 text-rose-300 hover:text-white hover:bg-slate-800 border border-rose-900/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Issue Tracker ({optionSections.filter((s) => s.groups.includes('ISSUE_TRACKER')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('DEVICES')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'DEVICES'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-emerald-300 hover:text-white hover:bg-slate-800 border border-emerald-900/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Devices & SIM ({optionSections.filter((s) => s.groups.includes('DEVICES')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('PO')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'PO'
                ? 'bg-teal-600 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-teal-300 hover:text-white hover:bg-slate-800 border border-teal-900/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
            <span>Procurement & PO ({optionSections.filter((s) => s.groups.includes('PO')).length})</span>
          </button>
        </div>

        {/* Service Ticket & SLA Highlight Notice */}
        {optionFilterTab === 'SERVICE' && (
          <div className="bg-cyan-950/30 border border-cyan-800/60 rounded-xl p-4 flex items-start gap-3 text-xs">
            <Headphones className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-cyan-200">
                Service Ticket & SLA Tracker Dropdown Synchronization
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Options configured below (<strong>Issue Types</strong>, <strong>Priority Levels</strong>, <strong>Ticket / Service Statuses</strong>, <strong>SLA Tracking Statuses</strong>, and <strong>Assign Person / Technicians</strong>) directly update the dynamic dropdown options across the <strong>Service Ticket & SLA Tracker</strong> module.
              </p>
            </div>
          </div>
        )}

        {/* Issue Tracker Highlight Notice */}
        {(optionFilterTab === 'ALL' || optionFilterTab === 'ISSUE_TRACKER') && (
          <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-200">
                Issue Tracker Dropdown Synchronization
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Options created or deleted below (<strong>Issue Types</strong>, <strong>Priority Levels</strong>, <strong>Issue Statuses</strong>, and <strong>Assign Person / Technicians</strong>) directly update the dropdown menus in the <strong>Issue Tracker</strong> and <strong>Issue Reports</strong> tabs. Category options are managed hierarchically in the Category Tree Manager above.
              </p>
            </div>
          </div>
        )}

        {/* Options Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {optionSections
            .filter((section) => optionFilterTab === 'ALL' || section.groups.includes(optionFilterTab))
            .map((section) => {
              const list = systemOptions[section.key] || [];

              return (
                <div
                  key={section.key}
                  className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between space-y-4 transition ${
                    section.groups.includes('SERVICE') && optionFilterTab === 'SERVICE'
                      ? 'border-cyan-900/60 hover:border-cyan-700/80'
                      : section.groups.includes('ISSUE_TRACKER') && optionFilterTab === 'ISSUE_TRACKER'
                      ? 'border-rose-900/50 hover:border-rose-700/80'
                      : 'border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 gap-2">
                      <div className="flex items-center space-x-2">
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
                      <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 shrink-0">
                        {section.feedTag}
                      </span>
                    </div>

                    {/* Badges List */}
                    <div className="flex flex-wrap gap-1.5 min-h-[60px] max-h-[120px] overflow-y-auto p-1.5 bg-slate-950/70 rounded-lg border border-slate-800/60">
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
                        placeholder={`Add new ${section.title.toLowerCase()}...`}
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
