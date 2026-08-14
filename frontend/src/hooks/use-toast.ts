"use client";

import { useState, useEffect, useCallback } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let toastState: ToastMessage[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toastState]));
}

export function toast({
  title,
  description,
  variant = "default",
}: Omit<ToastMessage, "id">) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, title, description, variant };
  toastState = [...toastState, newToast];
  notifyListeners();

  setTimeout(() => {
    toastState = toastState.filter((t) => t.id !== id);
    notifyListeners();
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(toastState);

  useEffect(() => {
    const listener = (newToasts: ToastMessage[]) => {
      setToasts(newToasts);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toastState = toastState.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}
