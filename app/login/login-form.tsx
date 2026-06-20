"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, LockPasswordIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredAuthToken, setStoredAuthToken } from "@/lib/auth-storage";
import { useEffect } from "react";

interface LoginResponse {
  token?: unknown;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (getStoredAuthToken()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Invalid username or password.");
      return;
    }

    const payload = (await response.json()) as LoginResponse;
    if (typeof payload.token !== "string") {
      setError("Login did not return a valid token.");
      return;
    }

    setStoredAuthToken(payload.token);
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm border border-border rounded-md bg-card p-5 shadow-xs">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-9 rounded-md border border-border bg-muted flex items-center justify-center">
          <HugeiconsIcon icon={Calendar01Icon} className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate">SubVoid</h1>
          <p className="text-xs text-muted-foreground truncate">
            Sign in to access your schedule.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <HugeiconsIcon
              icon={LockPasswordIcon}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="pl-9"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
