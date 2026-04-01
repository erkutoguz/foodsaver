import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function RecipesScreen() {
  return (
    <ScreenShell
      eyebrow="RECIPES"
      title="Tarifler"
      description="Elindeki malzemelere gore tarif uretme ve recipe detaylarini gorme akisini burada kuracagiz."
    >
      <InfoCard title="Bu ekranda olacaklar">
        Recipe generation, job sonucu, favorites ve cook flow burada toplanacak.
      </InfoCard>
    </ScreenShell>
  );
}
