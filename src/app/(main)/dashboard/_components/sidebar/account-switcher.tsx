"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";

const CF_PROXY_BASE = "https://p.jkt48connect.com";

function getGatewayToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )gateway_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export function AccountSwitcher() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = getGatewayToken();
        if (!token) { setIsLoading(false); return; }

        const res = await fetch(`${CF_PROXY_BASE}/api/profile`, {
          headers: { "X-Gateway-Token": token },
          credentials: "include",
        });

        if (!res.ok) { setIsLoading(false); return; }

        const result = await res.json();
        if (result.status && result.data?.user) {
          setUser(result.data.user);
        }
      } catch {
        // biarkan null
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("[logout]", err);
    } finally {
      setLoggingOut(false);
      router.push("/auth/v2/login");
      router.refresh();
    }
  };

  if (isLoading) return <Skeleton className="size-8 rounded-lg" />;

  if (!user) return (
    <Avatar className="size-8 rounded-lg">
      <AvatarFallback>?</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer rounded-lg">
          <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-9 rounded-lg">
            <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-muted-foreground text-xs">{user.email}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
  <BadgeCheck />
  Account
</DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
          <LogOut />
          {loggingOut ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
