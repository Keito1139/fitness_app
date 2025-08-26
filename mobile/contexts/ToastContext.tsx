// mobile/contexts/ToastContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const showToast = (
    message: string,
    type: ToastType,
    duration: number = 3000
  ): void => {
    const id = generateId();
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    // 自動的に削除
    setTimeout(() => {
      hideToast(id);
    }, duration);
  };

  const hideToast = (id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // 便利なメソッド
  const showSuccess = (message: string, duration?: number): void => {
    showToast(message, "success", duration);
  };

  const showError = (message: string, duration?: number): void => {
    showToast(message, "error", duration);
  };

  const showInfo = (message: string, duration?: number): void => {
    showToast(message, "info", duration);
  };

  const showWarning = (message: string, duration?: number): void => {
    showToast(message, "warning", duration);
  };

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
