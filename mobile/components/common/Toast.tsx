// mobile/components/common/Toast.tsx

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToast, ToastType } from "@/contexts/ToastContext";

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, message, type, onHide }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 表示アニメーション
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      // 非表示アニメーション
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }, []);

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#4CAF50",
          iconName: "checkmark-circle" as const,
          iconColor: "#fff",
        };
      case "error":
        return {
          backgroundColor: "#f44336",
          iconName: "close-circle" as const,
          iconColor: "#fff",
        };
      case "warning":
        return {
          backgroundColor: "#ff9800",
          iconName: "warning" as const,
          iconColor: "#fff",
        };
      case "info":
        return {
          backgroundColor: "#2196F3",
          iconName: "information-circle" as const,
          iconColor: "#fff",
        };
      default:
        return {
          backgroundColor: "#333",
          iconName: "information-circle" as const,
          iconColor: "#fff",
        };
    }
  };

  const toastStyle = getToastStyle();

  const handlePress = () => {
    onHide(id);
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: toastStyle.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={toastStyle.iconName}
            size={20}
            color={toastStyle.iconColor}
          />
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handlePress}>
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ToastContainer(): React.JSX.Element {
  const { toasts, hideToast } = useToast();

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      ))}
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toastContainer: {
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    minHeight: 48,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});
