import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Info,
  CheckCircle,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  highlightText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmationType;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  highlightText,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconBg: isDark ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40',
      highlightBg: isDark ? 'bg-red-950/40 border-red-800/40 text-red-200' : 'bg-red-50 border-red-200 text-red-900',
    },
    warning: {
      icon: ShieldAlert,
      iconBg: isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600',
      confirmBtn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40',
      highlightBg: isDark ? 'bg-amber-950/40 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900',
    },
    info: {
      icon: Info,
      iconBg: isDark ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600',
      confirmBtn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-950/40',
      highlightBg: isDark ? 'bg-sky-950/40 border-sky-800/40 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900',
    },
    success: {
      icon: CheckCircle,
      iconBg: isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40',
      highlightBg: isDark ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
  }[type];

  const IconComponent = typeConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="confirm-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            key="confirm-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && onClose()}
            className="fixed inset-0 bg-black/75"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-md rounded-2xl ${
              isDark
                ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl'
                : 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
            } p-5 sm:p-6 z-10`}
          >
            {/* Close icon */}
            <button
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close dialog"
              className={`absolute top-4 right-4 p-1.5 rounded-xl ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              } transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header & Icon */}
            <div className="flex items-start gap-3.5 mb-4">
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${typeConfig.iconBg}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 pr-6">
                <h3 id="modal-title" className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-snug`}>
                  {title}
                </h3>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1 leading-relaxed`}>
                  {message}
                </p>
              </div>
            </div>

            {/* Optional Highlight text box */}
            {highlightText && (
              <div
                className={`mb-5 p-3 rounded-xl border text-xs font-mono break-all font-semibold flex items-center gap-2 ${typeConfig.highlightBg}`}
              >
                <span className="truncate">{highlightText}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/60 dark:border-slate-800/60 border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                } transition-colors`}
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await onConfirm();
                }}
                disabled={isLoading}
                className={`min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${typeConfig.confirmBtn} ${
                  isLoading ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                <span>{confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
