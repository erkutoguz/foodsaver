import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";

export function InventoryScreen() {
  return (
    <ScreenShell
      eyebrow="PANTRY"
      title="Inventory"
      description="You will see, edit, and track the expiration dates of your kitchen items here."
    >
      <InfoCard title="What will be here">
        Listing items, adding new ones, updating quantities, and viewing the expiration
        summary will all live here.
      </InfoCard>
    </ScreenShell>
  );
}
