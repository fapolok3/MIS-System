import React, { useState, useEffect } from 'react';
import {
  TabType,
  Device,
  Ticket,
  PurchaseOrder,
  SIMItem,
  CategoryGroup,
  SystemOptions,
  AppSettings,
  IssueTrackerItem,
  LiveActiveUser,
} from './types';
import {
  initialDevices,
  initialTickets,
  initialPOs,
  initialSIMs,
  initialIssues,
  initialCategoryGroups,
  initialSystemOptions,
} from './data/initialData';

import {
  fetchSupabaseDevices,
  insertSupabaseDevice,
  bulkInsertSupabaseDevices,
  deleteSupabaseDevice,
  bulkDeleteSupabaseDevices,
  fetchSupabaseTickets,
  insertSupabaseTicket,
  bulkInsertSupabaseTickets,
  deleteSupabaseTicket,
  bulkDeleteSupabaseTickets,
  fetchSupabasePOs,
  insertSupabasePO,
  deleteSupabasePO,
  bulkDeleteSupabasePOs,
  fetchSupabaseSIMs,
  insertSupabaseSIM,
  bulkInsertSupabaseSIMs,
  deleteSupabaseSIM,
  bulkDeleteSupabaseSIMs,
  fetchSupabaseCategoryGroups,
  saveSupabaseCategoryGroups,
  fetchSupabaseSystemOptions,
  saveSupabaseSystemOptions,
  fetchSupabaseAppSettings,
  saveSupabaseAppSettings,
  fetchSupabaseIssues,
  insertSupabaseIssue,
  deleteSupabaseIssue,
  bulkInsertSupabaseIssues,
  bulkDeleteSupabaseIssues,
  subscribeToSupabaseLiveSync,
  defaultAppSettings,
} from './lib/supabase';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { IssueTrackerTab } from './components/IssueTrackerTab';
import { IssueReportTab } from './components/IssueReportTab';
import { DevicesTab } from './components/DevicesTab';
import { POTab } from './components/POTab';
import { ServiceTab } from './components/ServiceTab';
import { SIMTab } from './components/SIMTab';
import { BranchReportTab } from './components/BranchReportTab';
import { BackupTab } from './components/BackupTab';
import { OdooTab } from './components/OdooTab';
import { SupportTicketGeneratorTab } from './components/SupportTicketGeneratorTab';
import { SettingsTab } from './components/SettingsTab';
import { LoginModal } from './components/LoginModal';
import {
  recordSystemAccessLog,
  pulseLiveHeartbeat,
  removeCurrentLiveSession,
  subscribeToLiveUsers,
  getLiveActiveUsers,
} from './utils/systemLogger';

import { AddCategoryModal } from './components/Modals/AddCategoryModal';
import { AddDeviceModal } from './components/Modals/AddDeviceModal';
import { EditDeviceModal } from './components/Modals/EditDeviceModal';
import { NewTicketModal } from './components/Modals/NewTicketModal';
import { EditTicketModal } from './components/Modals/EditTicketModal';
import { AddPOModal } from './components/Modals/AddPOModal';
import { EditPOModal } from './components/Modals/EditPOModal';
import { AddSIMModal } from './components/Modals/AddSIMModal';
import { EditSIMModal } from './components/Modals/EditSIMModal';
import { ExcelUploadModal } from './components/Modals/ExcelUploadModal';
import { TicketExcelUploadModal } from './components/Modals/TicketExcelUploadModal';
import { ConfirmModal } from './components/Modals/ConfirmModal';
import { Toast, ToastData } from './components/Toast';

const pathToTab = (path: string): TabType => {
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath === '/issue-tracker' || cleanPath === '/tracker' || cleanPath === '/issues') return 'issue_tracker';
  if (cleanPath === '/issue-report' || cleanPath === '/issue-analytics' || cleanPath === '/reports') return 'issue_report';
  if (cleanPath === '/devices') return 'devices';
  if (cleanPath === '/po' || cleanPath === '/purchase-orders') return 'po';
  if (cleanPath === '/service' || cleanPath === '/service-tickets') return 'service';
  if (cleanPath === '/sim' || cleanPath === '/sim-management') return 'sim';
  if (cleanPath === '/branch-report' || cleanPath === '/all-branch-report') return 'branch_report';
  if (cleanPath === '/odoo') return 'odoo';
  if (cleanPath === '/ticket-generator' || cleanPath === '/support-ticket' || cleanPath === '/ticket') return 'ticket_generator';
  if (cleanPath === '/settings') return 'settings';
  if (cleanPath === '/backup') return 'backup';
  return 'dashboard';
};

