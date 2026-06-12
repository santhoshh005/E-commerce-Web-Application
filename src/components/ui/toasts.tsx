import React from "react";
import { useStore } from "@/context/store-context";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export function Toasts() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
          info: <Info className="h-5 w-5 text-gold-brand shrink-0" />,
        };

        const bgColors = {
          success: "border-emerald-500/20 bg-white/95 dark:bg-card/95 text-foreground shadow-[0_10px_30px_rgba(16,185,129,0.12)]",
          error: "border-red-500/20 bg-white/95 dark:bg-card/95 text-foreground shadow-[0_10px_30px_rgba(239,68,68,0.12)]",
          info: "border-gold-brand/20 bg-white/95 dark:bg-card/95 text-foreground shadow-[0_10px_30px_rgba(179,139,67,0.12)]",
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 backdrop-blur-md animate-slide-in-right ${bgColors[toast.type]}`}
          >
            <div className="flex items-center gap-3">
              {icons[toast.type]}
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-txt hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
