// mobile/app/_layout.tsx

import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import ProtectedRoute from "../components/ProtectedRoute";
import ToastContainer from "@/components/common/Toast";

export default function RootLayout(): React.JSX.Element {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProtectedRoute>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <ToastContainer />
        </ProtectedRoute>
      </AuthProvider>
    </ToastProvider>
  );
}
