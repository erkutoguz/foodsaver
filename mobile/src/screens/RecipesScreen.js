import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function RecipesScreen() {
  return (
    <ScreenShell
      eyebrow="RECIPES"
      title="Recipes"
      description="Discover recipe ideas that fit the ingredients already sitting in your pantry."
    >
      <InfoCard title="Recipe space">
        Build your pantry first, then come here to generate ideas, save favorites, and decide what to cook next.
      </InfoCard>
    </ScreenShell>
  );
}
