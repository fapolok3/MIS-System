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
  DeviceSupportTicket,
  LiveActiveUser,
  BillItem,
  ServiceTicketItem,
} from './types';
import {
  initialDevices,
  initialTickets,
  initialPOs,
  initialSIMs,
  initialIssues,
  initialDeviceSupportTickets,
  initialCategoryGroups,
  initialSystemOptions,
  initialBills,
  initialServiceTickets,
  initialClients,
  initialBillLocations,
  initialBillCategories,
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
  bulkInsertSupabasePOs,
  deleteSupabasePO,
  bulkDeleteSupabasePOs,
  fetchSupabaseSIMs,
  insertSupabaseSIM,
  bulkInsertSupabaseSIMs,
  syncReplaceSupabaseSIMs,
  deleteSupabaseSIM,
  bulkDeleteSupabaseSIMs,
  fetchSupabaseCategoryGroups,
  saveSupabaseCategoryGroups,
  fetchSupabaseSystemOptions,
  saveSupabaseSystemOptions,
  fetchSupabaseAppSettings,
  saveSupabaseAppSettings,
  saveSupabaseHiddenModules,
  fetchSupabaseHiddenModules,
  fetchSupabaseIssues,
  insertSupabaseIssue,
  deleteSupabaseIssue,
  bulkInsertSupabaseIssues,
  bulkDeleteSupabaseIssues,
  fetchSupabaseDeviceSupportTickets,
  insertSupabaseDeviceSupportTicket,
  deleteSupabaseDeviceSupportTicket,
  bulkDeleteSupabaseDeviceSupportTickets,
  bulkInsertSupabaseDeviceSupportTickets,
  subscribeToSupabaseLiveSync,
  defaultAppSettings,
  fetchSupabaseBills,
  insertSupabaseBill,
  deleteSupabaseBill,
  bulkDeleteSupabaseBills,
  fetchSupabaseServiceTickets,
  insertSupabaseServiceTicket,
  deleteSupabaseServiceTicket,
  bulkDeleteSupabaseServiceTickets,
} from './lib/supabase';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { DeviceIssueTrackerTab } from './components/DeviceIssueTrackerTab';
import { DeviceIssueReportTab } from './components/DeviceIssueReportTab';
import { ServiceTicketTrackerTab } from './components/ServiceTicketTrackerTab';
import { ServiceTicketReportTab } from './components/ServiceTicketReportTab';
import { BillTrackerTab } from './components/BillTrackerTab';
import { BillReportTab } from './components/BillReportTab';
import { IssueTrackerTab } from './components/IssueTrackerTab';
import { IssueReportTab } from './components/IssueReportTab';
import { DevicesTab } from './components/DevicesTab';
import { POTab } from './components/POTab';
import { ServiceTab } from './components/ServiceTab';
import { SIMTab } from './components/SIMTab';
import { BranchReportTab } from './components/BranchReportTab';
import { BackupTab } from './components/BackupTab';
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
import { POExcelUploadModal } from './components/Modals/POExcelUploadModal';
import { ConfirmModal } from './components/Modals/ConfirmModal';
import { Toast, ToastData } from './components/Toast';

const pathToTab = (path: string): TabType => {
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath === '/device-issue-tracker' || cleanPath === '/device-issues') return 'device_issue_tracker';
  if (cleanPath === '/device-issue-report' || cleanPath === '/device-reports') return 'device_issue_report';
  if (cleanPath === '/service-ticket-tracker' || cleanPath === '/service-tracker') return 'service_ticket_tracker';
  if (cleanPath === '/service-ticket-report' || cleanPath === '/service-report') return 'service_ticket_report';
  if (cleanPath === '/bill-tracker' || cleanPath === '/bill-entry' || cleanPath === '/bills') return 'bill_tracker';
  if (cleanPath === '/bill-report' || cleanPath === '/bill-reports' || cleanPath === '/bill-analytics') return 'bill_report';
  if (cleanPath === '/issue-tracker' || cleanPath === '/tracker' || cleanPath === '/issues') return 'issue_tracker';
  if (cleanPath === '/issue-report' || cleanPath === '/issue-analytics' || cleanPath === '/reports') return 'issue_report';
  if (cleanPath === '/devices') return 'devices';
  if (cleanPath === '/po' || cleanPath === '/purchase-orders') return 'po';
  if (cleanPath === '/service' || cleanPath === '/service-tickets') return 'service';
  if (cleanPath === '/sim' || cleanPath === '/sim-management') return 'sim';
  if (cleanPath === '/branch-report' || cleanPath === '/all-branch-report') return 'branch_report';
  if (cleanPath === '/ticket-generator' || cleanPath === '/support-ticket' || cleanPath === '/ticket') return 'ticket_generator';
  if (cleanPath === '/settings') return 'settings';
  if (cleanPath === '/backup') return 'backup';
  return 'dashboard';
};

const tabToPath = (tab: TabType): string => {
  switch (tab) {
    case 'device_issue_tracker': return '/device-issue-tracker';
    case 'device_issue_report': return '/device-issue-report';
    case 'service_ticket_tracker': return '/service-ticket-tracker';
    case 'service_ticket_report': return '/service-ticket-report';
    case 'bill_tracker': return '/bill-tracker';
    case 'bill_report': return '/bill-report';
    case 'issue_tracker': return '/issue-tracker';
    case 'issue_report': return '/issue-report';
    case 'devices': return '/devices';
    case 'po': return '/po';
    case 'service': return '/service';
    case 'sim': return '/sim';
    case 'branch_report': return '/branch-report';
    case 'ticket_generator': return '/ticket-generator';
    case 'settings': return '/settings';
    case 'backup': return '/backup';
    case 'dashboard':
    default:
      return '/dashboard';
  }
};

