import { ProtectedAppShell } from "@/components/app/protected-app-shell";
import { ClashHomePageClient } from "./page-client";

export default function ClashPage() {
  return (
    <ProtectedAppShell>
      <ClashHomePageClient />
    </ProtectedAppShell>
  );
}
