import { ProtectedAppShell } from "@/components/app/protected-app-shell";
import { ClashTemplatesPageClient } from "./page-client";

export default function ClashTemplatesPage() {
  return (
    <ProtectedAppShell>
      <ClashTemplatesPageClient />
    </ProtectedAppShell>
  );
}
