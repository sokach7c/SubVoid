import { ProtectedAppShell } from "@/components/app/protected-app-shell";
import { ClashSubscriptionsPageClient } from "./page-client";

export default function ClashSubscriptionsPage() {
  return (
    <ProtectedAppShell>
      <ClashSubscriptionsPageClient />
    </ProtectedAppShell>
  );
}
