import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export function ScreenShell({ eyebrow, title, description, children, scrollable = false }) {
  const body = (
    <View style={[styles.container, scrollable ? styles.containerScrollable : styles.containerFill]}>
      <View style={styles.hero}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 0,
    gap: 12
  },
  containerFill: {
    flex: 1
  },
  containerScrollable: {
    paddingBottom: 34
  },
  scrollContent: {
    flexGrow: 1
  },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 22,
    padding: 18,
    gap: 10
  },
  eyebrow: {
    color: "#bfd5ff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "800"
  },
  description: {
    color: "#d7e0ea",
    fontSize: 14,
    lineHeight: 20
  },
  content: {
    gap: 12
  }
});