export const isValidKey = (val?: string): boolean => {
  if (!val) return false;
  const trimmed = val.trim().toLowerCase();
  return (
    trimmed !== '' &&
    trimmed !== '-' &&
    trimmed !== 'n/a' &&
    trimmed !== 'none' &&
    trimmed !== 'null' &&
    trimmed !== 'undefined' &&
    trimmed !== 'unassigned'
  );
};

export const getDeterministicSimId = (device: Device): string => {
  const rawId = device.id ? String(device.id).trim() : '';
  const safeKey = rawId ? rawId.replace(/[^a-zA-Z0-9_-]/g, '_') : String(device.sl);
  return `sim-dev-${safeKey}`;
};

export const createSimItemFromDevice = (device: Device, customId?: string): SIMItem => {
  const rawSim = device.sim ? String(device.sim).trim() : '';
  const cleanSimNum = isValidKey(rawSim) ? rawSim : '';
  const simStatus: 'ACTIVE' | 'INACTIVE' = device.status === 'LIVE' ? 'ACTIVE' : 'INACTIVE';

  return {
    id: customId || getDeterministicSimId(device),
    simNumber: cleanSimNum,
    operator: device.operator || 'GP',
    assignedDevice: device.id || '-',
    location: device.location || '-',
    status: simStatus,
  };
};

/**
 * Strict Invariant Enforcer:
 * Total SIMs can NEVER exceed total devices.
 * Reconciles current devices 1-to-1 with the SIM inventory, preserving updated data
 * while permanently eliminating orphaned SIMs (devices no longer present) and duplicates.
 */
