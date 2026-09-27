import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  lang: 'en' | 'ar';
  type?: 'danger' | 'warning' | 'success' | 'error';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  lang,
  type = 'danger'
}) => {
  const isRtl = lang === 'ar';
  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-y-auto">
          {/* Overlay Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel || onConfirm}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 text-start space-y-4 z-50 overflow-hidden"
          >
            {/* Header / Accent Bar */}
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className={`flex items-center gap-2 pt-2 border-t border-slate-100 ${isRtl ? 'justify-start' : 'justify-end'}`}>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'en' ? "Cancel" : "إلغاء"}
                </button>
              )}
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 text-xs font-bold text-white shadow-md rounded-xl transition-colors cursor-pointer ${
                  isSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                }`}
              >
                {onCancel ? (lang === 'en' ? "Confirm" : "تأكيد") : (lang === 'en' ? "Close" : "إغلاق")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