const tabToPath = (tab: TabType): string => {
  switch (tab) {
    case 'issue_tracker': return '/issue-tracker';
    case 'issue_report': return '/issue-report';
    case 'devices': return '/devices';
    case 'po': return '/po';
    case 'service': return '/service';
    case 'sim': return '/sim';
    case 'branch_report': return '/branch-report';
    case 'odoo': return '/odoo';
    case 'ticket_generator': return '/ticket-generator';
    case 'settings': return '/settings';
    case 'backup': return '/backup';
    case 'dashboard':
    default:
      return '/dashboard';
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      return pathToTab(window.location.pathname);
    }
    return 'dashboard';
  });
  const [activeCategory, setActiveCategory] = useState<string>('Main Branch');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeTab & isLoggedIn with browser URL path
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isLoggedIn) {
        if (window.location.pathname !== '/') {
          window.history.replaceState({ loggedIn: false }, '', '/');
        }
      } else {
        const targetPath = tabToPath(activeTab);
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ tab: activeTab }, '', targetPath);
        }
      }
    }
  }, [activeTab, isLoggedIn]);

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const tab = pathToTab(window.location.pathname);
        setActiveTab(tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Collections State
  const [devices, setDevices] = useState<Device[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('devicesData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialDevices;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('serviceTicketsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialTickets;
  });

  const [pos, setPos] = useState<PurchaseOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('purchaseOrdersData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialPOs;
  });

  const [sims, setSims] = useState<SIMItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('simsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialSIMs;
  });
  const [issues, setIssues] = useState<IssueTrackerItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('issueTrackerData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const demoIds = new Set(['ISSUE-1001', 'ISSUE-1002', 'ISSUE-1003', 'ISSUE-1004']);
            return parsed.filter((item: IssueTrackerItem) => !demoIds.has(item.id));
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialIssues;
  });
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('categoryGroups');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialCategoryGroups;
  });
  const [systemOptions, setSystemOptions] = useState<SystemOptions>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('systemOptions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              deviceStatuses: Array.isArray(parsed.deviceStatuses) && parsed.deviceStatuses.length > 0 ? parsed.deviceStatuses : initialSystemOptions.deviceStatuses,
              simOperators: Array.isArray(parsed.simOperators) && parsed.simOperators.length > 0 ? parsed.simOperators : initialSystemOptions.simOperators,
              accessTypes: Array.isArray(parsed.accessTypes) && parsed.accessTypes.length > 0 ? parsed.accessTypes : initialSystemOptions.accessTypes,
              locationTypes: Array.isArray(parsed.locationTypes) && parsed.locationTypes.length > 0 ? parsed.locationTypes : initialSystemOptions.locationTypes,
              issueTypes: Array.isArray(parsed.issueTypes) && parsed.issueTypes.length > 0 ? parsed.issueTypes : initialSystemOptions.issueTypes,
              ticketPriorities: Array.isArray(parsed.ticketPriorities) && parsed.ticketPriorities.length > 0 ? parsed.ticketPriorities : initialSystemOptions.ticketPriorities,
              ticketStatuses: Array.isArray(parsed.ticketStatuses) && parsed.ticketStatuses.length > 0 ? parsed.ticketStatuses : initialSystemOptions.ticketStatuses,
              vendors: Array.isArray(parsed.vendors) && parsed.vendors.length > 0 ? parsed.vendors : initialSystemOptions.vendors,
              poStatuses: Array.isArray(parsed.poStatuses) && parsed.poStatuses.length > 0 ? parsed.poStatuses : initialSystemOptions.poStatuses,
              simStatuses: Array.isArray(parsed.simStatuses) && parsed.simStatuses.length > 0 ? parsed.simStatuses : initialSystemOptions.simStatuses,
              technicians: Array.isArray(parsed.technicians) && parsed.technicians.length > 0 ? parsed.technicians : initialSystemOptions.technicians,
              slaStatuses: Array.isArray(parsed.slaStatuses) && parsed.slaStatuses.length > 0 ? parsed.slaStatuses : initialSystemOptions.slaStatuses,
            };
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialSystemOptions;
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('appSettings');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return defaultAppSettings;
  });

  // Modals Visibility State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [isAddSIMOpen, setIsAddSIMOpen] = useState(false);
  const [editingSIM, setEditingSIM] = useState<SIMItem | null>(null);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);
  const [isTicketExcelUploadOpen, setIsTicketExcelUploadOpen] = useState(false);

  // Global Toast & Confirm Notification State
  const [toast, setToast] = useState<ToastData | null>(null);
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

  // Real-time Live Online Users State
  const [liveUsers, setLiveUsers] = useState<LiveActiveUser[]>(() => getLiveActiveUsers());

  // Active tab to readable title converter for presence
  const getTabReadableTitle = (tab: TabType): string => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'issue_tracker': return 'Issue Tracker';
      case 'issue_report': return 'Issue Analytics';
      case 'devices': return 'Devices Inventory';
      case 'po': return 'Purchase Orders';
      case 'service': return 'Service Tickets SLA';
      case 'sim': return 'SIM Management';
      case 'branch_report': return 'Branch MIS Report';
      case 'odoo': return 'Odoo Portal';
      case 'ticket_generator': return 'Ticket Generator';
      case 'settings': return 'System Settings';
      case 'backup': return 'Backup & Restore';
      default: return 'Online Portal';
    }
  };

  // Real-time live presence & heartbeat tracking
  useEffect(() => {
    const currentTabName = getTabReadableTitle(activeTab);

    // Initial heartbeat pulse on mount / tab change
    pulseLiveHeartbeat(currentTabName);

    // Subscribe to live user updates from storage / broadcast channel
    const unsubscribe = subscribeToLiveUsers((users) => {
      setLiveUsers(users);
    });

    // Regular heartbeat interval (every 4 seconds)
    const interval = setInterval(() => {
      pulseLiveHeartbeat(currentTabName);
    }, 4000);

    // Window focus & unload handlers
    const handleFocus = () => pulseLiveHeartbeat(currentTabName);
    const handleBeforeUnload = () => removeCurrentLiveSession();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTab]);

  const handleCloseToast = React.useCallback(() => {
    setToast(null);
  }, []);

  const showToast = React.useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        message,
        type,
      });
    },
    []
  );

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Load live data from Supabase (Single Source of Truth)
  const loadSupabaseData = React.useCallback(async (silent = false) => {
    try {
      const [
        dbDevices,
        dbTickets,
        dbPOs,
        dbSIMs,
        dbIssues,
        dbCategoryGroups,
        dbSystemOptions,
        dbAppSettings,
      ] = await Promise.all([
        fetchSupabaseDevices(),
        fetchSupabaseTickets(),
        fetchSupabasePOs(),
        fetchSupabaseSIMs(),
        fetchSupabaseIssues(),
        fetchSupabaseCategoryGroups(),
        fetchSupabaseSystemOptions(),
        fetchSupabaseAppSettings(),
      ]);

      // 1. Devices (Supabase is authoritative, never resurrect deleted items)
      if (dbDevices !== null) {
        setDevices(dbDevices);
        try {
          localStorage.setItem('devicesData', JSON.stringify(dbDevices));
        } catch (e) {
          console.warn('localStorage save devices error', e);
        }
      }

      // 2. Service Tickets & SLA
      if (dbTickets !== null) {
        setTickets(dbTickets);
        try {
          localStorage.setItem('serviceTicketsData', JSON.stringify(dbTickets));
        } catch (e) {
          console.warn('localStorage save tickets error', e);
        }
      }

      // 3. Purchase Orders
      if (dbPOs !== null) {
        setPos(dbPOs);
        try {
          localStorage.setItem('purchaseOrdersData', JSON.stringify(dbPOs));
        } catch (e) {
          console.warn('localStorage save pos error', e);
        }
      }

      // 4. SIMs
      if (dbSIMs !== null) {
        setSims(dbSIMs);
        try {
          localStorage.setItem('simsData', JSON.stringify(dbSIMs));
        } catch (e) {
          console.warn('localStorage save sims error', e);
        }
      }

      // 5. Issues (Issue Tracker)
      if (dbIssues !== null) {
        setIssues(dbIssues);
        try {
          localStorage.setItem('issueTrackerData', JSON.stringify(dbIssues));
        } catch (e) {
          console.warn('localStorage save issues error', e);
        }
      }

      // 6. Category Groups
      if (dbCategoryGroups !== null && dbCategoryGroups.length > 0) {
        setCategoryGroups(dbCategoryGroups);
        try {
          localStorage.setItem('categoryGroups', JSON.stringify(dbCategoryGroups));
        } catch (e) {
          console.warn('localStorage save categoryGroups error', e);
        }
      }

      // 7. System Dropdown Options
      if (dbSystemOptions !== null) {
        setSystemOptions(dbSystemOptions);
        try {
          localStorage.setItem('systemOptions', JSON.stringify(dbSystemOptions));
        } catch (e) {
          console.warn('localStorage save systemOptions error', e);
        }
      }

      // 8. App Settings
      if (dbAppSettings !== null) {
        setAppSettings(dbAppSettings);
        try {
          localStorage.setItem('appSettings', JSON.stringify(dbAppSettings));
        } catch (e) {
          console.warn('localStorage save appSettings error', e);
        }
      }
    } catch (err) {
      if (!silent) {
        console.warn('Error loading Supabase live data:', err);
      }
    }
  }, []);

  // Real-time synchronization across all laptops, tabs, and users
  useEffect(() => {
    // 1. Initial fetch from database
    loadSupabaseData();

    // 2. Realtime WebSocket subscription from Supabase for instant multi-laptop synchronization
    let debounceTimer: any = null;
    const triggerDebouncedSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadSupabaseData(true);
      }, 300);
    };

    const unsubscribeRealtime = subscribeToSupabaseLiveSync(() => {
      triggerDebouncedSync();
    });

    // 3. Tab focus & visibility change listener (refreshes if user returns from another tab or computer)
    const handleWindowFocus = () => {
      loadSupabaseData(true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSupabaseData(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Background heartbeat refresh interval (every 20s) to keep all laptops 100% in sync
    const intervalId = setInterval(() => {
      loadSupabaseData(true);
    }, 20000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeRealtime();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [loadSupabaseData]);

  // Persist collections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('serviceTicketsData', JSON.stringify(tickets));
    } catch (e) {
      console.warn('localStorage save error', e);
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('devicesData', JSON.stringify(devices));
    } catch (e) {
      console.warn('localStorage save error', e);
    }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem('purchaseOrdersData', JSON.stringify(pos));
    } catch (e) {
      console.warn('localStorage save error', e);
    }
  }, [pos]);

  useEffect(() => {
    try {
      localStorage.setItem('simsData', JSON.stringify(sims));
    } catch (e) {
      console.warn('localStorage save error', e);
    }
  }, [sims]);

  // Persist categoryGroups changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('categoryGroups', JSON.stringify(categoryGroups));
    } catch (e) {
      console.warn('localStorage save error', e);
    }
  }, [categoryGroups]);

  // Persist systemOptions changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('systemOptions', JSON.stringify(systemOptions));
    } catch (e) {
      console.warn('localStorage save error', e);
    }
  }, [systemOptions]);

  // Dynamically update document title and browser favicon based on app branding & uploaded logo
  useEffect(() => {
    if (appSettings.appName) {
      document.title = appSettings.appName;
    }

    let link: HTMLLinkElement | null = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!link) {
      link = document.querySelector("link[rel*='icon']");
    }
    if (!link) {
      link = document.createElement('link');
      link.id = 'app-favicon';
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    if (appSettings.appLogo) {
      link.href = appSettings.appLogo;
      // If it's a data URL or image type
      if (appSettings.appLogo.startsWith('data:image/svg+xml')) {
        link.type = 'image/svg+xml';
      } else if (appSettings.appLogo.startsWith('data:image/png')) {
        link.type = 'image/png';
      } else if (appSettings.appLogo.startsWith('data:image/jpeg') || appSettings.appLogo.startsWith('data:image/jpg')) {
        link.type = 'image/jpeg';
      }
    } else {
      link.type = 'image/svg+xml';
      link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'%3E%3C/path%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'%3E%3C/polyline%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'%3E%3C/line%3E%3C/svg%3E";
    }
  }, [appSettings.appLogo, appSettings.appName]);

  // Category Handler
  const handleAddCategory = (groupTitle: string, categoryName: string) => {
    setCategoryGroups((prev) => {
      const updated = prev.map((group) => {
        if (group.title === groupTitle) {
          return {
            ...group,
            items: [...group.items, categoryName],
          };
        }
        return group;
      });
      saveSupabaseCategoryGroups(updated);
      return updated;
    });
    setActiveCategory(categoryName);
    setActiveTab('devices');
    showToast(`Category "${categoryName}" added successfully!`);
  };

  // Helper to construct SIM Item from Device (supports blank SIMs and duplicate creation)
  const createSimItemFromDevice = (device: Device, customId?: string): SIMItem => {
    const rawSim = device.sim ? String(device.sim).trim() : '';
    const isBlankOrPlaceholder =
      !rawSim ||
      rawSim === '-' ||
      rawSim.toLowerCase() === 'n/a' ||
      rawSim.toLowerCase() === 'none' ||
      rawSim.toLowerCase() === 'null' ||
      rawSim.toLowerCase() === 'undefined';

    const simStatus: 'ACTIVE' | 'INACTIVE' =
      device.status === 'LIVE' ? 'ACTIVE' : 'INACTIVE';

    return {
      id: customId || `sim-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      simNumber: isBlankOrPlaceholder ? '' : rawSim,
      operator: device.operator || 'GP',
      assignedDevice: device.id || '-',
      location: device.location || '-',
      status: simStatus,
    };
  };

  // Sync & Reconcile All SIMs from Device Inventory (creates for all devices, including blank & duplicates)
  const handleSyncAllSimsFromDevices = () => {
    if (devices.length === 0) {
      showToast('No devices available to sync.', 'info');
      return;
    }

    const baseTime = Date.now();
    // Create a SIM record for EVERY device in Device MIS Tree (including blank SIM numbers and duplicates)
    const syncedSims: SIMItem[] = devices.map((dev, idx) =>
      createSimItemFromDevice(
        dev,
        `sim-${baseTime}-${idx}-${Math.floor(Math.random() * 100000)}`
      )
    );

    setSims(syncedSims);
    try {
      localStorage.setItem('simsData', JSON.stringify(syncedSims));
    } catch (e) {}
    bulkInsertSupabaseSIMs(syncedSims);

    const message = `Sync complete: Created & synchronized ${syncedSims.length} SIM records in SIM management from Device MIS Tree.`;
    showToast(message, 'success');
  };

  const handleSaveNewDevice = (deviceData: Omit<Device, 'sl'>) => {
    const newDevice: Device = {
      ...deviceData,
      sl: Date.now(),
    };
    setDevices((prev) => [...prev, newDevice]);
    insertSupabaseDevice(newDevice);

    // Auto-create SIM in SIM Management (always creates, even if blank or duplicate)
    const newSim = createSimItemFromDevice(newDevice);
    setSims((prevSims) => {
      const updatedSims = [newSim, ...prevSims];
      try {
        localStorage.setItem('simsData', JSON.stringify(updatedSims));
      } catch (e) {}
      return updatedSims;
    });
    insertSupabaseSIM(newSim);

    showToast(`Device "${newDevice.id}" created & added to SIM management!`);
  };

  const handleSaveEditedDevice = (updatedDevice: Device) => {
    setDevices((prev) =>
      prev.map((d) => (d.sl === updatedDevice.sl ? updatedDevice : d))
    );
    insertSupabaseDevice(updatedDevice);

    const rawSim = updatedDevice.sim ? String(updatedDevice.sim).trim() : '';
    const isBlankOrPlaceholder =
      !rawSim ||
      rawSim === '-' ||
      rawSim.toLowerCase() === 'n/a' ||
      rawSim.toLowerCase() === 'none' ||
      rawSim.toLowerCase() === 'null' ||
      rawSim.toLowerCase() === 'undefined';
    const cleanSimNum = isBlankOrPlaceholder ? '' : rawSim;
    const simStatus: 'ACTIVE' | 'INACTIVE' =
      updatedDevice.status === 'LIVE' ? 'ACTIVE' : 'INACTIVE';

    setSims((prevSims) => {
      // Check if there is an existing SIM assigned to this device ID
      const existingIndex = prevSims.findIndex(
        (s) =>
          s.assignedDevice &&
          updatedDevice.id &&
          s.assignedDevice.trim().toLowerCase() === updatedDevice.id.trim().toLowerCase()
      );

      let updatedSims: SIMItem[];
      if (existingIndex >= 0) {
        const existingSim = prevSims[existingIndex];
        const updatedSim: SIMItem = {
          ...existingSim,
          simNumber: cleanSimNum,
          operator: updatedDevice.operator || existingSim.operator,
          assignedDevice: updatedDevice.id || existingSim.assignedDevice,
          location: updatedDevice.location || existingSim.location,
          status: simStatus,
        };
        updatedSims = [...prevSims];
        updatedSims[existingIndex] = updatedSim;
        insertSupabaseSIM(updatedSim);
      } else {
        // If no matching SIM exists, create a new one (even if blank or duplicate)
        const newSim = createSimItemFromDevice(updatedDevice);
        updatedSims = [newSim, ...prevSims];
        insertSupabaseSIM(newSim);
      }
      try {
        localStorage.setItem('simsData', JSON.stringify(updatedSims));
      } catch (e) {}
      return updatedSims;
    });

    showToast(`Device "${updatedDevice.id}" updated successfully!`);
  };

  const isValidKey = (val?: string): boolean => {
    if (!val) return false;
    const trimmed = val.trim().toLowerCase();
    return (
      trimmed !== '' &&
      trimmed !== '-' &&
      trimmed !== 'n/a' &&
      trimmed !== 'none' &&
      trimmed !== 'unassigned'
    );
  };

  const handleDeleteDevice = (sl: number) => {
    const target = devices.find((d) => d.sl === sl);
    const label = target ? `Device ID "${target.id}" (SOL: ${target.sol})` : 'this device';

    // Find linked SIMs in SIM Management
    const matchingSims = target
      ? sims.filter((s) => {
          const matchSimNum =
            isValidKey(target.sim) &&
            isValidKey(s.simNumber) &&
            s.simNumber.trim().toLowerCase() === target.sim.trim().toLowerCase();
          const matchDeviceId =
            isValidKey(target.id) &&
            isValidKey(s.assignedDevice) &&
            s.assignedDevice.trim().toLowerCase() === target.id.trim().toLowerCase();
          return matchSimNum || matchDeviceId;
        })
      : [];

    const simNote =
      matchingSims.length > 0
        ? `\n\nNote: Associated SIM card (${matchingSims.map((s) => s.simNumber).join(', ')}) in SIM Management will also be deleted automatically.`
        : '';

    askConfirmation(
      'Confirm Device Deletion',
      `Are you sure you want to delete ${label}? This operation cannot be undone.${simNote}`,
      () => {
        // 1. Delete device
        setDevices((prev) => prev.filter((d) => d.sl !== sl));
        deleteSupabaseDevice(sl);

        // 2. Cascade delete associated SIM card(s)
        if (matchingSims.length > 0) {
          const simIdsToDelete = matchingSims.map((s) => s.id);
          setSims((prev) => prev.filter((s) => !simIdsToDelete.includes(s.id)));
          bulkDeleteSupabaseSIMs(simIdsToDelete);
          showToast(`Device & associated SIM (${matchingSims.map((s) => s.simNumber).join(', ')}) deleted successfully!`);
        } else {
          showToast('Device deleted successfully!');
        }
      }
    );
  };

  const handleBulkDeleteDevices = (sls: number[]) => {
    if (sls.length === 0) return;

    const targetDevices = devices.filter((d) => sls.includes(d.sl));

    // Find all linked SIMs in SIM Management
    const matchingSims = sims.filter((s) => {
      return targetDevices.some((d) => {
        const matchSimNum =
          isValidKey(d.sim) &&
          isValidKey(s.simNumber) &&
          s.simNumber.trim().toLowerCase() === d.sim.trim().toLowerCase();
        const matchDeviceId =
          isValidKey(d.id) &&
          isValidKey(s.assignedDevice) &&
          s.assignedDevice.trim().toLowerCase() === d.id.trim().toLowerCase();
        return matchSimNum || matchDeviceId;
      });
    });

    const simNote =
      matchingSims.length > 0
        ? `\n\nNote: ${matchingSims.length} associated SIM card(s) in SIM Management will also be deleted automatically.`
        : '';

    askConfirmation(
      'Confirm Multiple Devices Deletion',
      `Are you sure you want to delete ${sls.length} selected device(s)? This operation cannot be undone.${simNote}`,
      () => {
        // 1. Delete devices
        setDevices((prev) => prev.filter((d) => !sls.includes(d.sl)));
        bulkDeleteSupabaseDevices(sls);

        // 2. Cascade delete associated SIM cards
        if (matchingSims.length > 0) {
          const simIdsToDelete = matchingSims.map((s) => s.id);
          setSims((prev) => prev.filter((s) => !simIdsToDelete.includes(s.id)));
          bulkDeleteSupabaseSIMs(simIdsToDelete);
          showToast(`${sls.length} device(s) & ${matchingSims.length} linked SIM(s) deleted successfully!`);
        } else {
          showToast(`${sls.length} device(s) deleted successfully!`);
        }
      }
    );
  };

  const handleImportDevices = (newDevices: Device[]) => {
    const baseTime = Date.now();
    const formattedDevices: Device[] = newDevices.map((d, index) => ({
      ...d,
      sl: baseTime + index,
    }));

    // Auto-ensure categories exist in Category Groups for the Device MIS Tree
    const importedCategories = Array.from(
      new Set(formattedDevices.map((d) => d.category))
    );

    setCategoryGroups((prevGroups) => {
      const allExistingCategories = prevGroups.flatMap((g) => g.items);
      const missingCategories = importedCategories.filter(
        (cat) => !allExistingCategories.includes(cat)
      );

      if (missingCategories.length === 0) return prevGroups;

      const updated = prevGroups.map((group, index) => {
        // Add missing categories to the first group
        if (index === 0) {
          return {
            ...group,
            items: [...group.items, ...missingCategories],
          };
        }
        return group;
      });
      saveSupabaseCategoryGroups(updated);
      return updated;
    });

    setDevices((prev) => [...formattedDevices, ...prev]);
    bulkInsertSupabaseDevices(formattedDevices);

    // Auto-create SIM cards in SIM Management for EVERY imported device (blank SIMs & duplicates are all created!)
    const newSimItems: SIMItem[] = formattedDevices.map((dev, idx) =>
      createSimItemFromDevice(
        dev,
        `sim-${baseTime}-${idx}-${Math.floor(Math.random() * 100000)}`
      )
    );

    setSims((prev) => {
      const updatedSims = [...newSimItems, ...prev];
      try {
        localStorage.setItem('simsData', JSON.stringify(updatedSims));
      } catch (e) {}
      return updatedSims;
    });
    bulkInsertSupabaseSIMs(newSimItems);

    if (formattedDevices.length > 0) {
      setActiveCategory(formattedDevices[0].category);
      setActiveTab('devices');
    }
    showToast(`${formattedDevices.length} Devices imported & ${newSimItems.length} SIM records created in SIM management!`);
  };

  // Ticket Handlers
  const handleImportTickets = (newTickets: Ticket[]) => {
    setTickets((prev) => [...newTickets, ...prev]);
    bulkInsertSupabaseTickets(newTickets);
    showToast(`${newTickets.length} Service Ticket(s) imported from Excel successfully!`);
  };

  const handleSaveNewTicket = async (newTicket: Ticket) => {
    setTickets((prev) => {
      const updated = [newTicket, ...prev.filter((t) => t.id !== newTicket.id)];
      try {
        localStorage.setItem('serviceTicketsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    await insertSupabaseTicket(newTicket);
    showToast(`Service Ticket "${newTicket.id}" created successfully!`);
  };

  const handleSaveEditedTicket = async (updatedTicket: Ticket) => {
    setTickets((prev) => {
      const updated = prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      try {
        localStorage.setItem('serviceTicketsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    await insertSupabaseTicket(updatedTicket);
    showToast(`Service Ticket "${updatedTicket.id}" updated successfully!`);
  };

  const handleDeleteTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    const label = target ? `Ticket ID "${target.id}"` : 'this service ticket';

    askConfirmation(
      'Confirm Ticket Deletion',
      `Are you sure you want to delete ${label}? This operation cannot be undone.`,
      () => {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
        deleteSupabaseTicket(ticketId);
        showToast('Service ticket deleted successfully!');
      }
    );
  };

  const handleBulkDeleteTickets = (ticketIds: string[]) => {
    if (ticketIds.length === 0) return;
    askConfirmation(
      'Confirm Multiple Tickets Deletion',
      `Are you sure you want to delete ${ticketIds.length} selected ticket(s)? This operation cannot be undone.`,
      () => {
        setTickets((prev) => prev.filter((t) => !ticketIds.includes(t.id)));
        bulkDeleteSupabaseTickets(ticketIds);
        showToast(`${ticketIds.length} ticket(s) deleted successfully!`);
      }
    );
  };

  // PO & SIM Handlers
  const handleSaveNewPO = (newPO: PurchaseOrder) => {
    setPos((prev) => [newPO, ...prev]);
    insertSupabasePO(newPO);
    showToast(`Purchase Order "${newPO.poNumber}" added successfully!`);
  };

  const handleSaveEditedPO = (updatedPO: PurchaseOrder) => {
    setPos((prev) =>
      prev.map((p) => (p.id === updatedPO.id ? updatedPO : p))
    );
    insertSupabasePO(updatedPO);
    showToast(`Purchase Order "${updatedPO.poNumber}" updated successfully!`);
  };

  const handleDeletePO = (targetIdOrSl: any) => {
    const target = pos.find((p) => (p as any).id === targetIdOrSl || (p as any).sl === targetIdOrSl);
    const label = target ? `Purchase Order "${target.poNumber}"` : 'this purchase order';

    askConfirmation(
      'Confirm Purchase Order Deletion',
      `Are you sure you want to delete ${label}? This operation cannot be undone.`,
      () => {
        setPos((prev) => prev.filter((p) => (p as any).id !== targetIdOrSl && (p as any).sl !== targetIdOrSl));
        deleteSupabasePO(String(targetIdOrSl));
        showToast('Purchase Order deleted successfully!');
      }
    );
  };

  const handleBulkDeletePOs = (poIds: string[]) => {
    if (poIds.length === 0) return;
    askConfirmation(
      'Confirm Multiple Purchase Orders Deletion',
      `Are you sure you want to delete ${poIds.length} selected Purchase Order(s)? This operation cannot be undone.`,
      () => {
        setPos((prev) => prev.filter((p) => !poIds.includes((p as any).id) && !poIds.includes(String((p as any).sl))));
        bulkDeleteSupabasePOs(poIds);
        showToast(`${poIds.length} Purchase Order(s) deleted successfully!`);
      }
    );
  };

  const handleSaveNewSIM = (newSIM: SIMItem) => {
    setSims((prev) => [newSIM, ...prev]);
    insertSupabaseSIM(newSIM);
    showToast(`SIM Card "${newSIM.simNumber}" added successfully!`);
  };

  const handleSaveEditedSIM = (updatedSIM: SIMItem) => {
    setSims((prev) =>
      prev.map((s) => (s.id === updatedSIM.id ? updatedSIM : s))
    );
    insertSupabaseSIM(updatedSIM);
    showToast(`SIM Card "${updatedSIM.simNumber}" updated successfully!`);
  };

  const handleDeleteSIM = (targetIdOrSl: any) => {
    const target = sims.find((s) => (s as any).id === targetIdOrSl || (s as any).sl === targetIdOrSl);
    const label = target ? `SIM Number "${target.simNumber}"` : 'this SIM card';

    // Find linked devices in Device MIS Tree
    const matchingDevices = target
      ? devices.filter((d) => {
          const matchSimNum =
            isValidKey(target.simNumber) &&
            isValidKey(d.sim) &&
            d.sim.trim().toLowerCase() === target.simNumber.trim().toLowerCase();
          const matchDeviceId =
            isValidKey(target.assignedDevice) &&
            isValidKey(d.id) &&
            d.id.trim().toLowerCase() === target.assignedDevice.trim().toLowerCase();
          return matchSimNum || matchDeviceId;
        })
      : [];

    const devNote =
      matchingDevices.length > 0
        ? `\n\nNote: Associated device (${matchingDevices.map((d) => d.id).join(', ')}) in Device MIS Tree will also be deleted automatically.`
        : '';

    askConfirmation(
      'Confirm SIM Card Deletion',
      `Are you sure you want to delete ${label}? This operation cannot be undone.${devNote}`,
      () => {
        // 1. Delete SIM
        setSims((prev) => prev.filter((s) => (s as any).id !== targetIdOrSl && (s as any).sl !== targetIdOrSl));
        deleteSupabaseSIM(String(targetIdOrSl));

        // 2. Cascade delete associated device(s)
        if (matchingDevices.length > 0) {
          const devSlsToDelete = matchingDevices.map((d) => d.sl);
          setDevices((prev) => prev.filter((d) => !devSlsToDelete.includes(d.sl)));
          bulkDeleteSupabaseDevices(devSlsToDelete);
          showToast(`SIM Card & associated Device (${matchingDevices.map((d) => d.id).join(', ')}) deleted successfully!`);
        } else {
          showToast('SIM Card deleted successfully!');
        }
      }
    );
  };

  const handleBulkDeleteSIMs = (simIds: string[]) => {
    if (simIds.length === 0) return;

    const targetSims = sims.filter((s) => simIds.includes((s as any).id) || simIds.includes(String((s as any).sl)));

    // Find all linked devices in Device MIS Tree
    const matchingDevices = devices.filter((d) => {
      return targetSims.some((s) => {
        const matchSimNum =
          isValidKey(s.simNumber) &&
          isValidKey(d.sim) &&
          d.sim.trim().toLowerCase() === s.simNumber.trim().toLowerCase();
        const matchDeviceId =
          isValidKey(s.assignedDevice) &&
          isValidKey(d.id) &&
          d.id.trim().toLowerCase() === s.assignedDevice.trim().toLowerCase();
        return matchSimNum || matchDeviceId;
      });
    });

    const devNote =
      matchingDevices.length > 0
        ? `\n\nNote: ${matchingDevices.length} associated device(s) in Device MIS Tree will also be deleted automatically.`
        : '';

    askConfirmation(
      'Confirm Multiple SIM Cards Deletion',
      `Are you sure you want to delete ${simIds.length} selected SIM card(s)? This operation cannot be undone.${devNote}`,
      () => {
        // 1. Delete SIMs
        setSims((prev) => prev.filter((s) => !simIds.includes((s as any).id) && !simIds.includes(String((s as any).sl))));
        bulkDeleteSupabaseSIMs(simIds);

        // 2. Cascade delete associated devices
        if (matchingDevices.length > 0) {
          const devSlsToDelete = matchingDevices.map((d) => d.sl);
          setDevices((prev) => prev.filter((d) => !devSlsToDelete.includes(d.sl)));
          bulkDeleteSupabaseDevices(devSlsToDelete);
          showToast(`${simIds.length} SIM card(s) & ${matchingDevices.length} linked device(s) deleted successfully!`);
        } else {
          showToast(`${simIds.length} SIM card(s) deleted successfully!`);
        }
      }
    );
  };

  const handleSaveIssue = async (issue: IssueTrackerItem) => {
    setIssues((prev) => {
      const exists = prev.some((i) => i.id === issue.id);
      const updated = exists ? prev.map((i) => (i.id === issue.id ? issue : i)) : [issue, ...prev];
      try {
        localStorage.setItem('issueTrackerData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    insertSupabaseIssue(issue);
  };

  const handleDeleteIssue = (id: string) => {
    setIssues((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem('issueTrackerData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    deleteSupabaseIssue(id);
  };

  const handleBulkDeleteIssues = (ids: string[]) => {
    setIssues((prev) => {
      const updated = prev.filter((i) => !ids.includes(i.id));
      try {
        localStorage.setItem('issueTrackerData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    bulkDeleteSupabaseIssues(ids);
  };

  // Backup Restore Handler
  const handleRestoreData = (restored: {
    devices?: Device[];
    tickets?: Ticket[];
    pos?: PurchaseOrder[];
    sims?: SIMItem[];
    issues?: IssueTrackerItem[];
    categoryGroups?: CategoryGroup[];
    systemOptions?: SystemOptions;
    appSettings?: AppSettings;
  }) => {
    askConfirmation(
      'Confirm Restore Backup',
      'Are you sure you want to restore data from backup? This will overwrite existing records with the restored data.',
      () => {
        if (restored.devices && Array.isArray(restored.devices)) {
          setDevices(restored.devices);
          try {
            localStorage.setItem('devicesData', JSON.stringify(restored.devices));
          } catch (e) {
            console.warn(e);
          }
          bulkInsertSupabaseDevices(restored.devices);
        }
        if (restored.tickets && Array.isArray(restored.tickets)) {
          setTickets(restored.tickets);
          try {
            localStorage.setItem('serviceTicketsData', JSON.stringify(restored.tickets));
          } catch (e) {
            console.warn(e);
          }
          restored.tickets.forEach((t) => insertSupabaseTicket(t));
        }
        if (restored.pos && Array.isArray(restored.pos)) {
          setPos(restored.pos);
          try {
            localStorage.setItem('purchaseOrdersData', JSON.stringify(restored.pos));
          } catch (e) {
            console.warn(e);
          }
          restored.pos.forEach((p) => insertSupabasePO(p));
        }
        if (restored.sims && Array.isArray(restored.sims)) {
          setSims(restored.sims);
          try {
            localStorage.setItem('simsData', JSON.stringify(restored.sims));
          } catch (e) {
            console.warn(e);
          }
          restored.sims.forEach((s) => insertSupabaseSIM(s));
        }
        if (restored.issues && Array.isArray(restored.issues)) {
          setIssues(restored.issues);
          bulkInsertSupabaseIssues(restored.issues);
          try {
            localStorage.setItem('issueTrackerData', JSON.stringify(restored.issues));
          } catch (e) {
            console.warn('localStorage save error', e);
          }
        }
        if (restored.categoryGroups && Array.isArray(restored.categoryGroups)) {
          setCategoryGroups(restored.categoryGroups);
          try {
            localStorage.setItem('categoryGroups', JSON.stringify(restored.categoryGroups));
          } catch (e) {
            console.warn(e);
          }
          saveSupabaseCategoryGroups(restored.categoryGroups);
        }
        if (restored.systemOptions) {
          setSystemOptions(restored.systemOptions);
          saveSupabaseSystemOptions(restored.systemOptions);
          try {
            localStorage.setItem('systemOptions', JSON.stringify(restored.systemOptions));
          } catch (e) {
            console.warn('localStorage save error', e);
          }
        }
        if (restored.appSettings) {
          setAppSettings(restored.appSettings);
          saveSupabaseAppSettings(restored.appSettings);
          try {
            localStorage.setItem('appSettings', JSON.stringify(restored.appSettings));
          } catch (e) {
            console.warn(e);
          }
        }

        // Record telemetry log
        recordSystemAccessLog('Admin (admin@local.com)', 'Database Restored from File').catch((e) => console.warn(e));

        showToast('Backup data restored successfully!');
      }
    );
  };

  const handleNavigateFromSearch = (
    type: 'device' | 'sim' | 'ticket' | 'po' | 'category',
    item: any
  ) => {
    if (type === 'device') {
      if (item.category) {
        setActiveCategory(item.category);
      }
      setActiveTab('devices');
      setSearchQuery(item.deviceId || item.sol || '');
    } else if (type === 'category') {
      const catName = typeof item === 'string' ? item : item.name;
      setActiveCategory(catName);
      setActiveTab('devices');
      setSearchQuery('');
    } else if (type === 'sim') {
      setActiveTab('sim');
      setSearchQuery(item.simNumber || '');
    } else if (type === 'ticket') {
      setActiveTab('service');
      setSearchQuery(item.ticketNo || '');
    } else if (type === 'po') {
      setActiveTab('po');
      setSearchQuery(item.poNumber || '');
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginModal
        onLoginSuccess={() => setIsLoggedIn(true)}
        appName={appSettings.appName}
        appLogo={appSettings.appLogo}
        tagline={appSettings.tagline}
      />
    );
  }

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col overflow-hidden transition-colors duration-200">
      {/* Top Header Navigation */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        appName={appSettings.appName}
        appLogo={appSettings.appLogo}
        devices={devices}
        tickets={tickets}
        pos={pos}
        sims={sims}
        categoryGroups={categoryGroups}
        onNavigateToResult={handleNavigateFromSearch}
        onLogout={() => setIsLoggedIn(false)}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Sidebar Navigation & MIS Tree */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categoryGroups={categoryGroups}
          onOpenAddCategoryModal={() => setIsAddCategoryOpen(true)}
          onOpenExcelUploadModal={() => setIsExcelUploadOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Tab Content Area */}
        <main
          className={`flex-1 min-w-0 ${
            activeTab === 'odoo' ? 'p-0 overflow-hidden' : 'p-4 md:p-6 overflow-y-auto'
          } bg-slate-100 dark:bg-slate-900 h-full transition-colors duration-200`}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              tickets={tickets}
              devices={devices}
              pos={pos}
              sims={sims}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'issue_tracker' && (
            <IssueTrackerTab
              issues={issues}
              onSaveIssue={handleSaveIssue}
              onDeleteIssue={handleDeleteIssue}
              categoryGroups={categoryGroups}
              systemOptions={systemOptions}
              devices={devices}
              onNavigateToReport={() => setActiveTab('issue_report')}
            />
          )}

          {activeTab === 'issue_report' && (
            <IssueReportTab
              issues={issues}
              onSaveIssue={handleSaveIssue}
              onDeleteIssue={handleDeleteIssue}
              onBulkDeleteIssues={handleBulkDeleteIssues}
              categoryGroups={categoryGroups}
              systemOptions={systemOptions}
              onNavigateToTracker={() => setActiveTab('issue_tracker')}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesTab
              activeCategory={activeCategory}
              devices={devices}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddDeviceModal={() => setIsAddDeviceOpen(true)}
              onOpenEditDeviceModal={(d) => setEditingDevice(d)}
              onDeleteDevice={handleDeleteDevice}
              onBulkDeleteDevices={handleBulkDeleteDevices}
              onOpenExcelUploadModal={() => setIsExcelUploadOpen(true)}
            />
          )}

          {activeTab === 'po' && (
            <POTab
              pos={pos}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddPOModal={() => setIsAddPOOpen(true)}
              onOpenEditPOModal={(po) => setEditingPO(po)}
              onDeletePO={handleDeletePO}
              onBulkDeletePOs={handleBulkDeletePOs}
            />
          )}

          {activeTab === 'service' && (
            <ServiceTab
              tickets={tickets}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNewTicketModal={() => setIsNewTicketOpen(true)}
              onOpenEditTicketModal={(t) => setEditingTicket(t)}
              onDeleteTicket={handleDeleteTicket}
              onBulkDeleteTickets={handleBulkDeleteTickets}
              onOpenExcelUploadModal={() => setIsTicketExcelUploadOpen(true)}
            />
          )}

          {activeTab === 'sim' && (
            <SIMTab
              sims={sims}
              devices={devices}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddSIMModal={() => setIsAddSIMOpen(true)}
              onOpenEditSIMModal={(sim) => setEditingSIM(sim)}
              onDeleteSIM={handleDeleteSIM}
              onBulkDeleteSIMs={handleBulkDeleteSIMs}
              onSyncAllSimsFromDevices={handleSyncAllSimsFromDevices}
            />
          )}

          {activeTab === 'branch_report' && (
            <BranchReportTab
              devices={devices}
              categoryGroups={categoryGroups}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddDeviceModal={() => setIsAddDeviceOpen(true)}
              onOpenEditDeviceModal={(d) => setEditingDevice(d)}
              onDeleteDevice={handleDeleteDevice}
            />
          )}

          {activeTab === 'backup' && (
            <BackupTab
              data={{
                devices,
                tickets,
                pos,
                sims,
                issues,
                categoryGroups,
                systemOptions,
                appSettings,
              }}
              onRestoreData={handleRestoreData}
              showToast={showToast}
            />
          )}

          {activeTab === 'odoo' && <OdooTab />}

          {activeTab === 'ticket_generator' && (
            <SupportTicketGeneratorTab
              devices={devices}
              tickets={tickets}
              issues={issues}
              appLogo={appSettings.appLogo}
              appName={appSettings.appName}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              categoryGroups={categoryGroups}
              setCategoryGroups={setCategoryGroups}
              systemOptions={systemOptions}
              setSystemOptions={setSystemOptions}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
            />
          )}
        </main>
      </div>

      {/* All Modal Views */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAddCategory={handleAddCategory}
      />

      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        activeCategory={activeCategory}
        categoryGroups={categoryGroups}
        systemOptions={systemOptions}
        onClose={() => setIsAddDeviceOpen(false)}
        onSaveDevice={handleSaveNewDevice}
      />

      <EditDeviceModal
        isOpen={Boolean(editingDevice)}
        device={editingDevice}
        categoryGroups={categoryGroups}
        systemOptions={systemOptions}
        onClose={() => setEditingDevice(null)}
        onSaveDevice={handleSaveEditedDevice}
      />

      <NewTicketModal
        isOpen={isNewTicketOpen}
        systemOptions={systemOptions}
        onClose={() => setIsNewTicketOpen(false)}
        onSaveTicket={handleSaveNewTicket}
        ticketCount={tickets.length}
      />

      <EditTicketModal
        isOpen={Boolean(editingTicket)}
        ticket={editingTicket}
        systemOptions={systemOptions}
        onClose={() => setEditingTicket(null)}
        onSaveTicket={handleSaveEditedTicket}
      />

      <AddPOModal
        isOpen={isAddPOOpen}
        categoryGroups={categoryGroups}
        systemOptions={systemOptions}
        onClose={() => setIsAddPOOpen(false)}
        onSavePO={handleSaveNewPO}
        poCount={pos.length}
      />

      <EditPOModal
        isOpen={Boolean(editingPO)}
        po={editingPO}
        categoryGroups={categoryGroups}
        systemOptions={systemOptions}
        onClose={() => setEditingPO(null)}
        onSavePO={handleSaveEditedPO}
      />

      <AddSIMModal
        isOpen={isAddSIMOpen}
        systemOptions={systemOptions}
        onClose={() => setIsAddSIMOpen(false)}
        onSaveSIM={handleSaveNewSIM}
      />

      <EditSIMModal
        isOpen={Boolean(editingSIM)}
        simItem={editingSIM}
        systemOptions={systemOptions}
        onClose={() => setEditingSIM(null)}
        onSaveSIM={handleSaveEditedSIM}
      />

      <ExcelUploadModal
        isOpen={isExcelUploadOpen}
        activeCategory={activeCategory}
        onClose={() => setIsExcelUploadOpen(false)}
        onImportDevices={handleImportDevices}
      />

      <TicketExcelUploadModal
        isOpen={isTicketExcelUploadOpen}
        onClose={() => setIsTicketExcelUploadOpen(false)}
        onImportTickets={handleImportTickets}
        systemOptions={systemOptions}
        ticketCount={tickets.length}
      />

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={handleCloseToast} />

      {/* Global Confirmation Modal for Deletions */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
