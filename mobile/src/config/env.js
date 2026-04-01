import { Platform } from "react-native";

let apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiBaseUrl) {
  if (Platform.OS === "android") {
    apiBaseUrl = "http://10.0.2.2:4000";
  } else {
    apiBaseUrl = "http://localhost:4000";
  }
}

apiBaseUrl = apiBaseUrl.trim().replace(/\/+$/, "");

export { apiBaseUrl };
