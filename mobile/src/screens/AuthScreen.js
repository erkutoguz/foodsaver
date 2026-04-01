import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { FormField } from "../components/FormField";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

export function AuthScreen({ navigation, route }) {
  const mode = route.params?.mode === "register" ? "register" : "login";
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "register" && trimmedFullName.length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await register({
          fullName: trimmedFullName,
          email: normalizedEmail,
          password
        });
      } else {
        await login({
          email: normalizedEmail,
          password
        });
      }
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModeSwitch() {
    setErrorMessage("");
    navigation.setParams({
      mode: mode === "register" ? "login" : "register"
    });
  }

  return (
    <ScreenShell
      scrollable
      eyebrow={mode === "register" ? "WELCOME" : "LOGIN"}
      title={mode === "register" ? "Create your account" : "Sign in to your account"}
      description="Enter your details to continue. This screen now talks to the real backend auth endpoints."
    >
      <InfoCard title={mode === "register" ? "Create your details" : "Enter your details"}>
        <View style={styles.list}>
          {mode === "register" ? (
            <FormField
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />
          ) : null}

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoComplete={mode === "register" ? "new-password" : "password"}
            textContentType={mode === "register" ? "newPassword" : "password"}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>
      </InfoCard>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label={mode === "register" ? "Create account" : "Sign in"}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />

      <View style={styles.switchRow}>
        <Text style={styles.note}>
          {mode === "register" ? "Already have an account?" : "Don't have an account yet?"}
        </Text>
        <Pressable onPress={handleModeSwitch}>
          <Text style={styles.linkText}>
            {mode === "register" ? "Sign in" : "Create one"}
          </Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14
  },
  errorBox: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff1ed",
    borderWidth: 1,
    borderColor: "#fdba74"
  },
  errorText: {
    color: colors.tomato,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600"
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  note: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 20
  },
  linkText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  }
});
