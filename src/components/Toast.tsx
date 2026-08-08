import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'success';

  const bgColor =
    type === 'success'
      ? 'bg-emerald-600 border-emerald-500 text-white'
      : type === 'error'
      ? 'bg-rose-600 border-rose-500 text-white'
      : 'bg-indigo-600 border-indigo-500 text-white';

  const Icon =
    type === 'success'
      ? CheckCircle2
      : type === 'error'
      ? AlertCircle
      : Info;

  return (
    <div className="fixed top-5 right-5 z-[150] max-w-sm w-full animate-bounce-in transition-all">
      <div
        className={`flex items-center justify-between p-3.5 rounded-xl border shadow-2xl font-sans text-xs ${bgColor}`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold tracking-wide truncate">
            {toast.message}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded hover:bg-black/10 cursor-pointer transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
