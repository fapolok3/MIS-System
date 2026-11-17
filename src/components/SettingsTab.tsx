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
  Receipt,
  FileSpreadsheet,
  Wrench,
  CreditCard,
  MapPin,
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
      id: 'bill_tracker',
      name: 'Bill Tracker',
      description: 'Corporate billing entry, invoice registration, and payment tracking',
      icon: Receipt,
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'bill_report',
      name: 'Bill Report & Analytics',
      description: 'Financial KPI cards, billing analytics charts, and Excel/PDF reports',
      icon: FileSpreadsheet,
      badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBrandDirtyRef = useRef(false);
  const lastSyncedBrandRef = useRef({
    appName: appSettings.appName || 'BBL DM System',
    tagline: appSettings.tagline || 'Enterprise Management Suite',
    appLogo: appSettings.appLogo || '',
  });

  useEffect(() => {
    if (!appSettings) return;
    const nextAppName = appSettings.appName ?? 'BBL DM System';
    const nextTagline = appSettings.tagline ?? 'Enterprise Management Suite';
    const nextLogo = appSettings.appLogo ?? '';

    const prev = lastSyncedBrandRef.current;
    const remoteChanged =
      prev.appName !== nextAppName ||
      prev.tagline !== nextTagline ||
      prev.appLogo !== nextLogo;

    if (remoteChanged && !isBrandDirtyRef.current && !isUploadingLogo && !isSavingBrand) {
      setAppNameInput(nextAppName);
      setTaglineInput(nextTagline);
      setLogoInput(nextLogo);
      setLogoPreviewError(false);
      lastSyncedBrandRef.current = {
        appName: nextAppName,
        tagline: nextTagline,
        appLogo: nextLogo,
      };
    }
  }, [appSettings, isUploadingLogo, isSavingBrand]);

  // Category Group Form
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('branch');

  // New Category Item Form (under selected group)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    categoryGroups[0]?.id || 'branch'
  );
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dropdown options new item inputs
  const [inputs, setInputs] = useState<Partial<Record<keyof SystemOptions, string>>>({});

  // Filter tab for System Dropdown Options (exact Sidebar module names)
  type ModuleFilterTab =
    | 'ALL'
    | 'DEVICE_ISSUE_TRACKER'
    | 'SERVICE_TICKET_TRACKER'
    | 'BILL_TRACKER'
    | 'ISSUE_TRACKER'
    | 'PO'
    | 'SERVICE'
    | 'SIM'
    | 'DEVICE_MIS';

  const [optionFilterTab, setOptionFilterTab] = useState<ModuleFilterTab>('ALL');

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

  // Shared helper to persist brand settings locally & to Supabase
  const persistBrandSettings = async (
    updated: AppSettings,
    successMsg?: string,
    localFallbackMsg?: string
  ) => {
    setIsSavingBrand(true);
    lastSyncedBrandRef.current = {
      appName: updated.appName,
      tagline: updated.tagline || 'Enterprise Management Suite',
      appLogo: updated.appLogo || '',
    };
    isBrandDirtyRef.current = false;

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
      showToast(successMsg || 'Brand settings & Logo saved to Supabase successfully!');
    } else {
      showToast(
        localFallbackMsg ||
          'Logo applied locally! Could not sync to Supabase (check app_settings table).'
      );
    }
  };

  // Process & compress image file from picker or drag-and-drop, then apply immediately
  const processLogoFile = (file: File) => {
    const isImageMime = file.type.startsWith('image/');
    const isImageExt = /\.(png|jpe?g|svg|webp|gif|ico)$/i.test(file.name);
    if (!isImageMime && !isImageExt) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP, GIF, ICO).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file is too large (max 5 MB). Please choose a smaller image.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoPreviewError(false);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsUploadingLogo(false);
      showToast('Failed to read the selected logo file. Please try again.');
    };

    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      if (!imgUrl || !imgUrl.startsWith('data:')) {
        setIsUploadingLogo(false);
        showToast('Invalid image data. Please try another file.');
        return;
      }

      const applyFinalLogo = async (finalDataUrl: string) => {
        if (!finalDataUrl || finalDataUrl === 'data:,' || !finalDataUrl.startsWith('data:image/')) {
          setIsUploadingLogo(false);
          showToast('Could not process logo image. Please try a PNG or JPG file.');
          return;
        }

        setLogoInput(finalDataUrl);
        setLogoPreviewError(false);
        setIsUploadingLogo(false);

        const updated: AppSettings = {
          appName: appNameInput.trim() || 'BBL DM System',
          appLogo: finalDataUrl,
          tagline: taglineInput.trim() || 'Enterprise Management Suite',
          hiddenModules: appSettings.hiddenModules,
        };

        await persistBrandSettings(
          updated,
          'Logo uploaded and applied successfully!',
          'Logo uploaded and applied locally!'
        );
      };

      const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
      const isIcoOrGif =
        file.type === 'image/x-icon' ||
        file.type === 'image/vnd.microsoft.icon' ||
        file.type === 'image/gif' ||
        /\.(ico|gif)$/i.test(file.name);

      // Keep SVG / small ICO / small GIF directly to preserve vector sharpness & animation
      if ((isSvg || isIcoOrGif) && imgUrl.length <= 250_000) {
        void applyFinalLogo(imgUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        if (!naturalW || !naturalH) {
          void applyFinalLogo(imgUrl);
          return;
        }

        const encodeResized = (maxDim: number, mime: string, quality?: number): string | null => {
          let width = naturalW;
          let height = naturalH;

          if (width > height) {
            if (width > maxDim) {
              height = Math.max(1, Math.round((height * maxDim) / width));
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.max(1, Math.round((width * maxDim) / height));
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const out = canvas.toDataURL(mime, quality);
          return out && out !== 'data:,' ? out : null;
        };

        let output = encodeResized(400, 'image/png');
        if (!output || output.length > 350_000) {
          const webpOut = encodeResized(400, 'image/webp', 0.88);
          if (webpOut && webpOut.startsWith('data:image/webp') && webpOut.length <= 350_000) {
            output = webpOut;
          } else {
            const smallerPng = encodeResized(256, 'image/png');
            const smallerWebp = encodeResized(256, 'image/webp', 0.85);
            if (smallerWebp && smallerWebp.startsWith('data:image/webp')) {
              output = smallerWebp;
            } else if (smallerPng) {
              output = smallerPng;
            }
          }
        }

        void applyFinalLogo(output || imgUrl);
      };

      img.onerror = () => {
        // Fallback to raw data URL if browser supports it directly
        void applyFinalLogo(imgUrl);
      };

      img.src = imgUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so the same file can be re-selected if needed
    e.target.value = '';
    if (!file) return;
    processLogoFile(file);
  };

  const handleLogoDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(true);
  };

  const handleLogoDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActiveLogo) setDragActiveLogo(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  // Save Brand & Logo settings
  const handleSaveBrandSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: AppSettings = {
      appName: appNameInput.trim() || 'BBL DM System',
      appLogo: logoInput.trim(),
      tagline: taglineInput.trim() || 'Enterprise Management Suite',
      hiddenModules: appSettings.hiddenModules,
    };

    await persistBrandSettings(
      updated,
      'Brand settings & Logo saved to Supabase successfully!',
      'Brand settings saved locally! Ensure the app_settings table exists in Supabase.'
    );
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    askConfirmation(
      'Remove System Logo',
      'Are you sure you want to remove the custom logo? The default system icon will be displayed.',
      () => {
        setLogoInput('');
        setLogoPreviewError(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        const updated: AppSettings = {
          appName: appNameInput.trim() || 'BBL DM System',
          appLogo: '',
          tagline: taglineInput.trim() || 'Enterprise Management Suite',
          hiddenModules: appSettings.hiddenModules,
        };
        void persistBrandSettings(
          updated,
          'Custom logo removed. Default icon restored.',
          'Custom logo removed locally.'
        );
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
        setLogoPreviewError(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        const updated: AppSettings = {
          ...defaultAppSettings,
          hiddenModules: appSettings.hiddenModules,
        };
        void persistBrandSettings(
          updated,
          'Brand settings reset to defaults.',
          'Brand settings reset locally.'
        );
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

  interface OptionSectionConfig {
    key: keyof SystemOptions;
    moduleId: Exclude<ModuleFilterTab, 'ALL'>;
    moduleLabel: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    badgeColor: string;
    feedTag: string;
  }

  const moduleTabs: {
    id: ModuleFilterTab;
    label: string;
    activeClass: string;
    idleClass: string;
    icon: React.ReactNode;
    note?: string;
  }[] = [
    {
      id: 'ALL',
      label: 'All Modules',
      activeClass: 'bg-indigo-600 text-white font-bold shadow-xs',
      idleClass:
        'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800',
      icon: <Filter className="w-3.5 h-3.5" />,
    },
    {
      id: 'DEVICE_ISSUE_TRACKER',
      label: 'Device Issue Tracker',
      activeClass: 'bg-indigo-600 text-white font-bold shadow-xs ring-2 ring-indigo-400/40',
      idleClass:
        'bg-indigo-50 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60',
      icon: <Cpu className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in Device Issue Tracker & Device Issue Report (filter + Edit modal).',
    },
    {
      id: 'SERVICE_TICKET_TRACKER',
      label: 'Service Ticket Tracker',
      activeClass: 'bg-cyan-600 text-white font-bold shadow-xs ring-2 ring-cyan-400/40',
      idleClass:
        'bg-cyan-50 dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-slate-800 border border-cyan-200 dark:border-cyan-900/60',
      icon: <Wrench className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in Service Ticket Tracker & Service Ticket Report (Branch Name uses Device MIS Tree).',
    },
    {
      id: 'BILL_TRACKER',
      label: 'Bill Tracker',
      activeClass: 'bg-violet-600 text-white font-bold shadow-xs ring-2 ring-violet-400/40',
      idleClass:
        'bg-violet-50 dark:bg-slate-900 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-slate-800 border border-violet-200 dark:border-violet-900/60',
      icon: <Receipt className="w-3.5 h-3.5" />,
      note: 'Payment Status and Payment Method flow into Bill Tracker & Bill Report. (Client Name, Client Location, and Bill Type / Category also have inline + Add / Del controls inside Bill Tracker.)',
    },
    {
      id: 'ISSUE_TRACKER',
      label: 'Issue Tracker',
      activeClass: 'bg-rose-600 text-white font-bold shadow-xs ring-2 ring-rose-400/40',
      idleClass:
        'bg-rose-50 dark:bg-slate-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-800 border border-rose-200 dark:border-rose-900/60',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in Issue Tracker & Issue Report. (Problem Category is managed in Category Tree Manager above.)',
    },
    {
      id: 'PO',
      label: 'Purchase Orders (PO)',
      activeClass: 'bg-teal-600 text-white font-bold shadow-xs ring-2 ring-teal-400/40',
      idleClass:
        'bg-teal-50 dark:bg-slate-900 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-slate-800 border border-teal-200 dark:border-teal-900/60',
      icon: <FileText className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in Purchase Orders (PO) Add / Edit modals. (Category uses Device MIS Tree.)',
    },
    {
      id: 'SERVICE',
      label: 'Service Tracker',
      activeClass: 'bg-sky-600 text-white font-bold shadow-xs ring-2 ring-sky-400/40',
      idleClass:
        'bg-sky-50 dark:bg-slate-900 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-slate-800 border border-sky-200 dark:border-sky-900/60',
      icon: <Headphones className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in Service Tracker (New Ticket / Edit Ticket modals).',
    },
    {
      id: 'SIM',
      label: 'SIM Management',
      activeClass: 'bg-blue-600 text-white font-bold shadow-xs ring-2 ring-blue-400/40',
      idleClass:
        'bg-blue-50 dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-800 border border-blue-200 dark:border-blue-900/60',
      icon: <Smartphone className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in SIM Management Add / Edit modals.',
    },
    {
      id: 'DEVICE_MIS',
      label: 'Device MIS Tree',
      activeClass: 'bg-emerald-600 text-white font-bold shadow-xs ring-2 ring-emerald-400/40',
      idleClass:
        'bg-emerald-50 dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-800 border border-emerald-200 dark:border-emerald-900/60',
      icon: <Layers className="w-3.5 h-3.5" />,
      note: 'Options below match exact field names in Device MIS Tree Add / Edit Device modals.',
    },
  ];

  const optionSections: OptionSectionConfig[] = [
    // 1. Device Issue Tracker
    {
      key: 'deviceIssueTypes',
      moduleId: 'DEVICE_ISSUE_TRACKER',
      moduleLabel: 'Device Issue Tracker',
      title: 'Device Issues Type',
      description: 'Field: "Device Issues Type" in Device Issue Tracker & Edit modal',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      badgeColor:
        'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      feedTag: 'Device Issue Tracker',
    },
    {
      key: 'deviceResponsibilities',
      moduleId: 'DEVICE_ISSUE_TRACKER',
      moduleLabel: 'Device Issue Tracker',
      title: 'Responsibility',
      description: 'Field: "Responsibility" in Device Issue Tracker, Filter & Edit modal',
      icon: <Users className="w-4 h-4 text-indigo-500" />,
      badgeColor:
        'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      feedTag: 'Device Issue Tracker',
    },
    {
      key: 'deviceIssueStatuses',
      moduleId: 'DEVICE_ISSUE_TRACKER',
      moduleLabel: 'Device Issue Tracker',
      title: 'Status',
      description: 'Field: "Status" in Device Issue Tracker, Filter & Edit modal',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      badgeColor:
        'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      feedTag: 'Device Issue Tracker',
    },

    // 2. Service Ticket Tracker
    {
      key: 'serviceLocationTypes',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Location Type',
      description: 'Field: "Location Type" in Service Ticket Tracker form',
      icon: <MapPin className="w-4 h-4 text-cyan-500" />,
      badgeColor:
        'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      feedTag: 'Service Ticket Tracker',
    },
    {
      key: 'serviceSegments',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Segment',
      description: 'Field: "Segment" in Service Ticket Tracker form',
      icon: <Layers className="w-4 h-4 text-sky-500" />,
      badgeColor:
        'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      feedTag: 'Service Ticket Tracker',
    },
    {
      key: 'serviceIssueTypes',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Issue Types',
      description: 'Field: "Issue Types" checklist in Service Ticket Tracker',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      badgeColor:
        'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      feedTag: 'Service Ticket Tracker',
    },
    {
      key: 'servicePriorities',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Issue Priority',
      description: 'Field: "Issue Priority" in Service Ticket Tracker form',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      badgeColor:
        'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      feedTag: 'Service Ticket Tracker',
    },
    {
      key: 'serviceTicketStatuses',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Current Ticket Status',
      description: 'Field: "Current Ticket Status" in Service Ticket Tracker & Report',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      badgeColor:
        'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      feedTag: 'Service Ticket Tracker',
    },
    {
      key: 'serviceDeliveryOptions',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Delivery Option',
      description: 'Field: "Delivery Option" in Service Ticket Tracker form',
      icon: <Box className="w-4 h-4 text-purple-500" />,
      badgeColor:
        'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      feedTag: 'Service Ticket Tracker',
    },
    {
      key: 'servicePaymentMethods',
      moduleId: 'SERVICE_TICKET_TRACKER',
      moduleLabel: 'Service Ticket Tracker',
      title: 'Payment Method',
      description: 'Field: "Payment Method" in Service Ticket Tracker form',
      icon: <CreditCard className="w-4 h-4 text-teal-500" />,
      badgeColor:
        'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      feedTag: 'Service Ticket Tracker',
    },

    // 3. Bill Tracker
    {
      key: 'billPaymentStatuses',
      moduleId: 'BILL_TRACKER',
      moduleLabel: 'Bill Tracker',
      title: 'Payment Status',
      description: 'Field: "Payment Status" in Bill Tracker & Bill Report filter',
      icon: <CheckCircle2 className="w-4 h-4 text-violet-500" />,
      badgeColor:
        'bg-violet-50 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      feedTag: 'Bill Tracker',
    },
    {
      key: 'billPaymentMethods',
      moduleId: 'BILL_TRACKER',
      moduleLabel: 'Bill Tracker',
      title: 'Payment Method',
      description: 'Field: "Payment Method" in Bill Tracker & Bill Report filter',
      icon: <CreditCard className="w-4 h-4 text-indigo-500" />,
      badgeColor:
        'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      feedTag: 'Bill Tracker',
    },

    // 4. Issue Tracker
    {
      key: 'issueTrackerStatuses',
      moduleId: 'ISSUE_TRACKER',
      moduleLabel: 'Issue Tracker',
      title: 'Status',
      description: 'Field: "Status" in Issue Tracker, Issue Report Filter & Edit modal',
      icon: <CheckCircle2 className="w-4 h-4 text-rose-500" />,
      badgeColor:
        'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      feedTag: 'Issue Tracker',
    },
    {
      key: 'issuePremisesNames',
      moduleId: 'ISSUE_TRACKER',
      moduleLabel: 'Issue Tracker',
      title: 'Premesis Name',
      description: 'Field: "Premesis Name" in Issue Tracker & Edit modal',
      icon: <Building className="w-4 h-4 text-purple-500" />,
      badgeColor:
        'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      feedTag: 'Issue Tracker',
    },
    {
      key: 'issuePriorityLevels',
      moduleId: 'ISSUE_TRACKER',
      moduleLabel: 'Issue Tracker',
      title: 'Priority Level',
      description: 'Field: "Priority Level" in Issue Tracker, Filter & Edit modal',
      icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
      badgeColor:
        'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      feedTag: 'Issue Tracker',
    },

    // 5. Purchase Orders (PO)
    {
      key: 'vendors',
      moduleId: 'PO',
      moduleLabel: 'Purchase Orders (PO)',
      title: 'Vendor Name',
      description: 'Field: "Vendor Name" in Purchase Orders (PO) Add / Edit modal',
      icon: <ShoppingBag className="w-4 h-4 text-teal-500" />,
      badgeColor:
        'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      feedTag: 'Purchase Orders (PO)',
    },
    {
      key: 'poStatuses',
      moduleId: 'PO',
      moduleLabel: 'Purchase Orders (PO)',
      title: 'Status',
      description: 'Field: "Status" in Purchase Orders (PO) Add / Edit modal',
      icon: <ListPlus className="w-4 h-4 text-emerald-500" />,
      badgeColor:
        'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      feedTag: 'Purchase Orders (PO)',
    },

    // 6. Service Tracker
    {
      key: 'issueTypes',
      moduleId: 'SERVICE',
      moduleLabel: 'Service Tracker',
      title: 'Issue Type',
      description: 'Field: "Issue Type" in Service Tracker Add / Edit modal',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      badgeColor:
        'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      feedTag: 'Service Tracker',
    },
    {
      key: 'ticketPriorities',
      moduleId: 'SERVICE',
      moduleLabel: 'Service Tracker',
      title: 'Issue Priority',
      description: 'Field: "Issue Priority" in Service Tracker Add / Edit modal',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      badgeColor:
        'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      feedTag: 'Service Tracker',
    },
    {
      key: 'ticketStatuses',
      moduleId: 'SERVICE',
      moduleLabel: 'Service Tracker',
      title: 'Current Status',
      description: 'Field: "Current Status" in Service Tracker Add / Edit modal',
      icon: <CheckCircle2 className="w-4 h-4 text-sky-500" />,
      badgeColor:
        'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      feedTag: 'Service Tracker',
    },

    // 7. SIM Management
    {
      key: 'simOperators',
      moduleId: 'SIM',
      moduleLabel: 'SIM Management',
      title: 'Operator',
      description: 'Field: "Operator" in SIM Management Add / Edit modal',
      icon: <Radio className="w-4 h-4 text-blue-500" />,
      badgeColor:
        'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      feedTag: 'SIM Management',
    },
    {
      key: 'simStatuses',
      moduleId: 'SIM',
      moduleLabel: 'SIM Management',
      title: 'Status',
      description: 'Field: "Status" in SIM Management Add / Edit modal',
      icon: <Smartphone className="w-4 h-4 text-sky-500" />,
      badgeColor:
        'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      feedTag: 'SIM Management',
    },

    // 8. Device MIS Tree
    {
      key: 'deviceStatuses',
      moduleId: 'DEVICE_MIS',
      moduleLabel: 'Device MIS Tree',
      title: 'Status',
      description: 'Field: "Status" in Device MIS Tree Add / Edit Device modal',
      icon: <Cpu className="w-4 h-4 text-emerald-500" />,
      badgeColor:
        'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      feedTag: 'Device MIS Tree',
    },
    {
      key: 'simOperators',
      moduleId: 'DEVICE_MIS',
      moduleLabel: 'Device MIS Tree',
      title: 'Operator',
      description: 'Field: "Operator" in Device MIS Tree Add / Edit Device modal',
      icon: <Radio className="w-4 h-4 text-cyan-500" />,
      badgeColor:
        'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      feedTag: 'Device MIS Tree',
    },
    {
      key: 'accessTypes',
      moduleId: 'DEVICE_MIS',
      moduleLabel: 'Device MIS Tree',
      title: 'Access Type',
      description: 'Field: "Access Type" in Device MIS Tree Add / Edit Device modal',
      icon: <Layers className="w-4 h-4 text-indigo-500" />,
      badgeColor:
        'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      feedTag: 'Device MIS Tree',
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
                  onChange={(e) => {
                    isBrandDirtyRef.current = true;
                    setAppNameInput(e.target.value);
                  }}
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
                  onChange={(e) => {
                    isBrandDirtyRef.current = true;
                    setTaglineInput(e.target.value);
                  }}
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
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif,image/x-icon,.png,.jpg,.jpeg,.svg,.webp,.gif,.ico"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                      id="logo-file-input"
                    />
                    <label
                      htmlFor="logo-file-input"
                      onDragEnter={handleLogoDragEnter}
                      onDragOver={handleLogoDragOver}
                      onDragLeave={handleLogoDragLeave}
                      onDrop={handleLogoDrop}
                      className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center ${
                        dragActiveLogo
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950'
                      }`}
                    >
                      <Upload
                        className={`w-6 h-6 ${
                          isUploadingLogo
                            ? 'text-amber-500 animate-pulse'
                            : 'text-indigo-500 dark:text-indigo-400'
                        }`}
                      />
                      <div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {isUploadingLogo
                            ? 'Processing logo...'
                            : dragActiveLogo
                              ? 'Drop logo image here'
                              : 'Click to upload logo'}
                        </span>{' '}
                        {!isUploadingLogo && !dragActiveLogo && (
                          <span className="text-slate-500 dark:text-slate-400">or drag and drop</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        PNG, JPG, SVG, WebP, GIF, ICO (Max 5MB — auto-applies & syncs on upload)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={logoInput}
                      onChange={(e) => {
                        isBrandDirtyRef.current = true;
                        setLogoPreviewError(false);
                        setLogoInput(e.target.value);
                      }}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Enter a direct image link or Supabase Storage public URL, then click Save.
                    </p>
                  </div>
                )}

                {logoInput && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={logoInput}
                        alt="Uploaded Logo Preview"
                        onError={() => setLogoPreviewError(true)}
                        onLoad={() => setLogoPreviewError(false)}
                        className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {logoPreviewError ? 'Unable to load preview image' : 'Active System Logo Ready'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {logoInput.startsWith('data:')
                            ? 'Embedded custom image uploaded'
                            : logoInput}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer shrink-0 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingBrand || isUploadingLogo}
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

        {/* Quick Filter Tabs matching exact Sidebar module names */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 text-xs font-semibold">
          {moduleTabs.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? optionSections.length
                : optionSections.filter((s) => s.moduleId === tab.id).length;
            const isActive = optionFilterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOptionFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  isActive ? tab.activeClass : tab.idleClass
                }`}
              >
                {tab.icon}
                <span>
                  {tab.label} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Module Context Banner */}
        {optionFilterTab !== 'ALL' && (() => {
          const activeTabMeta = moduleTabs.find((t) => t.id === optionFilterTab);
          if (!activeTabMeta?.note) return null;
          return (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 flex items-start gap-3 text-xs">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 shrink-0">
                {activeTabMeta.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200">
                  {activeTabMeta.label} — Exact Field Dropdowns
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeTabMeta.note}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Options Cards (Grouped by Module when All Modules is active, or filtered for selected module) */}
        {(optionFilterTab === 'ALL'
          ? moduleTabs.filter((t): t is typeof moduleTabs[number] & { id: Exclude<ModuleFilterTab, 'ALL'> } => t.id !== 'ALL')
          : moduleTabs.filter((t): t is typeof moduleTabs[number] & { id: Exclude<ModuleFilterTab, 'ALL'> } => t.id === optionFilterTab)
        ).map((modGroup) => {
          const modSections = optionSections.filter((s) => s.moduleId === modGroup.id);
          if (modSections.length === 0) return null;

          return (
            <div key={`mod-group-${modGroup.id}`} className="space-y-3">
              {optionFilterTab === 'ALL' && (
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800">
                      {modGroup.icon}
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      {modGroup.label}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {modSections.length} dropdown {modSections.length === 1 ? 'field' : 'fields'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {modSections.map((section) => {
                  const list = systemOptions[section.key] || [];
                  const cardKey = `${section.moduleId}-${section.key}`;

                  return (
                    <div
                      key={cardKey}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-700/80 rounded-xl p-4 flex flex-col justify-between space-y-4 transition"
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
                                key={`sys-opt-${cardKey}-${item}-${iIdx}`}
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
          );
        })}
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
