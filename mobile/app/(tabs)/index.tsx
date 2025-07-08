// mobile/app/(tabs)/index.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function HomeScreen(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>講師ホーム</Text>
      <Text style={styles.subtitle}>
        ようこそ、{user?.first_name || user?.username}さん！
      </Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          現在の学校: {user?.current_school_name || "設定されていません"}
        </Text>
        <Text style={styles.infoText}>メールアドレス: {user?.email}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: "#666",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
});
