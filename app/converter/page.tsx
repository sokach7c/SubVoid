import { ProtectedAppShell } from "@/components/app/protected-app-shell";
import { ConverterPageClient } from "./page-client";

export default function ConverterPage() {
  return (
    <ProtectedAppShell>
      <ConverterPageClient />
    </ProtectedAppShell>
  );
}
