"use client";

import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
      {toasts.map((t) => {
        const isSuccess = t.variant === "success";
        const isDestructive = t.variant === "destructive";

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all transform translate-y-0 ${
              isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : isDestructive
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : isDestructive ? (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.description && <p className="text-xs opacity-90 mt-0.5">{t.description}</p>}
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
