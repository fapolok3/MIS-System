import React, { useState } from 'react';
import {
  PieChart,
  FileText,
  Headphones,
  Smartphone,
  Database,
  Plus,
  Building2,
  ShieldCheck,
  Network,
  Building,
  ChevronDown,
  ChevronUp,
  Menu,
  Settings,
  FileSpreadsheet,
} from 'lucide-react';
import { TabType, CategoryGroup } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  categoryGroups: CategoryGroup[];
  onOpenAddCategoryModal: () => void;
  onOpenExcelUploadModal?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeCategory,
  setActiveCategory,
  categoryGroups,
  onOpenAddCategoryModal,
  onOpenExcelUploadModal,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    branch: true,
    sec: true,
    infra: true,
    ho: true,
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'branch':
        return <Building2 className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />;
      case 'infra':
        return <Network className="w-4 h-4 text-amber-400 mr-2 shrink-0" />;
      case 'headoffice':
        return <Building className="w-4 h-4 text-blue-400 mr-2 shrink-0" />;
      default:
        return <Building2 className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />;
    }
  };

  const getHoverColor = (iconType: string) => {
    switch (iconType) {
      case 'security':
        return 'hover:text-emerald-400';
      case 'infra':
        return 'hover:text-amber-400';
      case 'headoffice':
        return 'hover:text-blue-400';
      default:
        return 'hover:text-indigo-400';
    }
  };

  if (!isSidebarOpen) {
    return (
      <aside className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full overflow-y-auto transition-all duration-300">
        <div className="p-2 space-y-3 flex flex-col items-center">
          <button
            onClick={onToggleSidebar}
            title="Expand Sidebar"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center border border-slate-700/60 mb-1"
          >
            <Menu className="w-5 h-5 text-indigo-400" />
          </button>
          <div className="w-8 border-t border-slate-800/80" />

          <button
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
            className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('po')}
            title="Purchase Orders (PO)"
            className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === 'po'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('service')}
            title="Service Tracker"
            className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === 'service'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('sim')}
            title="SIM Management"
            className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === 'sim'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            title="Backup & Restore"
            className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Database className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            title="System Settings"
            className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="w-8 border-t border-slate-800 my-1" />

          {categoryGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                if (group.items.length > 0) {
                  setActiveCategory(group.items[0]);
                  setActiveTab('devices');
                }
              }}
              title={group.title}
              className={`p-2.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
                activeTab === 'devices' && group.items.includes(activeCategory)
                  ? 'bg-slate-800 text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {group.icon === 'branch' && <Building2 className="w-4 h-4 text-indigo-400" />}
              {group.icon === 'security' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              {group.icon === 'infra' && <Network className="w-4 h-4 text-amber-400" />}
              {group.icon === 'headoffice' && <Building className="w-4 h-4 text-blue-400" />}
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-slate-800 text-[9px] text-slate-500 text-center font-mono">
          v2.5
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full overflow-y-auto transition-all duration-300">
      <div>
        {/* Sidebar Top Bar with Hamburger Toggle */}
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/90 sticky top-0 z-10">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            Menu Panel
          </span>
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center border border-slate-700/60"
            title="Minimize Sidebar"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5 text-indigo-400" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Main Navigation Menu */}
          <div>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Main Menu
            </h2>
          <nav className="space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-indigo-400 font-bold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('po')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'po'
                  ? 'bg-slate-900 text-indigo-400 font-bold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" /> Purchase Orders (PO)
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'service'
                  ? 'bg-slate-900 text-indigo-400 font-bold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Headphones className="w-4 h-4" /> Service Tracker
            </button>
            <button
              onClick={() => setActiveTab('sim')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'sim'
                  ? 'bg-slate-900 text-indigo-400 font-bold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" /> SIM Management
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-slate-900 text-indigo-400 font-bold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" /> Backup & Restore
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-indigo-400 font-bold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" /> System Settings
            </button>
          </nav>
        </div>

        {/* DEVICE MIS TREE */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Device MIS Tree
            </h2>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 font-bold cursor-pointer hover:underline"
              title="Manage Categories in Settings"
            >
              <Plus className="w-3 h-3" /> Category
            </button>
          </div>

          <ul className="space-y-3 text-xs">
            {categoryGroups.map((group) => {
              const isOpen = openGroups[group.id] ?? true;
              return (
                <li key={group.id}>
                  <div>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex justify-between items-center py-1 cursor-pointer hover:text-white font-bold text-slate-200"
                    >
                      <span className="flex items-center">
                        {renderIcon(group.icon)}
                        {group.title}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                    {isOpen && (
                      <ul className="pl-6 mt-1 space-y-1.5 border-l border-slate-800 text-slate-400">
                        {group.items.map((catItem) => (
                          <li key={catItem}>
                            <button
                              onClick={() => {
                                setActiveCategory(catItem);
                                setActiveTab('devices');
                              }}
                              className={`w-full text-left transition block ${getHoverColor(
                                group.icon
                              )} ${
                                activeCategory === catItem &&
                                activeTab === 'devices'
                                  ? 'text-indigo-400 font-bold'
                                  : ''
                              }`}
                            >
                              {catItem}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono font-medium">
        System Build: v0.4
      </div>
    </aside>
  );
};
