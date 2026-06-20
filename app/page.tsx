import { ProtectedAppShell } from "@/components/app/protected-app-shell";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <ProtectedAppShell>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <SidebarTrigger className="shrink-0" />
        </div>
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              订阅转换与 Clash 配置工具台
            </p>
            <h1 className="text-5xl font-semibold tracking-normal text-foreground md:text-7xl">
              SubVoid
            </h1>
          </div>
        </main>
      </div>
    </ProtectedAppShell>
  );
}
