"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "default" | "success" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    ({ duration = 4000, ...toast }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, duration, ...toast }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Fallback if not inside ToastProvider so calling code won't crash
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      toast: () => {},
    };
  }
  return {
    ...context,
    toast: context.addToast,
  };
}

export function Toaster() {
  const context = React.useContext(ToastContext);
  if (!context || context.toasts.length === 0) return null;

  const icons = {
    default: <Info className="h-4 w-4 text-[#37003C]" />,
    success: <CheckCircle2 className="h-4 w-4 text-[#00a859]" />,
    error: <AlertCircle className="h-4 w-4 text-[#E9007F]" />,
    info: <Info className="h-4 w-4 text-[#1689E8]" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4">
      {context.toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-[10px] border border-[#E5E5E5] bg-white p-4 shadow-fpl-lg animate-fpl-slide-up transition-all"
          )}
        >
          <div className="mt-0.5 shrink-0">{icons[t.type || "default"]}</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[#1F1F1F] leading-snug">{t.title}</div>
            {t.description && (
              <div className="text-xs text-[#777777] mt-0.5 leading-relaxed">{t.description}</div>
            )}
          </div>
          <button
            onClick={() => context.removeToast(t.id)}
            className="text-[#777777] hover:text-[#1F1F1F] p-1 rounded-full hover:bg-[#EEEEEE] transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
