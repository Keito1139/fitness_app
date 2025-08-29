// frontend/src/components/common/LoadingSpinner.tsx

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "green" | "red" | "purple" | "gray" | "white";
  text?: string;
  className?: string;
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "blue",
  text = "読み込み中...",
  className = "",
  showText = true,
}) => {
  // サイズマッピング
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  // カラーマッピング
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
    white: "text-white",
  };

  // テキストサイズマッピング
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2
          className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        />
        {showText && text && (
          <p
            className={`font-medium ${colorClasses[color]} ${textSizeClasses[size]}`}
          >
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

// プリセットコンポーネント

// インラインローディング（ボタン内など）
export const InlineSpinner: React.FC<{
  size?: "sm" | "md";
  color?: "blue" | "green" | "red" | "purple" | "gray" | "white";
}> = ({ size = "sm", color = "white" }) => (
  <Loader2
    className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
  />
);

// ページローディング（フルスクリーン）
export const PageSpinner: React.FC<{
  text?: string;
  background?: "transparent" | "white" | "gray";
}> = ({ text = "読み込み中...", background = "gray" }) => {
  const backgroundClasses = {
    transparent: "bg-transparent",
    white: "bg-white",
    gray: "bg-gray-50",
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${backgroundClasses[background]}`}
    >
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
};

// オーバーレイローディング
export const OverlaySpinner: React.FC<{
  text?: string;
  blur?: boolean;
}> = ({ text = "処理中...", blur = true }) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center ${
      blur ? "bg-black/50 backdrop-blur-sm" : "bg-black/20"
    }`}
  >
    <div className="bg-white rounded-2xl p-8 shadow-2xl">
      <LoadingSpinner size="lg" text={text} />
    </div>
  </div>
);

// カードローディング
export const CardSpinner: React.FC<{
  text?: string;
  height?: string;
}> = ({ text = "読み込み中...", height = "h-64" }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center ${height}`}
  >
    <LoadingSpinner text={text} />
  </div>
);

// ボタンローディング
export const ButtonSpinner: React.FC<{
  text?: string;
  color?: "blue" | "green" | "red" | "purple" | "gray" | "white";
}> = ({ text = "処理中...", color = "white" }) => (
  <div className="flex items-center">
    <InlineSpinner size="sm" color={color} />
    {text && <span className="ml-2">{text}</span>}
  </div>
);

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const colorClasses = {
  blue: "text-blue-600",
  green: "text-green-600",
  red: "text-red-600",
  purple: "text-purple-600",
  gray: "text-gray-600",
  white: "text-white",
};

export default LoadingSpinner;
