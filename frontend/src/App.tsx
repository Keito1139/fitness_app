// src/App.tsx

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import { ToastProvider } from "./contexts/ToastContext";
import ToastContainer from "./components/common/ToastContainer";
import api from "./services/api";
import type { User } from "./types/user";

function App(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const response = await api.get<User>("/account/profile/");
      setUser(response.data);
    } catch (error: unknown) {
      // 403エラーは正常な未認証状態なので、エラーログを出さない
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          console.log("User not authenticated - redirecting to login");
        } else {
          // その他のエラー（500、ネットワークエラーなど）のみログ出力
          console.error("Authentication check failed:", error);
        }
      } else {
        console.error("Authentication check failed:", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User): void => {
    setUser(userData);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      // サーバーサイドでセッションを削除
      await api.post("/account/logout/");
    } catch (error: unknown) {
      // ログアウトエラーでもクライアントサイドの状態は更新
      console.error("Logout failed:", error);
    } finally {
      // クライアントサイドの状態を更新
      setUser(null);
      // セッションクッキーをクリア
      document.cookie =
        "sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  };

  // ユーザーの権限に基づいてリダイレクト先を決定
  const getRedirectPath = (user: User): string => {
    if (user.is_superuser) {
      return "/admin/overview";
    } else if (user.is_owner) {
      return "/dashboard/overview";
    }
    // その他の場合は一般ダッシュボードにリダイレクト
    return "/dashboard/overview";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div
              className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-gray-600 font-medium">システムを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div>
          <Routes>
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={getRedirectPath(user)} replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />

            {/* 管理者画面 */}
            <Route
              path="/admin/*"
              element={
                user && user.is_superuser ? (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                ) : user ? (
                  <Navigate to="/dashboard/overview" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* オーナー画面 */}
            <Route
              path="/dashboard/*"
              element={
                user ? (
                  user.is_superuser ? (
                    <Navigate to="/admin/overview" replace />
                  ) : (
                    <Dashboard user={user} onLogout={handleLogout} />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* ルートパス */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={getRedirectPath(user)} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;
