// mobile/components/ProtectedRoute.tsx

import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useRouter, useSegments } from "expo-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments.some((segment) => segment === "login");

      if (!isAuthenticated() && !inAuthGroup) {
        // 未認証の場合、ログイン画面にリダイレクト
        router.replace("/login");
      } else if (isAuthenticated() && inAuthGroup) {
        // 認証済みの場合、メイン画面にリダイレクト
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
