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
} from 'lucide-react';
import { Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup } from '../types';

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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
    <header className="bg-slate-950 border-b border-slate-800 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-50 shrink-0 w-full">
      <div className="flex items-center space-x-3">
        {appLogo ? (
          <img
            src={appLogo}
            alt={appName}
            className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-700/80 p-0.5 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Box className="text-indigo-500 w-7 h-7 shrink-0" />
        )}
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">
            {appName || 'BBL DM System'}
          </h1>
        </div>
      </div>

      {/* Global Search Container */}
      <div ref={containerRef} className="flex-1 max-w-xl mx-6 hidden md:block relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4 pointer-events-none" />
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
            className="w-full bg-slate-900 border border-slate-700/80 rounded-full py-2 pl-10 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Overlay */}
        {showResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header Summary */}
            <div className="px-4 py-2.5 bg-slate-950/90 text-xs font-semibold text-slate-400 flex justify-between items-center">
              <span>
                Global Search Results ({totalMatches} {totalMatches === 1 ? 'match' : 'matches'})
              </span>
              {searchQuery && (
                <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                  Query: "{searchQuery}"
                </span>
              )}
            </div>

            {/* Results Content List */}
            <div className="overflow-y-auto p-2 space-y-3">
              {totalMatches === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-slate-300">No matching records found</p>
                  <p className="text-[11px] text-slate-500">
                    Try searching with Device ID, SOL, SIM Number, Ticket No, or Branch name.
                  </p>
                </div>
              ) : (
                <>
                  {/* DEVICES MATCHES */}
                  {matchedDevices.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-indigo-400 flex items-center space-x-1">
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Devices ({matchedDevices.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedDevices.slice(0, 5).map((dev) => (
                          <div
                            key={dev.id}
                            onClick={() => handleSelect('device', dev)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-transparent hover:border-indigo-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-indigo-300">
                                  {dev.id || (dev as any).deviceId}
                                </span>
                                {dev.sol && (
                                  <span className="bg-slate-700/60 text-slate-300 px-1.5 py-0.2 text-[10px] rounded font-mono">
                                    SOL: {dev.sol}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] rounded font-sans font-medium ${
                                    dev.status === 'LIVE'
                                      ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                                      : 'bg-rose-900/50 text-rose-300 border border-rose-700/50'
                                  }`}
                                >
                                  {dev.status || 'LIVE'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center space-x-2">
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
                                    <span className="font-mono text-emerald-400">
                                      SIM: {dev.sim}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BRANCHES / CATEGORIES MATCHES */}
                  {matchedCategories.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-amber-400 flex items-center space-x-1">
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>Branches & Categories ({matchedCategories.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedCategories.slice(0, 5).map((cat) => (
                          <div
                            key={cat.name}
                            onClick={() => handleSelect('category', cat.name)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-transparent hover:border-amber-500/30"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-amber-300">{cat.name}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                                Group: {cat.groupTitle}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SIM MATCHES */}
                  {matchedSims.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-emerald-400 flex items-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SIM Cards ({matchedSims.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedSims.slice(0, 5).map((sim) => (
                          <div
                            key={sim.id}
                            onClick={() => handleSelect('sim', sim)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-transparent hover:border-emerald-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-emerald-300">
                                  {sim.simNumber}
                                </span>
                                {sim.operator && (
                                  <span className="bg-slate-700/60 text-slate-300 px-1.5 py-0.2 text-[10px] rounded">
                                    {sim.operator}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                                <span>Device: {sim.assignedDevice || 'Unassigned'}</span>
                                {sim.location && (
                                  <>
                                    <span>•</span>
                                    <span>Loc: {sim.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TICKETS MATCHES */}
                  {matchedTickets.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-rose-400 flex items-center space-x-1">
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Service Tickets ({matchedTickets.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedTickets.slice(0, 5).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleSelect('ticket', t)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-transparent hover:border-rose-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-rose-300">
                                  {t.id || (t as any).ticketNo}
                                </span>
                                {t.deviceId && (
                                  <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.2 rounded">
                                    Dev: {t.deviceId}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] rounded font-sans font-medium ${
                                    t.status === 'OPEN'
                                      ? 'bg-rose-900/50 text-rose-300'
                                      : t.status === 'WORKING' || t.status === 'ASSIGNED'
                                      ? 'bg-amber-900/50 text-amber-300'
                                      : 'bg-emerald-900/50 text-emerald-300'
                                  }`}
                                >
                                  {t.status || 'OPEN'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-sm">
                                {t.subject || (t as any).issue || t.issueType || 'Ticket Details'}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PURCHASE ORDERS MATCHES */}
                  {matchedPOs.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] uppercase font-bold text-cyan-400 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Purchase Orders ({matchedPOs.length})</span>
                      </div>
                      <div className="space-y-1">
                        {matchedPOs.slice(0, 5).map((po) => (
                          <div
                            key={po.id}
                            onClick={() => handleSelect('po', po)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between text-xs group border border-transparent hover:border-cyan-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-cyan-300">
                                  {po.poNumber || po.id}
                                </span>
                                {po.vendor && (
                                  <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.2 rounded">
                                    {po.vendor}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center space-x-2">
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
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
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

      <div className="flex items-center space-x-3 text-xs">
        <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 rounded font-mono">
          Role: Admin
        </span>
        <button
          onClick={onLogout}
          className="bg-rose-900/40 hover:bg-rose-800 text-rose-300 border border-rose-800 px-3 py-1 rounded transition flex items-center gap-1 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </header>
  );
};