export const reconcileSimsWithDevices = (sourceSims: SIMItem[], currentDevices: Device[]): SIMItem[] => {
  if (!currentDevices || currentDevices.length === 0) {
    return [];
  }

  // Pre-index existing SIMs by assignedDevice (case-insensitive), deterministic ID, and valid SIM number
  const simByDevice = new Map<string, SIMItem>();
  const simById = new Map<string, SIMItem>();
  const simByNumber = new Map<string, SIMItem>();

  for (const s of sourceSims) {
    if (s.assignedDevice && isValidKey(s.assignedDevice)) {
      const devKey = s.assignedDevice.trim().toLowerCase();
      if (!simByDevice.has(devKey)) {
        simByDevice.set(devKey, s);
      }
    }
    if (s.id) {
      simById.set(s.id, s);
    }
    if (isValidKey(s.simNumber)) {
      const numKey = s.simNumber.trim().toLowerCase();
      if (!simByNumber.has(numKey)) {
        simByNumber.set(numKey, s);
      }
    }
  }

  const reconciled: SIMItem[] = [];
  const assignedSimIds = new Set<string>();

  for (const dev of currentDevices) {
    const deterministicId = getDeterministicSimId(dev);
    const devIdLower = dev.id ? dev.id.trim().toLowerCase() : '';
    const cleanDevSim = isValidKey(dev.sim) ? dev.sim.trim() : '';
    const simStatus: 'ACTIVE' | 'INACTIVE' = dev.status === 'LIVE' ? 'ACTIVE' : 'INACTIVE';

    // Find best matching SIM
    let matchedSim: SIMItem | undefined;
    if (devIdLower && simByDevice.has(devIdLower)) {
      matchedSim = simByDevice.get(devIdLower);
    } else if (simById.has(deterministicId)) {
      matchedSim = simById.get(deterministicId);
    } else if (cleanDevSim && simByNumber.has(cleanDevSim.toLowerCase())) {
      const candidate = simByNumber.get(cleanDevSim.toLowerCase());
      if (candidate && !assignedSimIds.has(candidate.id)) {
        matchedSim = candidate;
      }
    }

    const effectiveSimNumber = cleanDevSim || (matchedSim && isValidKey(matchedSim.simNumber) ? matchedSim.simNumber.trim() : '');
    const effectiveOperator = dev.operator || matchedSim?.operator || 'GP';
    const effectiveLocation = dev.location || matchedSim?.location || '-';

    const simItem: SIMItem = {
      id: deterministicId,
      simNumber: effectiveSimNumber,
      operator: effectiveOperator,
      assignedDevice: dev.id || '-',
      location: effectiveLocation,
      status: simStatus,
    };

    reconciled.push(simItem);
    assignedSimIds.add(simItem.id);
  }

  return reconciled;
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
        const savedDevsStr = localStorage.getItem('devicesData');
        const savedDevs = savedDevsStr ? JSON.parse(savedDevsStr) : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (Array.isArray(savedDevs) && savedDevs.length > 0) {
              return reconcileSimsWithDevices(parsed, savedDevs);
            }
            return parsed;
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialSIMs;
  });

  // Strict Invariant Guard: Total SIM count can NEVER exceed total registered devices.
  useEffect(() => {
    if (devices.length > 0 && sims.length > devices.length) {
      const clean = reconcileSimsWithDevices(sims, devices);
      setSims(clean);
      try {
        localStorage.setItem('simsData', JSON.stringify(clean));
      } catch (e) {}
    }
  }, [devices.length, sims.length]);
  const [issues, setIssues] = useState<IssueTrackerItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('issueTrackerData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const demoIds = new Set(['ISSUE-1001', 'ISSUE-1002', 'ISSUE-1003', 'ISSUE-1004']);
            const seen = new Set<string>();
            return parsed.filter(
              (item: IssueTrackerItem) => {
                if (
                  !item ||
                  !item.id ||
                  demoIds.has(item.id) ||
                  item.id.startsWith('issue-seed-') ||
                  item.id.startsWith('demo-')
                ) {
                  return false;
                }
                const key = String(item.id).trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              }
            );
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialIssues;
  });

  const [deviceSupportTickets, setDeviceSupportTickets] = useState<DeviceSupportTicket[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('deviceSupportTicketsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const seen = new Set<string>();
            return parsed.filter((t: DeviceSupportTicket) => {
              if (!t || !t.id) return false;
              const key = String(t.id).trim();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialDeviceSupportTickets;
  });

  // Bills State (Bill Tracker & Bill Report)
  const [bills, setBills] = useState<BillItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('billsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(
              (b: BillItem) =>
                b &&
                b.id &&
                !b.id.startsWith('BILL-20261013-10000') &&
                !b.id.startsWith('demo-')
            );
            return filtered;
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialBills;
  });

  const [billClients, setBillClients] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('billClientsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return initialClients;
  });

  const [billLocations, setBillLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('billLocationsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return initialBillLocations;
  });

  const [billCategories, setBillCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('billCategoriesData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return initialBillCategories;
  });

  const [editingBillForTracker, setEditingBillForTracker] = useState<BillItem | null>(null);

  // Service Tickets State (Service Ticket Tracker & Service Ticket Report)
  const [serviceTickets, setServiceTickets] = useState<ServiceTicketItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('serviceTicketItemsData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }
    return initialServiceTickets;
  });

  const [editingServiceTicketForTracker, setEditingServiceTicketForTracker] = useState<ServiceTicketItem | null>(null);

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

  // Module Controller: Hidden sidebar modules state
  const [hiddenModules, setHiddenModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bbl_hidden_modules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('localStorage parse bbl_hidden_modules error', e);
    }
    return [];
  });

  const handleSaveHiddenModules = async (modulesToHide: string[]) => {
    // 1. Immediately apply to local state & local storage (zero lag for current user)
    setHiddenModules(modulesToHide);
    try {
      localStorage.setItem('bbl_hidden_modules', JSON.stringify(modulesToHide));
    } catch (e) {}

    // 2. Persist to Supabase so other users/devices will automatically receive it on refresh or login
    try {
      await saveSupabaseHiddenModules(modulesToHide);
      // Also update in AppSettings row if possible
      saveSupabaseAppSettings({
        ...appSettings,
        hiddenModules: modulesToHide,
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to save hidden modules to Supabase:', e);
    }

    showToast('Module visibility settings saved successfully! Changes are synced across all devices.');
  };

  const handleToggleModule = (moduleId: string) => {
    setHiddenModules((prev) => {
      const next = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];
      try {
        localStorage.setItem('bbl_hidden_modules', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetModules = async () => {
    setHiddenModules([]);
    try {
      localStorage.removeItem('bbl_hidden_modules');
    } catch (e) {}
    try {
      await saveSupabaseHiddenModules([]);
      saveSupabaseAppSettings({
        ...appSettings,
        hiddenModules: [],
      }).catch(() => {});
    } catch (e) {}
    showToast('All modules are now visible in the sidebar.');
  };

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
  const [isPOExcelUploadOpen, setIsPOExcelUploadOpen] = useState(false);

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

  // If currently active tab is hidden via Module Controller, fallback to dashboard
  useEffect(() => {
    if (hiddenModules.includes(activeTab) && activeTab !== 'settings') {
      setActiveTab('dashboard');
    }
  }, [hiddenModules, activeTab]);

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
        dbDeviceSupportTickets,
        dbBills,
        dbServiceTickets,
      ] = await Promise.all([
        fetchSupabaseDevices(),
        fetchSupabaseTickets(),
        fetchSupabasePOs(),
        fetchSupabaseSIMs(),
        fetchSupabaseIssues(),
        fetchSupabaseCategoryGroups(),
        fetchSupabaseSystemOptions(),
        fetchSupabaseAppSettings(),
        fetchSupabaseDeviceSupportTickets(),
        fetchSupabaseBills(),
        fetchSupabaseServiceTickets(),
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

      // 4. SIMs (Supabase is authoritative, strictly clamp and reconcile 1-to-1 with registered devices)
      if (dbSIMs !== null) {
        const targetDevices = (dbDevices !== null && dbDevices.length > 0) ? dbDevices : devices;
        if (targetDevices && targetDevices.length > 0) {
          // Strict Invariant: Total SIMs can NEVER exceed total devices.
          // Filter out orphaned/duplicate SIMs and auto-reconcile 1-to-1 with registered devices.
          const cleanSims = reconcileSimsWithDevices(dbSIMs, targetDevices);
          setSims(cleanSims);
          try {
            localStorage.setItem('simsData', JSON.stringify(cleanSims));
          } catch (e) {
            console.warn('localStorage save sims error', e);
          }
        } else {
          setSims(dbSIMs);
          try {
            localStorage.setItem('simsData', JSON.stringify(dbSIMs));
          } catch (e) {
            console.warn('localStorage save sims error', e);
          }
        }
      }

      // 5. Issues (Issue Tracker)
      if (dbIssues !== null) {
        const seen = new Set<string>();
        const cleanDbIssues = dbIssues.filter(
          (item: IssueTrackerItem) => {
            if (
              !item ||
              !item.id ||
              item.id.startsWith('issue-seed-') ||
              item.id.startsWith('demo-') ||
              ['ISSUE-1001', 'ISSUE-1002', 'ISSUE-1003', 'ISSUE-1004'].includes(item.id)
            ) {
              return false;
            }
            const key = String(item.id).trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }
        );
        setIssues(cleanDbIssues);
        try {
          localStorage.setItem('issueTrackerData', JSON.stringify(cleanDbIssues));
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

      // 8. App Settings & Global Module Visibility
      if (dbAppSettings !== null) {
        setAppSettings(dbAppSettings);
        try {
          localStorage.setItem('appSettings', JSON.stringify(dbAppSettings));
        } catch (e) {
          console.warn('localStorage save appSettings error', e);
        }

        if (Array.isArray(dbAppSettings.hiddenModules)) {
          setHiddenModules(dbAppSettings.hiddenModules);
          try {
            localStorage.setItem('bbl_hidden_modules', JSON.stringify(dbAppSettings.hiddenModules));
          } catch (e) {}
        }
      }

      // Also check explicit fetchSupabaseHiddenModules fallback
      try {
        const cloudHidden = await fetchSupabaseHiddenModules();
        if (cloudHidden !== null && Array.isArray(cloudHidden)) {
          setHiddenModules(cloudHidden);
          try {
            localStorage.setItem('bbl_hidden_modules', JSON.stringify(cloudHidden));
          } catch (e) {}
        }
      } catch (e) {}

      // 9. Device Support Tickets (Device Issue Tracker & Report)
      if (dbDeviceSupportTickets !== null) {
        const seen = new Set<string>();
        const cleanDbTickets = dbDeviceSupportTickets.filter((t: DeviceSupportTicket) => {
          if (!t || !t.id) return false;
          const key = String(t.id).trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setDeviceSupportTickets(cleanDbTickets);
        try {
          localStorage.setItem('deviceSupportTicketsData', JSON.stringify(cleanDbTickets));
        } catch (e) {
          console.warn('localStorage save device support tickets error', e);
        }
      }

      // 10. Bills (Bill Tracker & Bill Report)
      if (dbBills !== null) {
        const cleanDbBills = dbBills.filter(
          (b: BillItem) =>
            b &&
            b.id &&
            !b.id.startsWith('BILL-20261013-10000') &&
            !b.id.startsWith('demo-')
        );
        setBills(cleanDbBills);
        try {
          localStorage.setItem('billsData', JSON.stringify(cleanDbBills));
        } catch (e) {
          console.warn('localStorage save bills error', e);
        }
      }

      // 11. Service Tickets (Service Ticket Tracker & Service Ticket Report)
      if (dbServiceTickets !== null) {
        setServiceTickets(dbServiceTickets);
        try {
          localStorage.setItem('serviceTicketItemsData', JSON.stringify(dbServiceTickets));
        } catch (e) {
          console.warn('localStorage save service tickets error', e);
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

  // Sync & Reconcile All SIMs from Device Inventory (Strict 1-to-1 match; purges duplicates and extra SIMs)
  const handleSyncAllSimsFromDevices = async () => {
    if (devices.length === 0) {
      showToast('No devices available to sync.', 'info');
      return;
    }

    // Reconcile strictly 1-to-1 with current registered devices
    const syncedSims = reconcileSimsWithDevices(sims, devices);

    setSims(syncedSims);
    try {
      localStorage.setItem('simsData', JSON.stringify(syncedSims));
    } catch (e) {}

    // Fully replace and purge any stale or orphaned SIMs from Supabase
    const success = await syncReplaceSupabaseSIMs(syncedSims);

    if (success) {
      showToast(
        `Sync complete: ${syncedSims.length} SIM records synchronized and Supabase cleaned successfully!`,
        'success'
      );
    } else {
      showToast(
        `Sync complete: ${syncedSims.length} SIM records synchronized locally.`,
        'info'
      );
    }
  };

  const handleSaveNewDevice = (deviceData: Omit<Device, 'sl'>) => {
    const newDevice: Device = {
      ...deviceData,
      sl: Date.now(),
    };
    setDevices((prev) => [...prev, newDevice]);
    insertSupabaseDevice(newDevice);

    // Auto-create deterministic SIM in SIM Management
    const newSim = createSimItemFromDevice(newDevice);
    setSims((prevSims) => {
      const updatedSims = [newSim, ...prevSims.filter((s) => s.id !== newSim.id)];
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

    const deterministicId = getDeterministicSimId(updatedDevice);
    const cleanSimNum = isValidKey(updatedDevice.sim) ? String(updatedDevice.sim).trim() : '';
    const simStatus: 'ACTIVE' | 'INACTIVE' =
      updatedDevice.status === 'LIVE' ? 'ACTIVE' : 'INACTIVE';

    setSims((prevSims) => {
      const existingIndex = prevSims.findIndex(
        (s) =>
          s.id === deterministicId ||
          (s.assignedDevice &&
            updatedDevice.id &&
            s.assignedDevice.trim().toLowerCase() === updatedDevice.id.trim().toLowerCase())
      );

      let updatedSims: SIMItem[];
      if (existingIndex >= 0) {
        const existingSim = prevSims[existingIndex];
        const updatedSim: SIMItem = {
          ...existingSim,
          id: deterministicId,
          simNumber: cleanSimNum || (isValidKey(existingSim.simNumber) ? existingSim.simNumber : ''),
          operator: updatedDevice.operator || existingSim.operator,
          assignedDevice: updatedDevice.id || existingSim.assignedDevice,
          location: updatedDevice.location || existingSim.location,
          status: simStatus,
        };
        updatedSims = [...prevSims];
        updatedSims[existingIndex] = updatedSim;
        insertSupabaseSIM(updatedSim);
      } else {
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

    // Auto-create SIM cards in SIM Management with deterministic IDs
    const newSimItems: SIMItem[] = formattedDevices.map((dev) =>
      createSimItemFromDevice(dev)
    );

    setSims((prev) => {
      const allDevices = [...formattedDevices, ...devices];
      const newSimIds = new Set(newSimItems.map((s) => s.id));
      const combined = [...newSimItems, ...prev.filter((s) => !newSimIds.has(s.id))];
      const updatedSims = reconcileSimsWithDevices(combined, allDevices);
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
  const handleImportTickets = async (newTickets: Ticket[]) => {
    setTickets((prev) => [...newTickets, ...prev]);
    try {
      localStorage.setItem('serviceTicketsData', JSON.stringify([...newTickets, ...tickets]));
    } catch (e) {}
    const result = await bulkInsertSupabaseTickets(newTickets);
    if (result.success) {
      showToast(`${newTickets.length} Service Ticket(s) imported & saved to Supabase!`);
    } else {
      showToast(`${newTickets.length} ticket(s) saved locally! (Supabase: ${result.error || 'Check tickets table'})`, 'error');
    }
  };

  const handleSaveNewTicket = async (newTicket: Ticket) => {
    setTickets((prev) => {
      const updated = [newTicket, ...prev.filter((t) => t.id !== newTicket.id)];
      try {
        localStorage.setItem('serviceTicketsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    const result = await insertSupabaseTicket(newTicket);
    if (result.success) {
      showToast(`Service Ticket "${newTicket.id}" created & saved to Supabase!`);
    } else {
      showToast(`Service Ticket saved locally! (Supabase Error: ${result.error || 'Check table schema'})`, 'error');
    }
  };

  const handleSaveEditedTicket = async (updatedTicket: Ticket, originalId?: string) => {
    setTickets((prev) => {
      const targetId = originalId || updatedTicket.id;
      const updated = prev.map((t) => (t.id === targetId ? updatedTicket : t));
      try {
        localStorage.setItem('serviceTicketsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (originalId && originalId !== updatedTicket.id) {
      await deleteSupabaseTicket(originalId);
    }
    const result = await insertSupabaseTicket(updatedTicket);
    if (result.success) {
      showToast(`Service Ticket "${updatedTicket.id}" updated in Supabase successfully!`);
    } else {
      showToast(`Service Ticket updated locally! (Supabase Error: ${result.error || 'Check table schema'})`, 'error');
    }
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
  const handleImportPOs = async (newPOs: PurchaseOrder[]) => {
    setPos((prev) => {
      const updated = [...newPOs, ...prev];
      try {
        localStorage.setItem('purchaseOrdersData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    const success = await bulkInsertSupabasePOs(newPOs);
    if (success) {
      showToast(`${newPOs.length} Purchase Order(s) imported & saved to Supabase!`);
    } else {
      showToast(`${newPOs.length} Purchase Order(s) imported locally!`);
    }
  };

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
    const assignedDevId = newSIM.assignedDevice && newSIM.assignedDevice !== '-' ? newSIM.assignedDevice.trim().toLowerCase() : '';
    const matchedDevice = assignedDevId ? devices.find((d) => d.id && d.id.trim().toLowerCase() === assignedDevId) : undefined;

    let targetSimId = newSIM.id;
    if (matchedDevice) {
      targetSimId = getDeterministicSimId(matchedDevice);
    }

    const simWithDeterministicId: SIMItem = {
      ...newSIM,
      id: targetSimId,
      assignedDevice: matchedDevice ? matchedDevice.id : newSIM.assignedDevice,
    };

    setSims((prev) => {
      const filtered = prev.filter((s) => s.id !== targetSimId && (!assignedDevId || s.assignedDevice.toLowerCase() !== assignedDevId));
      const updated = [simWithDeterministicId, ...filtered];
      try {
        localStorage.setItem('simsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    insertSupabaseSIM(simWithDeterministicId);

    // Sync to device if matched
    if (matchedDevice) {
      const updatedDevice: Device = {
        ...matchedDevice,
        sim: newSIM.simNumber || '-',
        operator: newSIM.operator || matchedDevice.operator,
        location: newSIM.location || matchedDevice.location,
      };
      setDevices((prevDevs) => {
        const idx = prevDevs.findIndex((d) => d.sl === matchedDevice.sl);
        if (idx >= 0) {
          const updatedDevs = [...prevDevs];
          updatedDevs[idx] = updatedDevice;
          try {
            localStorage.setItem('devicesData', JSON.stringify(updatedDevs));
          } catch (e) {}
          return updatedDevs;
        }
        return prevDevs;
      });
      insertSupabaseDevice(updatedDevice);
    }

    showToast(`SIM Card "${newSIM.simNumber || 'Blank'}" added successfully!`);
  };

  const handleSaveEditedSIM = (updatedSIM: SIMItem) => {
    setSims((prev) => {
      const updated = prev.map((s) => (s.id === updatedSIM.id ? updatedSIM : s));
      try {
        localStorage.setItem('simsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    insertSupabaseSIM(updatedSIM);

    // Sync back to corresponding device in Device MIS Tree if assigned
    if (updatedSIM.assignedDevice && updatedSIM.assignedDevice !== '-') {
      setDevices((prevDevs) => {
        const idx = prevDevs.findIndex(
          (d) => d.id && d.id.trim().toLowerCase() === updatedSIM.assignedDevice.trim().toLowerCase()
        );
        if (idx >= 0) {
          const matched = prevDevs[idx];
          const updatedDevice: Device = {
            ...matched,
            sim: updatedSIM.simNumber || '-',
            operator: updatedSIM.operator || matched.operator,
            location: updatedSIM.location || matched.location,
          };
          const updatedDevs = [...prevDevs];
          updatedDevs[idx] = updatedDevice;
          try {
            localStorage.setItem('devicesData', JSON.stringify(updatedDevs));
          } catch (e) {}
          insertSupabaseDevice(updatedDevice);
          return updatedDevs;
        }
        return prevDevs;
      });
    }

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

  const handleSaveIssue = async (issue: IssueTrackerItem): Promise<boolean> => {
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
    const success = await insertSupabaseIssue(issue);
    return success;
  };

  const handleDeleteIssue = async (id: string) => {
    setIssues((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem('issueTrackerData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    await deleteSupabaseIssue(id);
  };

  const handleBulkDeleteIssues = async (ids: string[]) => {
    setIssues((prev) => {
      const updated = prev.filter((i) => !ids.includes(i.id));
      try {
        localStorage.setItem('issueTrackerData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    await bulkDeleteSupabaseIssues(ids);
  };

  const handleSaveDeviceSupportTicket = async (ticket: DeviceSupportTicket) => {
    setDeviceSupportTickets((prev) => {
      const exists = prev.some((t) => t.id === ticket.id);
      const updated = exists ? prev.map((t) => (t.id === ticket.id ? ticket : t)) : [ticket, ...prev];
      try {
        localStorage.setItem('deviceSupportTicketsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    showToast('Device Support Ticket saved successfully!');
    await insertSupabaseDeviceSupportTicket(ticket);
  };

  const handleDeleteDeviceSupportTicket = async (id: string) => {
    setDeviceSupportTickets((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem('deviceSupportTicketsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    showToast('Device Support Ticket deleted.');
    await deleteSupabaseDeviceSupportTicket(id);
  };

  const handleBulkDeleteDeviceSupportTickets = async (ids: string[]) => {
    setDeviceSupportTickets((prev) => {
      const updated = prev.filter((t) => !ids.includes(t.id));
      try {
        localStorage.setItem('deviceSupportTicketsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save error', e);
      }
      return updated;
    });
    showToast(`${ids.length} Device Support Ticket(s) deleted.`);
    await bulkDeleteSupabaseDeviceSupportTickets(ids);
  };

  // Bill Tracker & Report Handlers
  const handleSaveBill = async (bill: BillItem) => {
    setBills((prev) => {
      const exists = prev.some((b) => b.id === bill.id);
      const updated = exists ? prev.map((b) => (b.id === bill.id ? bill : b)) : [bill, ...prev];
      try {
        localStorage.setItem('billsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save bills error', e);
      }
      return updated;
    });
    showToast('Bill saved successfully!');
    await insertSupabaseBill(bill);
  };

  const handleDeleteBill = async (id: string) => {
    setBills((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('billsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save bills error', e);
      }
      return updated;
    });
    showToast('Bill record deleted.');
    await deleteSupabaseBill(id);
  };

  const handleBulkDeleteBills = async (ids: string[]) => {
    setBills((prev) => {
      const updated = prev.filter((b) => !ids.includes(b.id));
      try {
        localStorage.setItem('billsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save bills error', e);
      }
      return updated;
    });
    showToast(`${ids.length} Bill record(s) deleted.`);
    await bulkDeleteSupabaseBills(ids);
  };

  // Service Tickets Handlers (Service Ticket Tracker & Service Ticket Report)
  const handleSaveServiceTicket = async (ticket: ServiceTicketItem) => {
    setServiceTickets((prev) => {
      const exists = prev.some((t) => t.id === ticket.id);
      const updated = exists
        ? prev.map((t) => (t.id === ticket.id ? { ...ticket, updatedAt: new Date().toISOString() } : t))
        : [{ ...ticket, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev];
      try {
        localStorage.setItem('serviceTicketItemsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save service tickets error', e);
      }
      return updated;
    });
    showToast(`Service Ticket "${ticket.issueNumber}" saved successfully!`);
    await insertSupabaseServiceTicket(ticket);
  };

  const handleDeleteServiceTicket = async (id: string) => {
    setServiceTickets((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem('serviceTicketItemsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save service tickets error', e);
      }
      return updated;
    });
    showToast('Service ticket record deleted.');
    await deleteSupabaseServiceTicket(id);
  };

  const handleBulkDeleteServiceTickets = async (ids: string[]) => {
    const idSet = new Set(ids);
    setServiceTickets((prev) => {
      const updated = prev.filter((t) => !idSet.has(t.id));
      try {
        localStorage.setItem('serviceTicketItemsData', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage save service tickets error', e);
      }
      return updated;
    });
    showToast(`${ids.length} service ticket(s) deleted.`);
    await bulkDeleteSupabaseServiceTickets(ids);
  };

  const handleLoadSampleServiceTickets = () => {
    const sampleDate = new Date().toISOString().split('T')[0];
    const samples: ServiceTicketItem[] = [
      {
        id: 'ISS-SAMPLE-01',
        issueNumber: 'ISS-20261019-01',
        odooId: 'ODOO-98201',
        emailFrom: 'branch.motijheel@blackbank.com',
        emailSubject: 'Fingerprint Module & Backup Battery Fault',
        client: 'Black Bank PLC',
        contactPerson: 'Farhan Ahmed',
        contactNumber: '01711223344',
        district: 'Dhaka',
        address: 'Motijheel C/A, Dhaka-1000',
        deviceLocation: 'Motijheel Branch - Counter 03',
        locationType: 'Main Branch',
        deviceId: 'DEV-1029',
        product: 'Fingerprint Module',
        productPrice: '3720',
        segment: 'Corporate',
        kam: 'Tanvir Hossain',
        requestDate: sampleDate,
        requestTime: '10:30',
        plannedDate: sampleDate,
        serviceDate: '',
        slaThreshold: 3,
        resolutionDays: 0,
        slaStatus: 'Pending',
        issues: 'Sensor, Power Issue',
        priority: 'High',
        status: 'Working',
        replace: 'Yes',
        replaceDeviceId: 'DEV-NEW-8841',
        assignPerson: 'Engr. Shakil',
        accessories: 'SMPS Adapter, Battery Cable',
        deliveryOption: 'Onsite',
        challanBy: 'Md. Kabir',
        handedOverTo: 'Branch Manager',
        unitQty: 1,
        invoiceHandover: 'Yes',
        paymentMethod: 'Cash',
        vendorBill: 'BILL-V-7712',
        remarks: 'Replaced fingerprint module and verified connectivity.',
        comments: 'Branch operational after quick fix.',
      },
      {
        id: 'ISS-SAMPLE-02',
        issueNumber: 'ISS-20261019-02',
        odooId: 'ODOO-98202',
        emailFrom: 'branch.dhanmondi@blackbank.com',
        emailSubject: 'GPRS SIM connectivity drop',
        client: 'Black Bank PLC',
        contactPerson: 'Nasrin Sultana',
        contactNumber: '01819334455',
        district: 'Dhaka',
        address: 'Road 27, Dhanmondi, Dhaka',
        deviceLocation: 'Dhanmondi Branch - ATM Booth 1',
        locationType: 'Sub Branch',
        deviceId: 'DEV-1044',
        product: 'GPRS Network Communication Module',
        productPrice: '1320',
        segment: 'Retail',
        kam: 'Tanvir Hossain',
        requestDate: sampleDate,
        requestTime: '11:15',
        plannedDate: sampleDate,
        serviceDate: sampleDate,
        slaThreshold: 2,
        resolutionDays: 1,
        slaStatus: 'Within SLA',
        issues: 'Sim Connectivity',
        priority: 'Medium',
        status: 'Done',
        replace: 'No',
        replaceDeviceId: 'N/A',
        assignPerson: 'Engr. Shakil',
        accessories: 'Antenna',
        deliveryOption: 'Onsite',
        challanBy: 'Sajib Roy',
        handedOverTo: 'Security Supervisor',
        unitQty: 1,
        invoiceHandover: 'No',
        paymentMethod: 'Bank Transfer',
        vendorBill: '',
        remarks: 'Antenna re-tightened and SIM re-seated. Signal restored.',
        comments: 'Solved within SLA.',
      },
    ];

    setServiceTickets((prev) => {
      const merged = [...samples, ...prev.filter((p) => !samples.some((s) => s.id === p.id))];
      try {
        localStorage.setItem('serviceTicketItemsData', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    showToast('Sample Service Tickets loaded successfully!');
  };

  const handleAddBillClient = (name: string) => {
    setBillClients((prev) => {
      if (prev.includes(name)) return prev;
      const updated = [...prev, name];
      try {
        localStorage.setItem('billClientsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Client "${name}" added.`);
  };

  const handleDeleteBillClient = (name: string) => {
    setBillClients((prev) => {
      const updated = prev.filter((c) => c !== name);
      try {
        localStorage.setItem('billClientsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Client "${name}" removed.`);
  };

  const handleAddBillLocation = (loc: string) => {
    setBillLocations((prev) => {
      if (prev.includes(loc)) return prev;
      const updated = [...prev, loc];
      try {
        localStorage.setItem('billLocationsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Location "${loc}" added.`);
  };

  const handleDeleteBillLocation = (loc: string) => {
    setBillLocations((prev) => {
      const updated = prev.filter((l) => l !== loc);
      try {
        localStorage.setItem('billLocationsData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Location "${loc}" removed.`);
  };

  const handleAddBillCategory = (cat: string) => {
    setBillCategories((prev) => {
      if (prev.includes(cat)) return prev;
      const updated = [...prev, cat];
      try {
        localStorage.setItem('billCategoriesData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Category "${cat}" added.`);
  };

  const handleDeleteBillCategory = (cat: string) => {
    setBillCategories((prev) => {
      const updated = prev.filter((c) => c !== cat);
      try {
        localStorage.setItem('billCategoriesData', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Category "${cat}" removed.`);
  };

  // Backup Restore Handler
  const handleRestoreData = (restored: {
    devices?: Device[];
    tickets?: Ticket[];
    pos?: PurchaseOrder[];
    sims?: SIMItem[];
    issues?: IssueTrackerItem[];
    deviceSupportTickets?: DeviceSupportTicket[];
    serviceTickets?: ServiceTicketItem[];
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
          const targetDevices = (restored.devices && Array.isArray(restored.devices)) ? restored.devices : devices;
          const cleanSims = reconcileSimsWithDevices(restored.sims, targetDevices);
          setSims(cleanSims);
          try {
            localStorage.setItem('simsData', JSON.stringify(cleanSims));
          } catch (e) {
            console.warn(e);
          }
          syncReplaceSupabaseSIMs(cleanSims);
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
        if (restored.deviceSupportTickets && Array.isArray(restored.deviceSupportTickets)) {
          setDeviceSupportTickets(restored.deviceSupportTickets);
          bulkInsertSupabaseDeviceSupportTickets(restored.deviceSupportTickets);
          try {
            localStorage.setItem('deviceSupportTicketsData', JSON.stringify(restored.deviceSupportTickets));
          } catch (e) {
            console.warn('localStorage save error', e);
          }
        }
        if (restored.serviceTickets && Array.isArray(restored.serviceTickets)) {
          setServiceTickets(restored.serviceTickets);
          try {
            localStorage.setItem('serviceTicketItemsData', JSON.stringify(restored.serviceTickets));
          } catch (e) {
            console.warn('localStorage save error', e);
          }
          restored.serviceTickets.forEach((st) => insertSupabaseServiceTicket(st));
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
          hiddenModules={hiddenModules}
        />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 min-w-0 p-4 md:p-6 bg-slate-100 dark:bg-slate-900 overflow-y-auto h-full transition-colors duration-200">
          {activeTab === 'dashboard' && (
            <DashboardTab
              tickets={tickets}
              devices={devices}
              pos={pos}
              sims={sims}
              issues={issues}
              deviceSupportTickets={deviceSupportTickets}
              bills={bills}
              serviceTickets={serviceTickets}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'device_issue_tracker' && (
            <DeviceIssueTrackerTab
              tickets={deviceSupportTickets}
              onSaveTicket={handleSaveDeviceSupportTicket}
              onDeleteTicket={handleDeleteDeviceSupportTicket}
              devices={devices}
              onNavigateToReport={() => setActiveTab('device_issue_report')}
            />
          )}

          {activeTab === 'device_issue_report' && (
            <DeviceIssueReportTab
              tickets={deviceSupportTickets}
              onSaveTicket={handleSaveDeviceSupportTicket}
              onDeleteTicket={handleDeleteDeviceSupportTicket}
              onBulkDeleteTickets={handleBulkDeleteDeviceSupportTickets}
              onNavigateToTracker={() => setActiveTab('device_issue_tracker')}
            />
          )}

          {activeTab === 'service_ticket_tracker' && (
            <ServiceTicketTrackerTab
              tickets={serviceTickets}
              onSaveTicket={handleSaveServiceTicket}
              onDeleteTicket={handleDeleteServiceTicket}
              onNavigateToReport={() => setActiveTab('service_ticket_report')}
              editTicket={editingServiceTicketForTracker}
              onClearEditTicket={() => setEditingServiceTicketForTracker(null)}
            />
          )}

          {activeTab === 'service_ticket_report' && (
            <ServiceTicketReportTab
              tickets={serviceTickets}
              onSaveTicket={handleSaveServiceTicket}
              onDeleteTicket={handleDeleteServiceTicket}
              onBulkDeleteTickets={handleBulkDeleteServiceTickets}
              onNavigateToTracker={() => setActiveTab('service_ticket_tracker')}
              onEditTicketInTracker={(t) => {
                setEditingServiceTicketForTracker(t);
                setActiveTab('service_ticket_tracker');
              }}
              onLoadSampleData={handleLoadSampleServiceTickets}
            />
          )}

          {activeTab === 'bill_tracker' && (
            <BillTrackerTab
              bills={bills}
              onSaveBill={handleSaveBill}
              onDeleteBill={handleDeleteBill}
              clients={billClients}
              onAddClient={handleAddBillClient}
              onDeleteClient={handleDeleteBillClient}
              locations={billLocations}
              onAddLocation={handleAddBillLocation}
              onDeleteLocation={handleDeleteBillLocation}
              categories={billCategories}
              onAddCategory={handleAddBillCategory}
              onDeleteCategory={handleDeleteBillCategory}
              onNavigateToReport={() => setActiveTab('bill_report')}
              editBill={editingBillForTracker}
              onClearEditBill={() => setEditingBillForTracker(null)}
            />
          )}

          {activeTab === 'bill_report' && (
            <BillReportTab
              bills={bills}
              onSaveBill={handleSaveBill}
              onDeleteBill={handleDeleteBill}
              onBulkDeleteBills={handleBulkDeleteBills}
              onNavigateToTracker={() => setActiveTab('bill_tracker')}
              onEditBillInTracker={(b) => {
                setEditingBillForTracker(b);
                setActiveTab('bill_tracker');
              }}
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
              onOpenExcelUploadModal={() => setIsPOExcelUploadOpen(true)}
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
                deviceSupportTickets,
                serviceTickets,
                categoryGroups,
                systemOptions,
                appSettings,
              }}
              onRestoreData={handleRestoreData}
              showToast={showToast}
            />
          )}

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
              hiddenModules={hiddenModules}
              onToggleModule={handleToggleModule}
              onSaveHiddenModules={handleSaveHiddenModules}
              onResetModules={handleResetModules}
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

      {isAddDeviceOpen && (
        <AddDeviceModal
          isOpen={isAddDeviceOpen}
          activeCategory={activeCategory}
          categoryGroups={categoryGroups}
          systemOptions={systemOptions}
          onClose={() => setIsAddDeviceOpen(false)}
          onSaveDevice={handleSaveNewDevice}
        />
      )}

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

      <POExcelUploadModal
        isOpen={isPOExcelUploadOpen}
        onClose={() => setIsPOExcelUploadOpen(false)}
        onImportPOs={handleImportPOs}
        systemOptions={systemOptions}
        categoryGroups={categoryGroups}
        poCount={pos.length}
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
