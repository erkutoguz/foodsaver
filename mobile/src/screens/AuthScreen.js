import { StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { colors } from "../theme/colors";

export function AuthScreen({ route }) {
  const mode = route.params?.mode === "register" ? "register" : "login";

  return (
    <ScreenShell
      eyebrow={mode === "register" ? "WELCOME" : "LOGIN"}
      title={mode === "register" ? "Create your account" : "Sign in to your account"}
      description="We will connect the register and login flow to the real backend in the next step."
    >
      <InfoCard title="Fields coming next">
        <View style={styles.list}>
          <View style={styles.fakeInput}>
            <Text style={styles.fakeLabel}>Email</Text>
          </View>
          <View style={styles.fakeInput}>
            <Text style={styles.fakeLabel}>Password</Text>
          </View>
          {mode === "register" ? (
            <View style={styles.fakeInput}>
              <Text style={styles.fakeLabel}>Full name</Text>
            </View>
          ) : null}
        </View>
      </InfoCard>

      <PrimaryButton
        label={mode === "register" ? "Register flow coming next" : "Login flow coming next"}
      />

      <Text style={styles.note}>
        In this step we are only preparing the landing and auth flow. We will wire up
        the actual form actions next.
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10
  },
  fakeInput: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    paddingHorizontal: 14
  },
  fakeLabel: {
    color: colors.slate,
    fontSize: 14
  },
  note: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 20
  }
});
