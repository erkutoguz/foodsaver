import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { FormField } from "../components/FormField";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import {
  createInventoryRequest,
  getInventoryRequest
} from "../services/inventory-service";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

export function InventoryScreen() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("piece");
  const [category, setCategory] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadInventory() {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getInventoryRequest(token);
      setItems(result.items || []);
    } catch (error) {
      setErrorMessage(error.message || "Could not load inventory.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateItem() {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedExpiresAt = expiresAt.trim();
    const parsedQuantity = Number(quantity);

    if (!trimmedName) {
      setFormError("Please enter an item name.");
      return;
    }

    if (!quantity || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Please enter a valid quantity.");
      return;
    }

    if (trimmedExpiresAt && Number.isNaN(new Date(trimmedExpiresAt).getTime())) {
      setFormError("Expiration date should look like 2026-04-20.");
      return;
    }

    if (!token) {
      setFormError("You need to be signed in.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await createInventoryRequest(token, {
        name: trimmedName,
        quantity: parsedQuantity,
        unit,
        category: trimmedCategory || undefined,
        expiresAt: trimmedExpiresAt || undefined
      });

      setName("");
      setQuantity("");
      setUnit("piece");
      setCategory("");
      setExpiresAt("");
      await loadInventory();
    } catch (error) {
      setFormError(error.message || "Could not add the item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, [token]);

  return (
    <ScreenShell
      scrollable
      eyebrow="PANTRY"
      title="Inventory"
      description="You will see, edit, and track the expiration dates of your kitchen items here."
    >
      <InfoCard title="Add pantry item">
        <View style={styles.formList}>
          <FormField
            label="Item name"
            value={name}
            onChangeText={setName}
            placeholder="Tomato"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <FormField
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="2"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <View style={styles.unitRow}>
                {["piece", "gram", "ml"].map((unitOption) => (
                  <Pressable
                    key={unitOption}
                    onPress={() => setUnit(unitOption)}
                    style={[
                      styles.unitChip,
                      unit === unitOption && styles.unitChipActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        unit === unitOption && styles.unitChipTextActive
                      ]}
                    >
                      {unitOption}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <FormField
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="Vegetables"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <FormField
            label="Expiration date"
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="2026-04-20"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleCreateItem}
          />
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <PrimaryButton
          label="Add item"
          onPress={handleCreateItem}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </InfoCard>

      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.stateTitle}>Loading your pantry</Text>
          <Text style={styles.stateText}>We are bringing in your saved inventory items.</Text>
        </View>
      ) : null}

      {!isLoading && errorMessage ? (
        <InfoCard title="Could not load inventory">
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={loadInventory} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </InfoCard>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <InfoCard title="Your pantry is empty">
          <Text style={styles.emptyText}>
            Once you start adding ingredients, your pantry items will show up here.
          </Text>
        </InfoCard>
      ) : null}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <View style={styles.list}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>{items.length} items</Text>
            </View>

            <Pressable onPress={loadInventory} style={styles.summaryButton}>
              <Text style={styles.summaryButtonText}>Refresh</Text>
            </Pressable>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardMain}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.amountPill}>
                      <Text style={styles.amountPillText}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemMeta}>Tracked in your pantry</Text>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(item.expirationStatus)]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.expirationStatus)}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.bottomText}>{item.category || "Not set"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expiration</Text>
                  <Text style={styles.bottomText}>
                    {item.expiresAt
                      ? formatDate(item.expiresAt)
                      : "No expiration date"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenShell>
  );
}

function getStatusLabel(status) {
  if (status === "expired") {
    return "Expired";
  }

  if (status === "expiringSoon") {
    return "Expiring Soon";
  }

  return "Fresh";
}

function getStatusStyle(status) {
  if (status === "expired") {
    return styles.statusExpired;
  }

  if (status === "expiringSoon") {
    return styles.statusSoon;
  }

  return styles.statusSafe;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  formList: {
    gap: 14
  },
  formRow: {
    gap: 12
  },
  formCol: {
    gap: 8
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  unitChip: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  unitChipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: "#93c5fd"
  },
  unitChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  unitChipTextActive: {
    color: colors.brand
  },
  formError: {
    color: colors.tomato,
    fontSize: 13,
    lineHeight: 20
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  stateText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  errorText: {
    color: colors.tomato,
    fontSize: 14,
    lineHeight: 21
  },
  retryButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  retryText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  },
  emptyText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  list: {
    gap: 12
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  summaryPill: {
    borderRadius: 999,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  summaryPillText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "700"
  },
  summaryButton: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  summaryButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  cardMain: {
    flex: 1,
    gap: 8
  },
  itemNameRow: {
    gap: 8
  },
  itemName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  amountPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#edf2f7",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  amountPillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  itemMeta: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 19
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  statusSafe: {
    backgroundColor: colors.mint
  },
  statusSoon: {
    backgroundColor: colors.warm
  },
  statusExpired: {
    backgroundColor: "#ffe1e1"
  },
  statusText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  cardBottom: {
    gap: 8,
    paddingTop: 2
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  detailLabel: {
    color: colors.slate,
    fontSize: 12,
    fontWeight: "700"
  },
  bottomText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19
  }
});
