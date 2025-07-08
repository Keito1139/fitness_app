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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
