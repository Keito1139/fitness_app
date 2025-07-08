// src/components/Dashboard.tsx

import React from "react";
import type { User } from "../types/user";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const handleLogout = (): void => {
    onLogout();
  };

  const getUserRole = (): string => {
    if (user.is_owner) return "オーナー";
    if (user.is_teacher) return "教師";
    if (user.is_admin) return "管理者";
    return "ユーザー";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ようこそ、{user.last_name} {user.first_name}さん
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    基本情報
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        ユーザー名:
                      </span>
                      <span className="text-sm text-gray-900">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        メールアドレス:
                      </span>
                      <span className="text-sm text-gray-900">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        権限:
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getUserRole()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    学校情報
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        現在の学校:
                      </span>
                      <span className="text-sm text-gray-900">
                        {user.current_school_name || "未設定"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        登録日:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatDate(user.date_joined)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                機能メニュー
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.is_owner && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      オーナー機能
                    </h4>
                    <p className="text-sm text-gray-600">
                      学校の管理や設定を行えます
                    </p>
                  </div>
                )}
                {user.is_teacher && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      教師機能
                    </h4>
                    <p className="text-sm text-gray-600">
                      授業や生徒の管理を行えます
                    </p>
                  </div>
                )}
                {user.is_admin && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      管理者機能
                    </h4>
                    <p className="text-sm text-gray-600">
                      システムの管理を行えます
                    </p>
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    プロフィール設定
                  </h4>
                  <p className="text-sm text-gray-600">個人情報の確認・変更</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
