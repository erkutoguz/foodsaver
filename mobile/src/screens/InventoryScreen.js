import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function InventoryScreen() {
  return (
    <ScreenShell
      eyebrow="PANTRY"
      title="Inventory"
      description="Mutfagindaki urunleri burada gorecek, duzenleyecek ve son kullanma tarihi takibini yapacaksin."
    >
      <InfoCard title="Bu ekranda olacaklar">
        Listeleme, urun ekleme, quantity guncelleme ve expiration summary burada olacak.
      </InfoCard>
    </ScreenShell>
  );
}
