import React, { useState, useEffect } from 'react';
import { TabType, Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup, SystemOptions } from './types';
import {
  initialDevices,
  initialTickets,
  initialPOs,
  initialSIMs,
  initialCategoryGroups,
  initialSystemOptions,
} from './data/initialData';

import {
  fetchSupabaseDevices,
  insertSupabaseDevice,
  bulkInsertSupabaseDevices,
  deleteSupabaseDevice,
  fetchSupabaseTickets,
  insertSupabaseTicket,
  deleteSupabaseTicket,
  fetchSupabasePOs,
  insertSupabasePO,
  deleteSupabasePO,
  fetchSupabaseSIMs,
  insertSupabaseSIM,
  deleteSupabaseSIM,
  fetchSupabaseCategoryGroups,
  saveSupabaseCategoryGroups,
} from './lib/supabase';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { DevicesTab } from './components/DevicesTab';
import { POTab } from './components/POTab';
import { ServiceTab } from './components/ServiceTab';
import { SIMTab } from './components/SIMTab';
import { BranchReportTab } from './components/BranchReportTab';
import { BackupTab } from './components/BackupTab';
import { SettingsTab } from './components/SettingsTab';
import { LoginModal } from './components/LoginModal';

import { AddCategoryModal } from './components/Modals/AddCategoryModal';
import { AddDeviceModal } from './components/Modals/AddDeviceModal';
import { EditDeviceModal } from './components/Modals/EditDeviceModal';
import { NewTicketModal } from './components/Modals/NewTicketModal';
import { EditTicketModal } from './components/Modals/EditTicketModal';
import { AddPOModal } from './components/Modals/AddPOModal';
import { AddSIMModal } from './components/Modals/AddSIMModal';
import { EditSIMModal } from './components/Modals/EditSIMModal';
import { ExcelUploadModal } from './components/Modals/ExcelUploadModal';
import { ConfirmModal } from './components/Modals/ConfirmModal';
import { Toast, ToastData } from './components/Toast';

const pathToTab = (path: string): TabType => {
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath === '/devices') return 'devices';
  if (cleanPath === '/po' || cleanPath === '/purchase-orders') return 'po';
  if (cleanPath === '/service' || cleanPath === '/service-tickets') return 'service';
  if (cleanPath === '/sim' || cleanPath === '/sim-management') return 'sim';
  if (cleanPath === '/branch-report' || cleanPath === '/all-branch-report') return 'branch_report';
  if (cleanPath === '/backup') return 'backup';
  if (cleanPath === '/settings') return 'settings';
  return 'dashboard';
};

