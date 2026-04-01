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
      title={mode === "register" ? "Yeni hesabini olustur" : "Hesabina giris yap"}
      description="Bu ekranda kayit ve giris akisini bir sonraki adimda gercek endpointlerle baglayacagiz."
    >
      <InfoCard title="Hazirlanacak alanlar">
        <View style={styles.list}>
          <View style={styles.fakeInput}>
            <Text style={styles.fakeLabel}>E-posta</Text>
          </View>
          <View style={styles.fakeInput}>
            <Text style={styles.fakeLabel}>Sifre</Text>
          </View>
          {mode === "register" ? (
            <View style={styles.fakeInput}>
              <Text style={styles.fakeLabel}>Ad soyad</Text>
            </View>
          ) : null}
        </View>
      </InfoCard>

      <PrimaryButton
        label={mode === "register" ? "Kayit akisini baglayacagiz" : "Giris akisini baglayacagiz"}
      />

      <Text style={styles.note}>
        Bu turda sadece landing ve auth giris akisini hazirliyoruz. Form baglantisini
        bir sonraki adimda ekleyecegiz.
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
