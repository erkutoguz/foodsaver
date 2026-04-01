import { StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const firstName = user?.fullName?.split(" ")?.[0] || "there";
  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FS";

  return (
    <ScreenShell
      scrollable
      eyebrow="PROFILE"
      title={`Hi, ${firstName}`}
      description="Your account details and session actions live here. We will add favorites and history to this area next."
    >
      <InfoCard title="Your account">
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.profileText}>
            <Text style={styles.name}>{user?.fullName || "Foodsaver User"}</Text>
            <Text style={styles.email}>{user?.email || "No email found"}</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard title="What is coming here">
        <View style={styles.list}>
          <Text style={styles.item}>- Favorite recipes</Text>
          <Text style={styles.item}>- Cooking history</Text>
          <Text style={styles.item}>- Small account settings</Text>
        </View>
      </InfoCard>

      <PrimaryButton label="Sign out" variant="secondary" onPress={logout} />

      <Text style={styles.note}>
        Signing out clears the saved session on this device and takes you back to the landing screen.
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft
  },
  avatarText: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "800"
  },
  profileText: {
    flex: 1,
    gap: 4
  },
  name: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  email: {
    color: colors.slate,
    fontSize: 14
  },
  list: {
    gap: 8
  },
  item: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  note: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 20
  }
});
