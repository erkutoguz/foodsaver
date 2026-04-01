import { StyleSheet } from "react-native";
import {  ScreenShell } from "../components/ScreenShell";
import { colors } from "../theme/colors";

export function HomeScreen() {
  return (
    <ScreenShell
      eyebrow=""
      title="FoodSaver"
      description=""
    >
     
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8
  },
  item: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  }
});
