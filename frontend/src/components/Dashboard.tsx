// frontend/src/components/Dashboard.tsx

import React, { useState, useEffect } from "react";
import {
  LogOut,
  Users,
  School,
  Settings,
  BarChart3,
  Menu,
  X,
  Home,
  Calendar,
} from "lucide-react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import type { User } from "../types/user";
import TeacherManagement from "./teacher/TeacherManagement";
import ShiftManagement from "./fixedShift/FixedShiftManagement";
import ToastContainer from "./common/ToastContainer";
import { ToastProvider } from "../contexts/ToastContext";
import ConfirmModal from "./common/ConfirmModal";

interface DashboardProps {
  user: User;
  onLogout: () => Promise<void>;
}

type ActiveTab = "overview" | "teachers" | "schools" | "analytics" | "settings";

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    {
      id: "overview",
      name: "ダッシュボード",
      icon: Home,
      path: "/dashboard/overview",
    },
    {
      id: "teachers",
      name: "講師管理",
      icon: Users,
      path: "/dashboard/teachers",
    },
    {
      id: "schools",
      name: "学校管理",
      icon: School,
      path: "/dashboard/schools",
    },
    {
      id: "analytics",
      name: "分析",
      icon: BarChart3,
      path: "/dashboard/analytics",
    },
    {
      id: "settings",
      name: "設定",
      icon: Settings,
      path: "/dashboard/settings",
    },
    {
      id: "shifts",
      name: "シフト管理",
      icon: Calendar,
      path: "/dashboard/shifts",
    },
  ];

  // URLと状態を同期
  useEffect(() => {
    const path = location.pathname.split("/").pop() || "overview";
    if (
      ["overview", "teachers", "schools", "analytics", "settings"].includes(
        path
      )
    ) {
      setActiveTab(path as ActiveTab);
    }
  }, [location]);

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error("ログアウトエラー:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  // ナビゲーション処理
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    navigate(`/dashboard/${tab}`);
    setSidebarOpen(false); // モバイルでサイドバーを閉じる
  };

  // ダッシュボードホームコンポーネント
  const DashboardHome = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600">オーナー管理システムへようこそ</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総講師数</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <School className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">学校数</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  今月の新規講師
                </p>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  アクティブ講師
                </p>
                <p className="text-2xl font-semibold text-gray-900">22</p>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleTabChange("teachers")}
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
            >
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">講師管理</p>
                <p className="text-sm text-gray-600">講師の追加・編集・管理</p>
              </div>
            </button>

            <button
              onClick={() => handleTabChange("schools")}
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors duration-200"
            >
              <School className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">学校管理</p>
                <p className="text-sm text-gray-600">学校の設定・管理</p>
              </div>
            </button>

            <button
              onClick={() => handleTabChange("analytics")}
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors duration-200"
            >
              <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">分析</p>
                <p className="text-sm text-gray-600">統計・レポート</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // プレースホルダーコンポーネント
  const PlaceholderPage = ({
    title,
    icon: Icon,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-gray-600">{title}機能は開発中です</p>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100">
        {/* サイドバー (デスクトップ) */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
              {/* ヘッダー */}
              <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-900">
                  オーナー管理
                </h1>
              </div>

              {/* ユーザー情報 */}
              <div className="flex items-center px-6 py-4 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.last_name?.charAt(0) ||
                        user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.last_name && user.first_name
                      ? `${user.last_name} ${user.first_name}`
                      : user.username}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
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
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === item.id
                          ? "bg-blue-100 text-blue-700"
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
                  onClick={() => setShowLogoutModal(true)} // 変更
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* モバイルサイドバー */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex flex-col max-w-xs w-full bg-white">
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
                <h1 className="text-xl font-semibold text-gray-900">
                  オーナー管理
                </h1>
              </div>

              <div className="flex items-center px-6 py-4 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.last_name?.charAt(0) ||
                        user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.last_name && user.first_name
                      ? `${user.last_name} ${user.first_name}`
                      : user.username}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as ActiveTab)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === item.id
                          ? "bg-blue-100 text-blue-700"
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
                  onClick={() => setShowLogoutModal(true)} // 変更
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* モバイルヘッダー */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">
                {navigation.find((item) => item.id === activeTab)?.name}
              </h1>
              <div></div>
            </div>
          </div>

          {/* メインコンテンツエリア */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/dashboard/overview" replace />}
              />
              <Route path="/overview" element={<DashboardHome />} />
              <Route path="/teachers" element={<TeacherManagement />} />
              <Route path="/shifts" element={<ShiftManagement user={user} />} />
              <Route
                path="/schools"
                element={<PlaceholderPage title="学校管理" icon={School} />}
              />
              <Route
                path="/analytics"
                element={<PlaceholderPage title="分析" icon={BarChart3} />}
              />
              <Route
                path="/settings"
                element={<PlaceholderPage title="設定" icon={Settings} />}
              />
            </Routes>
          </main>
        </div>
      </div>

      {/* Toast通知 */}
      <ToastContainer />
      {showLogoutModal && (
        <ConfirmModal
          isOpen={showLogoutModal}
          title="ログアウト"
          message="ログアウトしますか？"
          confirmText="ログアウト"
          cancelText="キャンセル"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
          confirmButtonColor="#ef4444"
        />
      )}
    </ToastProvider>
  );
};

export default Dashboard;
