// mobile/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 型定義
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_owner: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  schools: number[];
  current_school: number | null;
  current_school_name: string | null;
  date_joined: string;
}

interface AuthResult {
  success: boolean;
  message: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  teacherLogin: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  isAuthenticated: () => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const BASE_URL = "http://127.0.0.1:8000/api"; // DjangoサーバーのベースURL

  // 初期化時にストレージからユーザー情報を取得
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData) as User);
        }
      } catch (error) {
        console.error("認証の初期化エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // CSRFトークンを取得
  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const response = await fetch(`${BASE_URL}/account/csrf/`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error("CSRFトークンの取得エラー:", error);
      return null;
    }
  };

  // 講師ログイン
  const teacherLogin = async (
    username: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      setLoading(true);

      // CSRFトークンを取得
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        return { success: false, message: "CSRFトークンの取得に失敗しました" };
      }

      const response = await fetch(`${BASE_URL}/account/teacher-login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ログイン成功
        const userData = data.user as User;
        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        return {
          success: true,
          message: data.message || "ログインに成功しました",
        };
      } else {
        // ログイン失敗
        return {
          success: false,
          message: data.error || data.message || "ログインに失敗しました",
        };
      }
    } catch (error) {
      console.error("ログインエラー:", error);
      return { success: false, message: "ネットワークエラーが発生しました" };
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async (): Promise<AuthResult> => {
    try {
      setLoading(true);

      // サーバーへのログアウトリクエスト（失敗してもローカルはクリア）
      try {
        const csrfToken = await getCSRFToken();
        await fetch(`${BASE_URL}/account/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken || "",
          },
          credentials: "include",
        });
      } catch (serverError) {
        console.log("サーバーログアウトエラー（無視）:", serverError);
      }

      // ローカル状態をクリア
      setUser(null);
      await AsyncStorage.removeItem("user");
      return { success: true, message: "ログアウトしました" };
    } catch (error) {
      console.error("ログアウトエラー:", error);
      // エラーが発生してもローカルの状態はクリアする
      setUser(null);
      await AsyncStorage.removeItem("user");
      return { success: true, message: "ログアウトしました" };
    } finally {
      setLoading(false);
    }
  };

  // 認証状態をチェック
  const isAuthenticated = (): boolean => {
    return user !== null && user.is_teacher === true;
  };

  const value: AuthContextType = {
    user,
    loading,
    teacherLogin,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
