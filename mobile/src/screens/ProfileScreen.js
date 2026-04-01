import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function ProfileScreen() {
  return (
    <ScreenShell
      eyebrow="MORE"
      title="Diger"
      description="Favoriler, gecmis tarifler ve hesap ayarlari bu alanda yer alacak."
    >
      <InfoCard title="Bu ekranda olacaklar">
        History, favorite recipes ve hesap detaylari burada gorunecek.
      </InfoCard>
    </ScreenShell>
  );
}
