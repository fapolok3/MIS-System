import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Search,
  LogOut,
  X,
  Monitor,
  Smartphone,
  Headphones,
  FileText,
  FolderTree,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup } from '../types';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  appName?: string;
  appLogo?: string;
  devices?: Device[];
  tickets?: Ticket[];
  pos?: PurchaseOrder[];
  sims?: SIMItem[];
  categoryGroups?: CategoryGroup[];
  onNavigateToResult?: (
    type: 'device' | 'sim' | 'ticket' | 'po' | 'category',
    item: any
  ) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  appName = 'BBL DM System',
  appLogo = '',
  devices = [],
  tickets = [],
  pos = [],
  sims = [],
  categoryGroups = [],
  onNavigateToResult,
  onLogout,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe lowercasing helper
  const safeLower = (val: any): string => (val ? String(val).toLowerCase() : '');

  // Filter calculation
  const query = searchQuery.trim().toLowerCase();
  const showResults = isOpen && query.length > 0;

  const matchedDevices = query
    ? devices.filter(
        (d) =>
          safeLower(d.id).includes(query) ||
          safeLower((d as any).deviceId).includes(query) ||
          safeLower(d.sol).includes(query) ||
          safeLower(d.category).includes(query) ||
          safeLower(d.location).includes(query) ||
          safeLower(d.district).includes(query) ||
          safeLower(d.sim).includes(query) ||
          safeLower(d.bm).includes(query) ||
          safeLower(d.placement).includes(query) ||
          safeLower(d.operator).includes(query)
      )
    : [];

  const matchedSims = query
    ? sims.filter(
        (s) =>
          safeLower(s.simNumber).includes(query) ||
          safeLower(s.operator).includes(query) ||
          safeLower((s as any).ipAddress).includes(query) ||
          safeLower(s.assignedDevice).includes(query) ||
          safeLower(s.location).includes(query)
      )
    : [];

  const matchedTickets = query
    ? tickets.filter(
        (t) =>
          safeLower(t.id).includes(query) ||
          safeLower((t as any).ticketNo).includes(query) ||
          safeLower(t.deviceId).includes(query) ||
          safeLower(t.sol).includes(query) ||
          safeLower(t.subject).includes(query) ||
          safeLower((t as any).issue).includes(query) ||
          safeLower(t.issueType).includes(query) ||
          safeLower((t as any).category).includes(query) ||
          safeLower(t.location).includes(query) ||
          safeLower(t.tech).includes(query)
      )
    : [];

  const matchedPOs = query
    ? pos.filter(
        (p) =>
          safeLower(p.poNumber).includes(query) ||
          safeLower(p.id).includes(query) ||
          safeLower(p.vendor).includes(query) ||
          safeLower(p.category).includes(query)
      )
    : [];

  const matchedCategories: { groupTitle: string; name: string }[] = [];
  if (query) {
    categoryGroups.forEach((group) => {
      if (group && Array.isArray(group.items)) {
        group.items.forEach((catItem) => {
          if (
            safeLower(catItem).includes(query) ||
            safeLower(group.title).includes(query)
          ) {
            if (!matchedCategories.some((c) => c.name === catItem)) {
              matchedCategories.push({ groupTitle: group.title || '', name: catItem });
            }
          }
        });
      }
    });
  }

  const totalMatches =
    matchedDevices.length +
    matchedSims.length +
    matchedTickets.length +
    matchedPOs.length +
    matchedCategories.length;

  const handleSelect = (
    type: 'device' | 'sim' | 'ticket' | 'po' | 'category',
    item: any
  ) => {
    setIsOpen(false);
    if (onNavigateToResult) {
      onNavigateToResult(type, item);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-50 shrink-0 w-full transition-colors duration-200">
      <div className="flex items-center space-x-3">
        {appLogo ? (
          <img
            src={appLogo}
            alt={appName}
            className="w-8 h-8 rounded-lg object-contain bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 p-0.5 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Box className="text-indigo-600 dark:text-indigo-500 w-7 h-7 shrink-0" />
        )}
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
            {appName || 'BBL DM System'}
          </h1>
        </div>
      </div>

      {/* Global Search Container */}
      <div ref={containerRef} className="flex-1 max-w-xl mx-6 hidden md:block relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
            placeholder="Global Search: Device ID, SOL, SIM, Ticket, PO, Branch..."
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-full py-2 pl-10 pr-9 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Overlay */}
        {showResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header Summary */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/90 text-xs font-semibold text-slate-600 dark:text-slate-400 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
              <span>
                Global Search Results ({totalMatches} {totalMatches === 1 ? 'match' : 'matches'})
              </span>
              {searchQuery && (
                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
                  Query: "{searchQuery}"
                </span>
              )}
            </div>

            {/* Results Content List */}
            <div className="overflow-y-auto p-2 space-y-3">
              {totalMatches === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No matching records found</p>
                  <p className="text-[11px] text-slate-500">
                    Try searching with Device ID, SOL, SIM Number, Ticket No, or Branch name.
                  </p>
                </div>
              ) : (
                <>
                  {/* DEVICES MATCHES */}
                  {matchedDevices.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Devices ({matchedDevices.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedDevices.slice(0, 5).map((dev) => (
                          <div
                            key={dev.id}
                            onClick={() => handleSelect('device', dev)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-slate-200/60 dark:border-transparent hover:border-indigo-400 dark:hover:border-indigo-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">
                                  {dev.id || (dev as any).deviceId}
                                </span>
                                {dev.sol && (
                                  <span className="bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 text-[10px] rounded font-mono">
                                    SOL: {dev.sol}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] rounded font-sans font-medium ${
                                    dev.status === 'LIVE'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/50'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700/50'
                                  }`}
                                >
                                  {dev.status || 'LIVE'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                                <span>{dev.category || 'N/A'}</span>
                                {dev.location && (
                                  <>
                                    <span>•</span>
                                    <span>{dev.location}</span>
                                  </>
                                )}
                                {dev.sim && dev.sim !== '-' && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                      SIM: {dev.sim}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BRANCHES / CATEGORIES MATCHES */}
                  {matchedCategories.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>Branches & Categories ({matchedCategories.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedCategories.slice(0, 5).map((cat) => (
                          <div
                            key={cat.name}
                            onClick={() => handleSelect('category', cat.name)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-slate-200/60 dark:border-transparent hover:border-amber-400 dark:hover:border-amber-500/30"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-amber-700 dark:text-amber-300">{cat.name}</span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                                Group: {cat.groupTitle}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SIM MATCHES */}
                  {matchedSims.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SIM Cards ({matchedSims.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedSims.slice(0, 5).map((sim) => (
                          <div
                            key={sim.id}
                            onClick={() => handleSelect('sim', sim)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-slate-200/60 dark:border-transparent hover:border-emerald-400 dark:hover:border-emerald-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                  {sim.simNumber}
                                </span>
                                {sim.operator && (
                                  <span className="bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 text-[10px] rounded">
                                    {sim.operator}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                                <span>Device: {sim.assignedDevice || 'Unassigned'}</span>
                                {sim.location && (
                                  <>
                                    <span>•</span>
                                    <span>Loc: {sim.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TICKETS MATCHES */}
                  {matchedTickets.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Service Tickets ({matchedTickets.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedTickets.slice(0, 5).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleSelect('ticket', t)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-slate-200/60 dark:border-transparent hover:border-rose-400 dark:hover:border-rose-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                                  {t.id || (t as any).ticketNo}
                                </span>
                                {t.deviceId && (
                                  <span className="text-[10px] bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                    Dev: {t.deviceId}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] rounded font-sans font-medium ${
                                    t.status === 'OPEN'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700/50'
                                      : t.status === 'WORKING' || t.status === 'ASSIGNED'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/50'
                                  }`}
                                >
                                  {t.status || 'OPEN'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                                {t.subject || (t as any).issue || t.issueType || 'Ticket Details'}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PURCHASE ORDERS MATCHES */}
                  {matchedPOs.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Purchase Orders ({matchedPOs.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedPOs.slice(0, 5).map((po) => (
                          <div
                            key={po.id}
                            onClick={() => handleSelect('po', po)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-slate-200/60 dark:border-transparent hover:border-cyan-400 dark:hover:border-cyan-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
                                  {po.poNumber || po.id}
                                </span>
                                {po.vendor && (
                                  <span className="text-[10px] bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                    {po.vendor}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                                <span>{po.category || 'PO Item'}</span>
                                {po.qty !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span>Qty: {po.qty}</span>
                                  </>
                                )}
                                {po.totalPrice && (
                                  <>
                                    <span>•</span>
                                    <span>{po.totalPrice}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-2.5 text-xs">
        {/* Professional Theme Toggle Dropdown */}
        <div ref={themeMenuRef} className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            title={`Active Theme: ${theme.toUpperCase()} (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
          >
            {theme === 'system' ? (
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden sm:inline font-medium text-[11px]">
              {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 text-xs animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Appearance
              </div>
              <button
                onClick={() => {
                  setTheme('light');
                  setThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => {
                  setTheme('dark');
                  setThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => {
                  setTheme('system');
                  setThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition cursor-pointer ${
                  theme === 'system'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                <span>System Auto</span>
              </button>
            </div>
          )}
        </div>

        <span className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 px-2.5 py-1 rounded font-mono font-medium">
          Role: Admin
        </span>
        <button
          onClick={onLogout}
          className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/40 dark:hover:bg-rose-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded transition flex items-center gap-1 cursor-pointer font-medium"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </header>
  );
};
