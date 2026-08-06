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
import { ExcelUploadModal } from './components/Modals/ExcelUploadModal';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeCategory, setActiveCategory] = useState<string>('Main Branch');
  const [searchQuery, setSearchQuery] = useState('');

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
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);

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
  };

  // Device Handlers
  const handleSaveNewDevice = (deviceData: Omit<Device, 'sl'>) => {
    const newDevice: Device = {
      ...deviceData,
      sl: Date.now(),
    };
    setDevices((prev) => [...prev, newDevice]);
    insertSupabaseDevice(newDevice);
  };

  const handleSaveEditedDevice = (updatedDevice: Device) => {
    setDevices((prev) =>
      prev.map((d) => (d.sl === updatedDevice.sl ? updatedDevice : d))
    );
    insertSupabaseDevice(updatedDevice);
  };

  const handleDeleteDevice = (sl: number) => {
    setDevices((prev) => prev.filter((d) => d.sl !== sl));
    deleteSupabaseDevice(sl);
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

    if (formattedDevices.length > 0) {
      setActiveCategory(formattedDevices[0].category);
      setActiveTab('devices');
    }
  };

  // Ticket Handlers
  const handleSaveNewTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    insertSupabaseTicket(newTicket);
  };

  const handleSaveEditedTicket = (updatedTicket: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    insertSupabaseTicket(updatedTicket);
  };

  const handleDeleteTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    if (target) {
      deleteSupabaseTicket(target.sl);
    }
  };

  // PO & SIM Handlers
  const handleSaveNewPO = (newPO: PurchaseOrder) => {
    setPos((prev) => [newPO, ...prev]);
    insertSupabasePO(newPO);
  };

  const handleDeletePO = (targetIdOrSl: any) => {
    setPos((prev) => prev.filter((p) => (p as any).id !== targetIdOrSl && (p as any).sl !== targetIdOrSl));
    deleteSupabasePO(String(targetIdOrSl));
  };

  const handleSaveNewSIM = (newSIM: SIMItem) => {
    setSims((prev) => [newSIM, ...prev]);
    insertSupabaseSIM(newSIM);
  };

  const handleDeleteSIM = (targetIdOrSl: any) => {
    setSims((prev) => prev.filter((s) => (s as any).id !== targetIdOrSl && (s as any).sl !== targetIdOrSl));
    deleteSupabaseSIM(String(targetIdOrSl));
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
              onOpenAddDeviceModal={() => setIsAddDeviceOpen(true)}
              onOpenEditDeviceModal={(d) => setEditingDevice(d)}
              onDeleteDevice={handleDeleteDevice}
              onOpenExcelUploadModal={() => setIsExcelUploadOpen(true)}
            />
          )}

          {activeTab === 'po' && (
            <POTab
              pos={pos}
              onOpenAddPOModal={() => setIsAddPOOpen(true)}
              onDeletePO={handleDeletePO}
            />
          )}

          {activeTab === 'service' && (
            <ServiceTab
              tickets={tickets}
              onOpenNewTicketModal={() => setIsNewTicketOpen(true)}
              onOpenEditTicketModal={(t) => setEditingTicket(t)}
              onDeleteTicket={handleDeleteTicket}
            />
          )}

          {activeTab === 'sim' && (
            <SIMTab
              sims={sims}
              onOpenAddSIMModal={() => setIsAddSIMOpen(true)}
              onDeleteSIM={handleDeleteSIM}
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
        systemOptions={systemOptions}
        onClose={() => setIsAddDeviceOpen(false)}
        onSaveDevice={handleSaveNewDevice}
      />

      <EditDeviceModal
        isOpen={Boolean(editingDevice)}
        device={editingDevice}
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

      <ExcelUploadModal
        isOpen={isExcelUploadOpen}
        activeCategory={activeCategory}
        onClose={() => setIsExcelUploadOpen(false)}
        onImportDevices={handleImportDevices}
      />
    </div>
  );
}
