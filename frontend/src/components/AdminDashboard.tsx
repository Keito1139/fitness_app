// frontend/src/components/AdminDashboard.tsx

import React, { useState } from "react";
import {
  LogOut,
  Users,
  School,
  Settings,
  BarChart3,
  Menu,
  X,
  Shield,
  Database,
  Monitor,
  UserCog,
  Building,
  FileSpreadsheet,
} from "lucide-react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import type { User } from "../types/user";
import ConfirmModal from "./common/ConfirmModal";
import { useToast } from "../contexts/ToastContext";
import ExcelUpload from "./Upload";

interface AdminDashboardProps {
  user: User;
  onLogout: () => Promise<void>;
}

type ActiveTab =
  | "overview"
  | "users"
  | "schools"
  | "upload"
  | "analytics"
  | "system"
  | "settings";

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const navigation = [
    {
      id: "overview",
      name: "ダッシュボード",
      icon: Monitor,
      path: "/admin/overview",
    },
    {
      id: "users",
      name: "ユーザー管理",
      icon: Users,
      path: "/admin/users",
    },
    {
      id: "schools",
      name: "学校管理",
      icon: School,
      path: "/admin/schools",
    },
    {
      id: "upload",
      name: "一括アップロード",
      icon: FileSpreadsheet,
      path: "/admin/upload",
    },
    {
      id: "analytics",
      name: "分析・レポート",
      icon: BarChart3,
      path: "/admin/analytics",
    },
    {
      id: "system",
      name: "システム管理",
      icon: Database,
      path: "/admin/system",
    },
    {
      id: "settings",
      name: "設定",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
      showSuccess("ログアウトしました");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      showError("ログアウトに失敗しました");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    navigate(`/admin/${tab}`);
    setSidebarOpen(false);
  };

  // 管理ダッシュボードホーム
  const AdminHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            管理者ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2">システム全体の管理と監視</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  総ユーザー数
                </p>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-xs text-green-600">+12 今月</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <School className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">学校数</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-xs text-blue-600">+2 今月</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <UserCog className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">講師数</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
                <p className="text-xs text-green-600">+7 今月</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">オーナー数</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500">変動なし</p>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              管理者アクション
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => handleTabChange("users")}
                className="w-full flex items-center p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
              >
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">ユーザー管理</p>
                  <p className="text-sm text-gray-600">
                    全ユーザーの管理・権限設定
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("schools")}
                className="w-full flex items-center p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200"
              >
                <School className="h-5 w-5 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">学校管理</p>
                  <p className="text-sm text-gray-600">
                    学校の追加・設定・管理
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("system")}
                className="w-full flex items-center p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
              >
                <Database className="h-5 w-5 text-purple-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">システム管理</p>
                  <p className="text-sm text-gray-600">
                    バックアップ・ログ・設定
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              システム状況
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">サーバー稼働率</span>
                <span className="text-sm font-semibold text-green-600">
                  99.9%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "99.9%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  データベース使用量
                </span>
                <span className="text-sm font-semibold text-blue-600">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "68%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  アクティブセッション
                </span>
                <span className="text-sm font-semibold text-orange-600">
                  47
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // プレースホルダーページ
  const PlaceholderPage = ({
    title,
    icon: Icon,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">この機能は開発中です</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* デスクトップサイドバー */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-sm border-r border-gray-200/50">
            {/* ヘッダー */}
            <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">管理者画面</h1>
            </div>

            {/* ユーザー情報 */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.last_name?.charAt(0) ||
                      user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">
                  {user.last_name && user.first_name
                    ? `${user.last_name} ${user.first_name}`
                    : user.username}
                </p>
                <p className="text-xs text-red-600 font-medium">
                  {user.is_superuser ? "スーパー管理者" : "管理者"}
                </p>
              </div>
            </div>

            {/* ナビゲーション */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as ActiveTab)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* ログアウト */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="mr-3 h-5 w-5" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* モバイルヘッダー */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.id === activeTab)?.name}
            </h1>
            <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/admin/overview" replace />}
            />
            <Route path="/overview" element={<AdminHome />} />
            <Route
              path="/users"
              element={<PlaceholderPage title="ユーザー管理" icon={Users} />}
            />
            <Route
              path="/schools"
              element={<PlaceholderPage title="学校管理" icon={School} />}
            />
            <Route path="/upload" element={<ExcelUpload />} />
            <Route
              path="/analytics"
              element={
                <PlaceholderPage title="分析・レポート" icon={BarChart3} />
              }
            />
            <Route
              path="/system"
              element={<PlaceholderPage title="システム管理" icon={Database} />}
            />
            <Route
              path="/settings"
              element={<PlaceholderPage title="設定" icon={Settings} />}
            />
          </Routes>
        </main>
      </div>

      {/* モバイルサイドバー */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col max-w-xs w-full bg-white/90 backdrop-blur-sm">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* モバイル用ナビゲーション */}
            <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">管理者画面</h1>
            </div>

            <div className="flex items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.last_name?.charAt(0) ||
                      user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">
                  {user.last_name && user.first_name
                    ? `${user.last_name} ${user.first_name}`
                    : user.username}
                </p>
                <p className="text-xs text-red-600 font-medium">管理者</p>
              </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as ActiveTab)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="mr-3 h-5 w-5" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ログアウト確認モーダル */}
      {showLogoutModal && (
        <ConfirmModal
          isOpen={showLogoutModal}
          title="ログアウト"
          message="管理者セッションを終了しますか？"
          confirmText="ログアウト"
          cancelText="キャンセル"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
          confirmButtonColor="#ef4444"
          isLoading={isLoggingOut}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
