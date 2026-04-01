import { Platform } from "react-native";

let apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiBaseUrl) {
  if (Platform.OS === "android") {
    apiBaseUrl = "http://192.168.1.8:4000";
  } else {
    apiBaseUrl = "http://192.168.1.8:4000";
  }
}

apiBaseUrl = apiBaseUrl.trim().replace(/\/+$/, "");

export { apiBaseUrl };
