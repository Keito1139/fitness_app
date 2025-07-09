// frontend/src/components/common/ToastContainer.tsx

import React, { useEffect, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useToast, type ToastType } from "../../contexts/ToastContext";

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, message, type, onHide }) => {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // アニメーション用のクラスを追加
    if (toastRef.current) {
      setTimeout(() => {
        toastRef.current?.classList.add("translate-x-0");
        toastRef.current?.classList.remove("translate-x-full");
      }, 10);
    }
  }, []);

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
        };
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          icon: <XCircle className="h-5 w-5 text-red-400" />,
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
        };
      case "info":
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          icon: <Info className="h-5 w-5 text-blue-400" />,
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          icon: <Info className="h-5 w-5 text-gray-400" />,
        };
    }
  };

  const config = getToastConfig();

  const handleClose = () => {
    if (toastRef.current) {
      toastRef.current.classList.add("translate-x-full");
      toastRef.current.classList.remove("translate-x-0");
      setTimeout(() => onHide(id), 300);
    }
  };

  return (
    <div
      ref={toastRef}
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        transform translate-x-full transition-transform duration-300 ease-in-out
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border
        ring-1 ring-black ring-opacity-5 mb-4
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{config.icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium leading-5">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`
                inline-flex text-gray-400 hover:text-gray-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                rounded-md transition-colors duration-200
              `}
              onClick={handleClose}
            >
              <span className="sr-only">閉じる</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onHide={hideToast}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
