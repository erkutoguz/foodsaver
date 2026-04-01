import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function ProfileScreen() {
  return (
    <ScreenShell
      eyebrow="MORE"
      title="More"
      description="Favorites, recipe history, and account settings will live in this area."
    >
      <InfoCard title="What will be here">
        History, favorite recipes, and account details will appear here.
      </InfoCard>
    </ScreenShell>
  );
}
