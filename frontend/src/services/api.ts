// src/services/api.ts

import axios, { type AxiosInstance, type AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

// Django開発サーバーのURL
const API_BASE_URL = "http://localhost:8000/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // セッションクッキーを送信
  headers: {
    "Content-Type": "application/json",
  },
});

// CSRFトークン取得関数（Cookieから取得）
const getCSRFToken = (): string | null => {
  // DjangoのCSRFトークンはcsrftokenという名前のCookieに保存される
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
};

// CSRFトークンを取得するエンドポイントを呼び出す関数
const fetchCSRFToken = async (): Promise<void> => {
  try {
    await axios.get(`${API_BASE_URL.replace("/api", "")}/account/csrf/`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("CSRF token fetch failed:", error);
  }
};

// リクエストインターセプター
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // POST, PUT, PATCH, DELETE リクエストの場合はCSRFトークンを設定
    if (
      config.method &&
      ["post", "put", "patch", "delete"].includes(config.method.toLowerCase())
    ) {
      let csrfToken = getCSRFToken();

      // CSRFトークンが存在しない場合は取得を試みる
      if (!csrfToken) {
        await fetchCSRFToken();
        csrfToken = getCSRFToken();
      }

      if (csrfToken && config.headers) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 認証エラーの場合、ログインページにリダイレクト
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
