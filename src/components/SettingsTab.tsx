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
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  PieChart,
  FileBarChart2,
  FileText,
  Smartphone,
  GitBranch,
  Ticket,
  Database,
  Save,
  Check,
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
  hiddenModules?: string[];
  onToggleModule?: (moduleId: string) => void;
  onSaveHiddenModules?: (hiddenModules: string[]) => Promise<void> | void;
  onResetModules?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  categoryGroups,
  setCategoryGroups,
  systemOptions,
  setSystemOptions,
  appSettings = defaultAppSettings,
  setAppSettings,
  onResetOptions,
  hiddenModules = [],
  onToggleModule,
  onSaveHiddenModules,
  onResetModules,
}) => {
  // Module Controller State (Password Protected with Iamfapolok@1)
  const [isModuleControllerUnlocked, setIsModuleControllerUnlocked] = useState(false);
  const [controllerPassword, setControllerPassword] = useState('');
  const [controllerPasswordError, setControllerPasswordError] = useState('');
  const [showControllerPassword, setShowControllerPassword] = useState(false);

  // Local pending state for hiding/unhiding modules until user clicks Save
  const [pendingHiddenModules, setPendingHiddenModules] = useState<string[]>(hiddenModules);
  const [isSavingModules, setIsSavingModules] = useState(false);

  // Synchronize pending state when external hiddenModules changes
  useEffect(() => {
    setPendingHiddenModules(hiddenModules);
  }, [hiddenModules]);

  const hasUnsavedModuleChanges = useMemo(() => {
    if (pendingHiddenModules.length !== hiddenModules.length) return true;
    const currentSet = new Set(hiddenModules);
    return pendingHiddenModules.some((id) => !currentSet.has(id));
  }, [pendingHiddenModules, hiddenModules]);

  const handleTogglePendingModule = (moduleId: string) => {
    setPendingHiddenModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSaveModuleVisibility = async () => {
    setIsSavingModules(true);
    try {
      if (onSaveHiddenModules) {
        await onSaveHiddenModules(pendingHiddenModules);
      } else if (onToggleModule) {
        // Fallback
        setPendingHiddenModules(pendingHiddenModules);
      }
    } finally {
      setIsSavingModules(false);
    }
  };

  const handleDiscardModuleChanges = () => {
    setPendingHiddenModules(hiddenModules);
  };

  const CONTROLLER_ACCESS_KEY = 'Iamfapolok@1';

  const handleUnlockController = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (controllerPassword === CONTROLLER_ACCESS_KEY) {
      setIsModuleControllerUnlocked(true);
      setControllerPasswordError('');
      setControllerPassword('');
      setPendingHiddenModules(hiddenModules);
    } else {
      setControllerPasswordError('Invalid password! Access denied. (ভুল পাসওয়ার্ড)');
    }
  };

  const handleLockController = () => {
    setIsModuleControllerUnlocked(false);
    setControllerPassword('');
    setControllerPasswordError('');
    setPendingHiddenModules(hiddenModules);
  };

  const ALL_MODULES = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'System overview, statistics, and quick metrics',
      icon: PieChart,
      badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'device_issue_tracker',
      name: 'Device Issue Tracker',
      description: 'Add new ticket entry, contact date, and issue logging with SLA',
      icon: Cpu,
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'device_issue_report',
      name: 'Device Issue Report',
      description: 'Interactive analytics cards, filterable issue list, and Excel export',
      icon: Layers,
      badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
    },
    {
      id: 'issue_tracker',
      name: 'Issue Tracker',
      description: 'Standard device issue tracking and registration',
      icon: AlertCircle,
      badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    },
    {
      id: 'issue_report',
      name: 'Issue & Job Entry Report',
      description: 'Comprehensive 34-field issue logging and SLA tracking',
      icon: FileBarChart2,
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'po',
      name: 'Purchase Orders (PO)',
      description: 'Procurement tracking, vendor POs, and bulk excel upload',
      icon: FileText,
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    },
    {
      id: 'service',
      name: 'Service Ticket & SLA Tracker',
      description: 'Customer and branch support tickets with response metrics',
      icon: Headphones,
      badgeColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    },
    {
      id: 'sim',
      name: 'SIM Management',
      description: 'Telco SIM cards, active MSISDNs, and device pairing',
      icon: Smartphone,
      badgeColor: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
    },
    {
      id: 'branch_report',
      name: 'All Branch Device Report',
      description: 'Consolidated report of all branch terminals and remarks',
      icon: GitBranch,
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'ticket_generator',
      name: 'Support Ticket Generator',
      description: 'Instant ticket printout and issue dispatch sheets',
      icon: Ticket,
      badgeColor: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
    },
    {
      id: 'backup',
      name: 'Backup & Restore',
      description: 'Cloud snapshots, JSON export/import data preservation',
      icon: Database,
      badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    },
    {
      id: 'category_groups',
      name: 'Device MIS Tree (Categories)',
      description: 'Sidebar branches, security, infra, and head office groups',
      icon: Layers,
      badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
    },
  ];

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
      title: 'Issue Priority',
      description: 'Appears in Service Ticket & SLA Tracker priorities & Issue Tracker',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
      groups: ['ISSUE_TRACKER', 'SERVICE'],
      feedTag: 'Feeds Service Ticket & Issue Priorities',
    },
    {
      key: 'ticketStatuses',
      title: 'Current Status',
      description: 'Appears in Service Ticket & SLA Tracker Current Status, and Issue Tracker status',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800',
      groups: ['ISSUE_TRACKER', 'SERVICE'],
      feedTag: 'Feeds Service Ticket & Issue Status',
    },
    {
      key: 'technicians',
      title: 'Assign Person / Technicians',
      description: 'Appears in Issue Tracker and Issue Reports assignee dropdowns',
      icon: <Users className="w-4 h-4 text-orange-400" />,
      badgeColor: 'bg-orange-950/80 text-orange-300 border-orange-800',
      groups: ['ISSUE_TRACKER'],
      feedTag: 'Feeds Issue Tracker Assignee',
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
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              System Settings & Brand Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage System Logo, Brand Identity, MIS Tree Categories, and Custom System Dropdown Options.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 0: BRAND IDENTITY & SYSTEM LOGO CONFIGURATION */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Brand Identity & Logo Configuration (BBL DM System)
            </h3>
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1 rounded border border-amber-200 dark:border-amber-800">
            Logo & Branding Sync
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-5">
            <form onSubmit={handleSaveBrandSettings} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  System / Application Name
                </label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="e.g. BBL DM System"
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Appears in Header navigation, Login Modal, and window title bar.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  placeholder="e.g. Enterprise Management Suite"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Logo Upload / URL Switch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    System Logo
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUrlInputMode(false)}
                      className={`text-[11px] px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                        !urlInputMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 transition text-center"
                    >
                      <Upload className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                      <div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          Click to upload logo
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">or drag and drop</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Enter a direct image link or Supabase Storage public URL.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
                    className="px-3.5 py-2.5 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-lg cursor-pointer flex items-center gap-1.5 transition font-medium"
                    title="Remove custom logo and restore default icon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetBrandDefaults}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent rounded-lg cursor-pointer flex items-center gap-1.5 transition font-medium"
                  title="Reset all branding values to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Previews */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-3 text-indigo-600 dark:text-indigo-400">
                <ImageIcon className="w-4 h-4" />
                Live Branding Previews
              </h4>

              <div className="space-y-4">
                {/* 1. Header Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    1. Header Navigation Bar Preview:
                  </span>
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      {logoInput ? (
                        <img
                          src={logoInput}
                          alt="Logo Preview"
                          className="w-7 h-7 rounded-md object-contain bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-0.5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Box className="text-indigo-500 w-6 h-6 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide block leading-tight">
                          {appNameInput || 'BBL DM System'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded font-medium">
                      Header Bar
                    </span>
                  </div>
                </div>

                {/* 2. Login Card Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    2. Login Screen Card Preview:
                  </span>
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center text-center shadow-xs">
                    {logoInput ? (
                      <img
                        src={logoInput}
                        alt="Logo Preview"
                        className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-1 mb-2 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                        <Server className="w-5 h-5" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {appNameInput || 'BBL DM System'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {taglineInput || 'Enterprise Management Suite'}
                    </span>
                  </div>
                </div>
                {/* 3. Browser Tab & Favicon Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    3. Browser Tab & Favicon Preview:
                  </span>
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center shadow-xs">
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-t-md px-3 py-1.5 flex items-center space-x-2 max-w-[200px] border-b-2 border-indigo-500">
                      {logoInput ? (
                        <img
                          src={logoInput}
                          alt="Favicon"
                          className="w-4 h-4 rounded-sm object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Box className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      )}
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                        {appNameInput || 'BBL DM System'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-[11px] text-indigo-800 dark:text-indigo-200">
              Logo is instantly set as the browser tab Favicon and synced with Supabase!
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MIS TREE & CATEGORIES MANAGER (+ Category) */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Category Tree & MIS Group Manager
            </h3>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800">
            + Category Creation Hub
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Form 1: Add New Category Item under Group */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Add New Category Item (+ Category)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Items added here will immediately appear under the chosen group in the Sidebar MIS Tree and in Category selection dropdowns.
            </p>

            <form onSubmit={handleAddCategoryItem} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Select MIS Category Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {categoryGroups.map((group, gIdx) => (
                    <option key={`cg-opt-${group.id || 'grp'}-${gIdx}`} value={group.id}>
                      {group.title} ({group.items.length} items)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  New Category Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Gouripur Sub-Branch / ATM Enclosure"
                    required
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <FolderPlus className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Create New Category Group
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create a new top-level tree header in the sidebar (e.g. Regional Offices, ATM Networks, Security Doors).
            </p>

            <form onSubmit={handleAddGroup} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Group Title
                </label>
                <input
                  type="text"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  placeholder="e.g. Regional Data Centres"
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Icon Type
                </label>
                <select
                  value={newGroupIcon}
                  onChange={(e) => setNewGroupIcon(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none"
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
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Current Category Tree Structure
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryGroups.map((group, gIdx) => (
              <div
                key={`cg-box-${group.id || 'grp'}-${gIdx}`}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-2">
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
                    className="p-1.5 rounded-md bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-900/60 text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-200 border border-slate-200 dark:border-slate-700/60 hover:border-rose-400 dark:hover:border-rose-600 transition cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold"
                    title={`Delete Category Group "${group.title}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.items.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">
                      No categories yet. Add one above!
                    </span>
                  ) : (
                    group.items.map((item, iIdx) => (
                      <span
                        key={`cg-item-${group.id}-${item}-${iIdx}`}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-[11px] hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs"
                      >
                        <span className="font-medium">{item}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCategoryItem(group.id, item);
                          }}
                          className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-slate-400 hover:text-rose-600 dark:hover:text-rose-200 rounded transition cursor-pointer flex items-center justify-center"
                          title={`Remove "${item}" category`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-500 dark:text-rose-400" />
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
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                System Dropdown Options Configurator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure dynamic dropdown options for all modules. Add custom options that immediately flow into forms!
              </p>
            </div>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded border border-indigo-200 dark:border-indigo-800 self-start md:self-auto">
            Dynamic Form Options
          </span>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setOptionFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'ALL'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
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
                ? 'bg-cyan-600 text-white font-bold shadow-xs ring-2 ring-cyan-400/40'
                : 'bg-cyan-50 dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-white hover:bg-cyan-100 dark:hover:bg-slate-800 border border-cyan-200 dark:border-cyan-900/60'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>Service Ticket & SLA ({optionSections.filter((s) => s.groups.includes('SERVICE')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('ISSUE_TRACKER')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'ISSUE_TRACKER'
                ? 'bg-rose-600 text-white font-bold shadow-xs ring-2 ring-rose-400/40'
                : 'bg-rose-50 dark:bg-slate-900 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white hover:bg-rose-100 dark:hover:bg-slate-800 border border-rose-200 dark:border-rose-900/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Issue Tracker ({optionSections.filter((s) => s.groups.includes('ISSUE_TRACKER')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('DEVICES')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'DEVICES'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-emerald-50 dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-slate-800 border border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Devices & SIM ({optionSections.filter((s) => s.groups.includes('DEVICES')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOptionFilterTab('PO')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              optionFilterTab === 'PO'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'bg-teal-50 dark:bg-slate-900 text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white hover:bg-teal-100 dark:hover:bg-slate-800 border border-teal-200 dark:border-teal-900/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
            <span>Procurement & PO ({optionSections.filter((s) => s.groups.includes('PO')).length})</span>
          </button>
        </div>

        {/* Service Ticket & SLA Highlight Notice */}
        {optionFilterTab === 'SERVICE' && (
          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 rounded-xl p-4 flex items-start gap-3 text-xs">
            <Headphones className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-cyan-800 dark:text-cyan-200">
                Service Ticket & SLA Tracker Dropdown Synchronization
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                The 3 dropdown options configured below (<strong>Issue Types</strong>, <strong>Issue Priority</strong>, and <strong>Current Status</strong>) directly update the dynamic dropdown options across the <strong>Service Ticket & SLA Tracker</strong> module.
              </p>
            </div>
          </div>
        )}

        {/* Issue Tracker Highlight Notice */}
        {(optionFilterTab === 'ALL' || optionFilterTab === 'ISSUE_TRACKER') && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-800 dark:text-rose-200">
                Issue Tracker Dropdown Synchronization
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
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
                  className={`bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 flex flex-col justify-between space-y-4 transition ${
                    section.groups.includes('SERVICE') && optionFilterTab === 'SERVICE'
                      ? 'border-cyan-300 dark:border-cyan-900/60 hover:border-cyan-400 dark:hover:border-cyan-700/80'
                      : section.groups.includes('ISSUE_TRACKER') && optionFilterTab === 'ISSUE_TRACKER'
                      ? 'border-rose-300 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-700/80'
                      : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 gap-2">
                      <div className="flex items-center space-x-2">
                        {section.icon}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {section.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-800 shrink-0">
                        {section.feedTag}
                      </span>
                    </div>

                    {/* Badges List */}
                    <div className="flex flex-wrap gap-1.5 min-h-[60px] max-h-[120px] overflow-y-auto p-1.5 bg-white dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-800/60">
                      {list.length === 0 ? (
                        <span className="text-[11px] text-slate-400 p-1">
                          No options available.
                        </span>
                      ) : (
                        list.map((item, iIdx) => (
                          <span
                            key={`sys-opt-${section.key}-${item}-${iIdx}`}
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
                              className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-slate-500 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-200 rounded transition cursor-pointer flex items-center justify-center ml-0.5"
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
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
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
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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

      {/* ============================================================== */}
      {/* MODULE CONTROLLER (PASSWORD PROTECTED: Iamfapolok@1) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Module Controller
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    isModuleControllerUnlocked
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {isModuleControllerUnlocked ? (
                    <>
                      <Unlock className="w-3 h-3" /> Unlocked
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Password Protected
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hide or unhide sidebar modules in real-time. Requires security authentication.
              </p>
            </div>
          </div>

          {isModuleControllerUnlocked && (
            <div className="flex flex-wrap items-center gap-2">
              {hasUnsavedModuleChanges && (
                <button
                  type="button"
                  onClick={handleDiscardModuleChanges}
                  disabled={isSavingModules}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center gap-1.5"
                  title="Discard pending module visibility changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Discard
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveModuleVisibility}
                disabled={isSavingModules || !hasUnsavedModuleChanges}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-xs ${
                  hasUnsavedModuleChanges
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                }`}
                title="Save changes to database so other laptops see updated sidebar on refresh/login"
              >
                {isSavingModules ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </>
                )}
              </button>

              {onResetModules && pendingHiddenModules.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    setPendingHiddenModules([]);
                    if (onResetModules) onResetModules();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center gap-1.5"
                  title="Reset all modules to visible"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Show All
                </button>
              )}
              <button
                type="button"
                onClick={handleLockController}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 cursor-pointer transition flex items-center gap-1.5"
                title="Lock Module Controller"
              >
                <Lock className="w-3.5 h-3.5" /> Lock Controller
              </button>
            </div>
          )}
        </div>

        {!isModuleControllerUnlocked ? (
          <div className="pt-5 flex flex-col items-center justify-center text-center py-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3 border border-slate-200 dark:border-slate-700">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Authentication Required
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
              Module controller is locked to prevent unauthorized alterations to the sidebar layout. Please provide the administrator access key to proceed.
            </p>

            <form
              onSubmit={handleUnlockController}
              className="w-full max-w-sm space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left shadow-xs"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Module Controller Password</span>
                  <span className="text-[10px] text-slate-400 font-normal">Security Key</span>
                </label>
                <div className="relative">
                  <input
                    type={showControllerPassword ? 'text' : 'password'}
                    value={controllerPassword}
                    onChange={(e) => {
                      setControllerPassword(e.target.value);
                      if (controllerPasswordError) setControllerPasswordError('');
                    }}
                    placeholder="Enter password to unlock..."
                    autoComplete="off"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowControllerPassword(!showControllerPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showControllerPassword ? 'Hide password' : 'Show password'}
                  >
                    {showControllerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {controllerPasswordError && (
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{controllerPasswordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" /> Unlock Module Controller
              </button>
            </form>
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            {/* Status & Unsaved Changes Alert Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border text-xs transition ${
              hasUnsavedModuleChanges
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  Controlled Modules: <strong className="text-slate-900 dark:text-white">{ALL_MODULES.length}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Hidden: <strong>{pendingHiddenModules.length}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Visible: <strong>{ALL_MODULES.length - pendingHiddenModules.length}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasUnsavedModuleChanges ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Unsaved Changes! Click "Save Changes" to apply globally.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveModuleVisibility}
                      disabled={isSavingModules}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition flex items-center gap-1"
                    >
                      {isSavingModules ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save Now
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> All changes are saved and synced across all devices.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ALL_MODULES.map((mod, mIdx) => {
                const isHidden = pendingHiddenModules.includes(mod.id);
                const isCurrentlyActiveHidden = hiddenModules.includes(mod.id);
                const isModified = isHidden !== isCurrentlyActiveHidden;
                const IconComponent = mod.icon;

                return (
                  <div
                    key={`mod-ctrl-${mod.id}-${mIdx}`}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isModified
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs'
                        : isHidden
                        ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg border shrink-0 ${mod.badgeColor}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {mod.name}
                          </h4>
                          {isHidden ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                              <EyeOff className="w-2.5 h-2.5" /> Hidden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                              <Eye className="w-2.5 h-2.5" /> Visible
                            </span>
                          )}
                          {isModified && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1 rounded">
                              Pending Save
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePendingModule(mod.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                        isHidden
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800'
                      }`}
                      title={isHidden ? `Unhide ${mod.name} (Click Save to apply)` : `Hide ${mod.name} (Click Save to apply)`}
                    >
                      {isHidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Unhide</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-400">
                  <strong>Permanent Cloud Synchronization:</strong> When you click <strong className="text-emerald-600 dark:text-emerald-400">Save Changes</strong>, the settings are instantly saved in Supabase. Your changes take effect immediately on your device without any refresh, and other users will automatically see the changes when they refresh or log in.
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasUnsavedModuleChanges && (
                  <button
                    type="button"
                    onClick={handleDiscardModuleChanges}
                    disabled={isSavingModules}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                  >
                    Discard Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveModuleVisibility}
                  disabled={isSavingModules || !hasUnsavedModuleChanges}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-xs ${
                    hasUnsavedModuleChanges
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isSavingModules ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  <strong>Note:</strong> System Settings remains permanently available so administrators can access this Module Controller anytime.
                </span>
              </span>
            </div>
          </div>
        )}
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
