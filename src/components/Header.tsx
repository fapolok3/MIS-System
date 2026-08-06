import React from 'react';
import { Box, Search, LogOut } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onLogout,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-40 shrink-0 w-full">
      <div className="flex items-center space-x-3">
        <Box className="text-indigo-500 w-7 h-7" />
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">
            MIS MANAGEMENT SYSTEM
          </h1>
        </div>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Global Search: Device ID, SIM, SOL, Ticket, PO..."
            className="w-full bg-slate-800 border border-slate-700 rounded-full py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
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

