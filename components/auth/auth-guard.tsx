"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthHeaders, getStoredAuthToken } from "@/lib/auth-storage";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function verifyToken() {
      const token = getStoredAuthToken();

      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });

      if (!isActive) {
        return;
      }

      if (!response.ok) {
        window.localStorage.removeItem("subvoid_auth_token");
        router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      setIsAuthorized(true);
    }

    void verifyToken();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-svh bg-background text-muted-foreground flex items-center justify-center text-sm">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
