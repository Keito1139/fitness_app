// mobile/app/(tabs)/profile.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function ProfileScreen(): React.JSX.Element {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLogoutModalVisible, setIsLogoutModalVisible] =
    useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const router = useRouter();

  const handleLogoutPress = (): void => {
    setIsLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      const result = await logout();
      if (result.success) {
        showSuccess(result.message);
        setIsLogoutModalVisible(false);
        router.replace("/login");
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError("ログアウトに失敗しました。");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = (): void => {
    setIsLogoutModalVisible(false);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#007AFF" />
          </View>
          <Text style={styles.name}>
            {user?.first_name && user?.last_name
              ? `${user.last_name} ${user.first_name}`
              : user?.username || "名前未設定"}
          </Text>
          <Text style={styles.role}>講師</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          <View style={styles.infoItem}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.infoLabel}>ユーザー名</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color="#666" />
            <Text style={styles.infoLabel}>メールアドレス</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="school" size={20} color="#666" />
            <Text style={styles.infoLabel}>現在の学校</Text>
            <Text style={styles.infoValue}>
              {user?.current_school_name || "設定されていません"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoLabel}>登録日</Text>
            <Text style={styles.infoValue}>
              {user?.date_joined
                ? new Date(user.date_joined).toLocaleDateString("ja-JP")
                : "不明"}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={isLogoutModalVisible}
        title="ログアウト確認"
        message="アプリからログアウトしますか？"
        confirmText="ログアウト"
        cancelText="キャンセル"
        confirmButtonColor="#ff3b30"
        isLoading={isLoggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  profileHeader: {
    backgroundColor: "#fff",
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: "#666",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoSection: {
    backgroundColor: "#fff",
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  actionsSection: {
    padding: 20,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
