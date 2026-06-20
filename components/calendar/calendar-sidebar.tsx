"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Home01Icon,
  Link03Icon,
  Logout01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Layers01Icon,
  Settings02Icon,
  ServerStack01Icon,
  LibraryIcon,
  DashboardSquare01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { clearStoredAuthToken, getAuthHeaders } from "@/lib/auth-storage";

export function CalendarSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [featuredOpen, setFeaturedOpen] = useState(true);
  const [username, setUsername] = useState("");
  const pathname = usePathname();
  const primaryNavItems = [
    { href: "/", label: "首页", icon: Home01Icon },
    { href: "/converter", label: "订阅转换", icon: Link03Icon },
    { href: "/remote-configs", label: "远程配置", icon: Settings02Icon },
  ];
  const clashNavItems = [
    { href: "/clash", label: "配置生成", icon: ServerStack01Icon },
    { href: "/clash/templates", label: "模板管理", icon: LibraryIcon },
    { href: "/clash/subscriptions", label: "我的订阅", icon: DashboardSquare01Icon },
  ];

  async function handleLogout() {
    clearStoredAuthToken();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: getAuthHeaders(),
      }).catch(() => null);

      if (!isActive || !response?.ok) {
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { user?: { username?: string } }
        | null;

      if (payload?.user?.username) {
        setUsername(payload.user.username);
      }
    }

    void loadUser();

    return () => {
      isActive = false;
    };
  }, []);

  const displayUsername = username || "已登录用户";

  return (
    <Sidebar className="lg:border-r-0!" {...props}>
      <SidebarHeader className="pb-0">
        <div className="px-2 py-1.5">
          <Link
            href="/"
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="size-9 shrink-0 bg-linear-to-br from-teal-500 to-indigo-600 rounded-md shadow flex items-center justify-center text-white text-xs font-semibold border border-border">
                SV
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-semibold text-sm">SubVoid</h1>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={Layers01Icon} className="size-3" />
                  <span className="text-xs">订阅工具台</span>
                </div>
              </div>
            </div>
          </Link>
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 dark:text-muted-foreground z-10"
            />
            <Input
              placeholder="搜索功能"
              className="pl-8 pr-8 h-8 text-xs bg-neutral-100 dark:bg-background border-2 border-border"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-[26px] w-full items-center gap-2 rounded-md px-2 text-xs transition-colors hover:bg-neutral-100/50 hover:text-zinc-950 dark:hover:bg-muted/50 dark:hover:text-foreground",
                        isActive
                          ? "bg-neutral-100 text-zinc-950 dark:bg-muted dark:text-foreground"
                          : "text-zinc-950 dark:text-muted-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={item.icon} className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        <SidebarGroup>
          <Collapsible open={featuredOpen} onOpenChange={setFeaturedOpen}>
            <CollapsibleTrigger
              nativeButton={false}
              render={
                <SidebarGroupLabel className="h-4 pb-4 pt-2 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent cursor-pointer">
                  <span>Clash 配置</span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className={cn(
                      "size-4 transition-transform ml-auto",
                      featuredOpen && "rotate-180"
                    )}
                  />
                </SidebarGroupLabel>
              }
            />
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clashNavItems.map((item) => {
                    const isActive =
                      item.href === "/clash"
                        ? pathname === "/clash"
                        : pathname.startsWith(item.href);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex h-[26px] w-full items-center gap-2 rounded-md px-2 text-xs transition-colors hover:bg-neutral-100/50 hover:text-zinc-950 dark:hover:bg-muted/50 dark:hover:text-foreground",
                            isActive
                              ? "bg-neutral-100 text-zinc-950 dark:bg-muted dark:text-foreground"
                              : "text-zinc-950 dark:text-muted-foreground"
                          )}
                        >
                          <HugeiconsIcon icon={item.icon} className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-neutral-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-muted/60"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <HugeiconsIcon icon={UserCircleIcon} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {displayUsername}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    在线
                  </p>
                </div>
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  className="size-4 text-muted-foreground"
                />
              </button>
            }
          />
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuGroup>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium text-foreground">
                  {displayUsername}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">在线</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2"
                onClick={() => void handleLogout()}
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
