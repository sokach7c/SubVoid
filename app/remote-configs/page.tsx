import { ProtectedAppShell } from "@/components/app/protected-app-shell";
import { RemoteConfigsPageClient } from "./page-client";

export default function RemoteConfigsPage() {
  return (
    <ProtectedAppShell>
      <RemoteConfigsPageClient />
    </ProtectedAppShell>
  );
}
