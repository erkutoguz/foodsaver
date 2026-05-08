import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, "");
  }

  // In Expo Go / dev builds the dev-server host is available at runtime.
  // hostUri looks like "192.168.77.23:8081" — strip the port and use 4000.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:4000`;
  }

  // Android emulator always reaches the host machine via 10.0.2.2.
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
}

export const apiBaseUrl = resolveApiBaseUrl();
