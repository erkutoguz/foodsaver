import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { getHistoryRequest } from "../services/history-service";
import {
  getExpiringInventoryRequest,
  getInventorySummaryRequest
} from "../services/inventory-service";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

const EXPIRING_WINDOW_DAYS = 7;

export function HomeScreen({ navigation }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(" ")?.[0] || "";
  const [summary, setSummary] = useState(null);
  const [expiringItems, setExpiringItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [summaryError, setSummaryError] = useState("");
  const [expiringError, setExpiringError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadDashboard({ refresh = false } = {}) {
    if (!token) {
      setSummary(null);
      setExpiringItems([]);
      setHistoryItems([]);
      setSummaryError("");
      setExpiringError("");
      setHistoryError("");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const [summaryResult, expiringResult, historyResult] = await Promise.allSettled([
      getInventorySummaryRequest(token, EXPIRING_WINDOW_DAYS),
      getExpiringInventoryRequest(token, EXPIRING_WINDOW_DAYS),
      getHistoryRequest(token)
    ]);

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value.summary || null);
      setSummaryError("");
    } else {
      setSummary(null);
      setSummaryError(summaryResult.reason?.message || "Could not load pantry summary.");
    }

    if (expiringResult.status === "fulfilled") {
      setExpiringItems((expiringResult.value.items || []).slice(0, 3));
      setExpiringError("");
    } else {
      setExpiringItems([]);
      setExpiringError(expiringResult.reason?.message || "Could not load urgent pantry items.");
    }

    if (historyResult.status === "fulfilled") {
      setHistoryItems((historyResult.value.history || []).slice(0, 3));
      setHistoryError("");
    } else {
      setHistoryItems([]);
      setHistoryError(historyResult.reason?.message || "Could not load cooking activity.");
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const heroTitle = firstName ? `Welcome back, ${firstName}` : "Welcome back";

  return (
    <ScreenShell
      scrollable
      eyebrow="TODAY"
      title={heroTitle}
      description="Keep an eye on your pantry, jump into recipe ideas, and stay close to the ingredients that matter today."
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadDashboard({ refresh: true })} />
      }
    >
      <InfoCard title="Quick actions" tone="accent">
        <View style={styles.actionList}>
          <PrimaryButton
            label="Generate recipe"
            onPress={() => navigation.navigate("Recipes")}
          />
          <PrimaryButton
            label="Open pantry"
            variant="secondary"
            onPress={() => navigation.navigate("Pantry")}
          />
        </View>
      </InfoCard>

      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.stateTitle}>Loading today&apos;s dashboard</Text>
          <Text style={styles.stateText}>
            We are bringing together your pantry summary, urgent items, and recent cooking activity.
          </Text>
        </View>
      ) : (
        <>
          <InfoCard title="Pantry summary">
            {summaryError ? (
              <Text style={styles.errorText}>{summaryError}</Text>
            ) : (
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{summary?.totalItems ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Total items</Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardWarm]}>
                  <Text style={styles.summaryValue}>{summary?.expiringSoonCount ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Expiring soon</Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardAlert]}>
                  <Text style={styles.summaryValue}>{summary?.expiredCount ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Expired</Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardSafe]}>
                  <Text style={styles.summaryValue}>{summary?.safeCount ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Fresh</Text>
                </View>
              </View>
            )}
          </InfoCard>

          <InfoCard title="Needs attention">
            {expiringError ? (
              <Text style={styles.errorText}>{expiringError}</Text>
            ) : expiringItems.length === 0 ? (
              <Text style={styles.emptyText}>Nothing urgent right now.</Text>
            ) : (
              <View style={styles.list}>
                {expiringItems.map((item) => (
                  <View key={item.id} style={styles.listCard}>
                    <View style={styles.listCardTop}>
                      <Text style={styles.listTitle}>{item.name}</Text>
                      <Text style={styles.listAmount}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <Text style={styles.listMeta}>
                      {getExpirationLabel(item.expirationStatus)} · {getDaysLabel(item.daysUntilExpiration)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </InfoCard>

          <InfoCard title="Recent cooking activity">
            {historyError ? (
              <Text style={styles.errorText}>{historyError}</Text>
            ) : historyItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  You have not cooked any saved recipe yet. Generate a recipe to start building your cooking history.
                </Text>
                <PrimaryButton
                  label="Generate your first recipe"
                  onPress={() => navigation.navigate("Recipes")}
                />
              </View>
            ) : (
              <View style={styles.list}>
                {historyItems.map((entry) => (
                  <View key={entry.id} style={styles.listCard}>
                    <Text style={styles.listTitle}>{entry.title}</Text>
                    <Text style={styles.listMeta}>Prompt: {entry.prompt}</Text>
                    <Text style={styles.listMeta}>Cooked: {formatHistoryDate(entry.cookedAt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </InfoCard>
        </>
      )}
    </ScreenShell>
  );
}

function getExpirationLabel(status) {
  if (status === "expired") {
    return "Expired";
  }

  if (status === "expiringSoon") {
    return "Expiring soon";
  }

  return "Fresh";
}

function getDaysLabel(daysUntilExpiration) {
  if (typeof daysUntilExpiration !== "number") {
    return "No date";
  }

  if (daysUntilExpiration < 0) {
    return `${Math.abs(daysUntilExpiration)} day${Math.abs(daysUntilExpiration) === 1 ? "" : "s"} overdue`;
  }

  if (daysUntilExpiration === 0) {
    return "Expires today";
  }

  return `${daysUntilExpiration} day${daysUntilExpiration === 1 ? "" : "s"} left`;
}

function formatHistoryDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  actionList: {
    gap: 10
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center"
  },
  stateText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  summaryGrid: {
    gap: 10
  },
  summaryCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10
  },
  summaryCardWarm: {
    backgroundColor: colors.warm
  },
  summaryCardAlert: {
    backgroundColor: colors.tomatoSoft
  },
  summaryCardSafe: {
    backgroundColor: colors.mint
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800"
  },
  summaryLabel: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 19
  },
  list: {
    gap: 10
  },
  listCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 6
  },
  listCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  listTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  listAmount: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  listMeta: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  emptyState: {
    gap: 12
  },
  emptyText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  errorText: {
    color: colors.tomato,
    fontSize: 14,
    lineHeight: 21
  }
});
