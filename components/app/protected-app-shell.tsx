import { AuthGuard } from "@/components/auth/auth-guard";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ProtectedAppShellProps {
  children: React.ReactNode;
}

export function ProtectedAppShell({ children }: ProtectedAppShellProps) {
  return (
    <AuthGuard>
      <SidebarProvider className="bg-sidebar">
        <CalendarSidebar />
        <div className="h-svh overflow-hidden lg:p-2 w-full">
          <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
