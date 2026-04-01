import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        isDisabled && styles.buttonDisabled,
        pressed && styles.buttonPressed
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "secondary" ? colors.ink : "#ffffff"}
          />
        ) : null}
        <Text style={[styles.label, variant === "secondary" && styles.labelSecondary]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: colors.brand
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  buttonPressed: {
    opacity: 0.88
  },
  buttonDisabled: {
    opacity: 0.7
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700"
  },
  labelSecondary: {
    color: colors.ink
  }
});
