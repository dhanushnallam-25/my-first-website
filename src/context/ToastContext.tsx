import React, { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'info' | 'warning' | 'success' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextType>(
    () => ({
      showToast: (type, title, message) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [{ id, type, title, message }, ...prev].slice(0, 4));
        window.setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4200);
      },
    }),
    [],
  );

  const styles: Record<ToastType, { icon: React.ReactNode; className: string }> = {
    info: { icon: <Info className="h-4 w-4" />, className: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
    warning: { icon: <AlertTriangle className="h-4 w-4" />, className: 'border-amber-100 bg-amber-50 text-amber-700' },
    success: { icon: <CheckCircle2 className="h-4 w-4" />, className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
    error: { icon: <AlertTriangle className="h-4 w-4" />, className: 'border-rose-100 bg-rose-50 text-rose-700' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed right-4 top-4 z-[70] space-y-2 w-[min(22rem,calc(100vw-2rem))]">
        {toasts.map(toast => (
          <div key={toast.id} className={`rounded-2xl border p-3 shadow-xl backdrop-blur bg-white ${styles[toast.type].className}`}>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">{styles[toast.type].icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-tight">{toast.title}</p>
                {toast.message && <p className="text-2xs mt-0.5 leading-normal opacity-85">{toast.message}</p>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
                className="p-0.5 rounded-md hover:bg-white/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
