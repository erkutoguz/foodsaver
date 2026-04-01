import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

export function PrimaryButton({ label, onPress, variant = "primary" }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        pressed && styles.buttonPressed
      ]}
    >
      <Text style={[styles.label, variant === "secondary" && styles.labelSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: colors.brand
  },
  buttonSecondary: {
    backgroundColor: "#ffffff"
  },
  buttonPressed: {
    opacity: 0.88
  },
  label: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  labelSecondary: {
    color: colors.ink
  }
});