const tabToPath = (tab: TabType): string => {
  switch (tab) {
    case 'devices': return '/devices';
    case 'po': return '/po';
    case 'service': return '/service';
    case 'sim': return '/sim';
    case 'branch_report': return '/branch-report';
    case 'backup': return '/backup';
    case 'settings': return '/settings';
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
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [pos, setPos] = useState<PurchaseOrder[]>(initialPOs);
  const [sims, setSims] = useState<SIMItem[]>(initialSIMs);
  const [categoryGroups, setCategoryGroups] =
    useState<CategoryGroup[]>(initialCategoryGroups);
  const [systemOptions, setSystemOptions] =
    useState<SystemOptions>(initialSystemOptions);

  // Modals Visibility State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [isAddSIMOpen, setIsAddSIMOpen] = useState(false);
  const [editingSIM, setEditingSIM] = useState<SIMItem | null>(null);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: String(Date.now()),
      message,
      type,
    });
  };

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Load live data from Supabase on mount
  useEffect(() => {
    async function loadSupabaseData() {
      const [dbDevices, dbTickets, dbPOs, dbSIMs, dbCategoryGroups] = await Promise.all([
        fetchSupabaseDevices(),
        fetchSupabaseTickets(),
        fetchSupabasePOs(),
        fetchSupabaseSIMs(),
        fetchSupabaseCategoryGroups(),
      ]);

      if (dbDevices && dbDevices.length > 0) {
        setDevices(dbDevices);
      }
      if (dbTickets && dbTickets.length > 0) {
        setTickets(dbTickets);
      }
      if (dbPOs && dbPOs.length > 0) {
        setPos(dbPOs);
      }
      if (dbSIMs && dbSIMs.length > 0) {
        setSims(dbSIMs);
      }
      if (dbCategoryGroups && dbCategoryGroups.length > 0) {
        setCategoryGroups(dbCategoryGroups);
      }
    }
    loadSupabaseData();
  }, []);

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

  // Device Handlers
  const syncSimFromDevice = (device: Device) => {
    const simNum = device.sim?.trim();
    if (!simNum || simNum === '-' || simNum.toLowerCase() === 'n/a' || simNum.toLowerCase() === 'none') {
      return;
    }

    const simStatus: 'ACTIVE' | 'INACTIVE' = device.status === 'LIVE' ? 'ACTIVE' : 'INACTIVE';

    setSims((prevSims) => {
      const existingIndex = prevSims.findIndex(
        (s) =>
          (s.simNumber && s.simNumber.trim() === simNum) ||
          (s.assignedDevice && s.assignedDevice === device.id)
      );

      if (existingIndex >= 0) {
        const updatedSims = [...prevSims];
        const existingSim = updatedSims[existingIndex];
        const updatedSim: SIMItem = {
          ...existingSim,
          simNumber: simNum,
          operator: device.operator || existingSim.operator,
          assignedDevice: device.id || existingSim.assignedDevice,
          location: device.location || existingSim.location,
          status: simStatus,
        };
        updatedSims[existingIndex] = updatedSim;
        insertSupabaseSIM(updatedSim);
        return updatedSims;
      } else {
        const newSim: SIMItem = {
          id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          simNumber: simNum,
          operator: device.operator || 'GP',
          assignedDevice: device.id || '-',
          location: device.location || '-',
          status: simStatus,
        };
        insertSupabaseSIM(newSim);
        return [newSim, ...prevSims];
      }
    });
  };

  const handleSaveNewDevice = (deviceData: Omit<Device, 'sl'>) => {
    const newDevice: Device = {
      ...deviceData,
      sl: Date.now(),
    };
    setDevices((prev) => [...prev, newDevice]);
    insertSupabaseDevice(newDevice);
    syncSimFromDevice(newDevice);
    showToast(`Device "${newDevice.id}" created successfully!`);
  };

  const handleSaveEditedDevice = (updatedDevice: Device) => {
    setDevices((prev) =>
      prev.map((d) => (d.sl === updatedDevice.sl ? updatedDevice : d))
    );
    insertSupabaseDevice(updatedDevice);
    syncSimFromDevice(updatedDevice);
    showToast(`Device "${updatedDevice.id}" updated successfully!`);
  };

  const handleDeleteDevice = (sl: number) => {
    const target = devices.find((d) => d.sl === sl);
    const label = target ? `Device ID "${target.id}" (SOL: ${target.sol})` : 'this device';

    askConfirmation(
      'Confirm Device Deletion',
      `Are you sure you want to delete ${label}? This operation cannot be undone.`,
      () => {
        setDevices((prev) => prev.filter((d) => d.sl !== sl));
        deleteSupabaseDevice(sl);
        showToast('Device deleted successfully!');
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

    // Auto-sync SIM cards from imported devices
    formattedDevices.forEach((dev) => syncSimFromDevice(dev));

    if (formattedDevices.length > 0) {
      setActiveCategory(formattedDevices[0].category);
      setActiveTab('devices');
    }
    showToast(`${formattedDevices.length} Devices imported successfully!`);
  };

  // Ticket Handlers
  const handleSaveNewTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    insertSupabaseTicket(newTicket);
    showToast(`Service Ticket "${newTicket.id}" created successfully!`);
  };

  const handleSaveEditedTicket = (updatedTicket: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    insertSupabaseTicket(updatedTicket);
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

  // PO & SIM Handlers
  const handleSaveNewPO = (newPO: PurchaseOrder) => {
    setPos((prev) => [newPO, ...prev]);
    insertSupabasePO(newPO);
    showToast(`Purchase Order "${newPO.poNumber}" added successfully!`);
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

    askConfirmation(
      'Confirm SIM Card Deletion',
      `Are you sure you want to delete ${label}? This operation cannot be undone.`,
      () => {
        setSims((prev) => prev.filter((s) => (s as any).id !== targetIdOrSl && (s as any).sl !== targetIdOrSl));
        deleteSupabaseSIM(String(targetIdOrSl));
        showToast('SIM Card deleted successfully!');
      }
    );
  };

  // Backup Restore Handler
  const handleRestoreData = (restored: {
    devices: Device[];
    tickets: Ticket[];
    pos: PurchaseOrder[];
    sims: SIMItem[];
    categoryGroups: CategoryGroup[];
    systemOptions?: SystemOptions;
  }) => {
    askConfirmation(
      'Confirm Restore Backup',
      'Are you sure you want to restore data from backup? This will overwrite existing records with the restored data.',
      () => {
        if (restored.devices) {
          setDevices(restored.devices);
          bulkInsertSupabaseDevices(restored.devices);
        }
        if (restored.tickets) {
          setTickets(restored.tickets);
          restored.tickets.forEach((t) => insertSupabaseTicket(t));
        }
        if (restored.pos) {
          setPos(restored.pos);
          restored.pos.forEach((p) => insertSupabasePO(p));
        }
        if (restored.sims) {
          setSims(restored.sims);
          restored.sims.forEach((s) => insertSupabaseSIM(s));
        }
        if (restored.categoryGroups) {
          setCategoryGroups(restored.categoryGroups);
          saveSupabaseCategoryGroups(restored.categoryGroups);
        }
        if (restored.systemOptions) setSystemOptions(restored.systemOptions);

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
    return <LoginModal onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col overflow-hidden">
      {/* Top Header Navigation */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
        <main className="flex-1 min-w-0 p-4 md:p-6 bg-slate-900 overflow-y-auto h-full">
          {activeTab === 'dashboard' && (
            <DashboardTab
              tickets={tickets}
              devices={devices}
              pos={pos}
              sims={sims}
              onSwitchTab={setActiveTab}
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
              onOpenExcelUploadModal={() => setIsExcelUploadOpen(true)}
            />
          )}

          {activeTab === 'po' && (
            <POTab
              pos={pos}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddPOModal={() => setIsAddPOOpen(true)}
              onDeletePO={handleDeletePO}
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
            />
          )}

          {activeTab === 'sim' && (
            <SIMTab
              sims={sims}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddSIMModal={() => setIsAddSIMOpen(true)}
              onOpenEditSIMModal={(sim) => setEditingSIM(sim)}
              onDeleteSIM={handleDeleteSIM}
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
                categoryGroups,
                systemOptions,
              }}
              onRestoreData={handleRestoreData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              categoryGroups={categoryGroups}
              setCategoryGroups={setCategoryGroups}
              systemOptions={systemOptions}
              setSystemOptions={setSystemOptions}
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
        systemOptions={systemOptions}
        onClose={() => setIsAddPOOpen(false)}
        onSavePO={handleSaveNewPO}
        poCount={pos.length}
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

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

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
