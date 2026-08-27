import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [progress, setProgress] = useState(100);
  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();
    const duration = 3200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onCloseRef.current();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [toast?.id]);

  if (!toast) return null;

  const type = toast.type || 'success';

  const config = {
    success: {
      title: 'Success',
      badgeText: 'Completed',
      cardBorder: 'border-emerald-500/40 ring-1 ring-emerald-500/20',
      glowBg: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      iconBox: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      titleColor: 'text-emerald-400',
      badgeStyle: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      progressBar: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500',
      Icon: CheckCircle2,
    },
    error: {
      title: 'Action Failed',
      badgeText: 'Error',
      cardBorder: 'border-rose-500/40 ring-1 ring-rose-500/20',
      glowBg: 'from-rose-500/10 via-pink-500/5 to-transparent',
      iconBox: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
      titleColor: 'text-rose-400',
      badgeStyle: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      progressBar: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400',
      Icon: AlertCircle,
    },
    info: {
      title: 'Notification',
      badgeText: 'Info',
      cardBorder: 'border-indigo-500/40 ring-1 ring-indigo-500/20',
      glowBg: 'from-indigo-500/10 via-blue-500/5 to-transparent',
      iconBox: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
      titleColor: 'text-indigo-400',
      badgeStyle: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      progressBar: 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-400',
      Icon: Info,
    },
  }[type];

  const { title, badgeText, cardBorder, glowBg, iconBox, titleColor, badgeStyle, progressBar, Icon } = config;

  return (
    <div className="fixed top-5 right-5 z-[250] max-w-sm w-full px-4 pointer-events-none">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.92, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, scale: 0.95, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-2xl ${cardBorder} shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all`}
          >
            {/* Ambient Background Gradient Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${glowBg} pointer-events-none`} />

            <div className="relative p-3.5 flex items-start gap-3">
              {/* Glowing Icon Badge */}
              <motion.div
                initial={{ scale: 0.4, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.05 }}
                className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${iconBox}`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>
                      {title}
                    </span>
                    {type === 'success' && (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                    {badgeText}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-100 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer shrink-0 -mt-0.5 -mr-0.5"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 h-1 overflow-hidden">
              <motion.div
                className={`h-full ${progressBar}`}
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.03 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


