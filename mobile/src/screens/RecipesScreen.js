import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function RecipesScreen() {
  return (
    <ScreenShell
      eyebrow="RECIPES"
      title="Recipes"
      description="This is where we will build recipe generation and the recipe detail flow based on your ingredients."
    >
      <InfoCard title="What will be here">
        Recipe generation, job results, favorites, and the cook flow will come together here.
      </InfoCard>
    </ScreenShell>
  );
}
