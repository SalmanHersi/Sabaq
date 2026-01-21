"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gold/20 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h1 className="text-xl font-semibold text-navy">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-ink/60" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-oxblood" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/70">
            {session?.user?.name || "Guest"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="h-5 w-5 text-ink/60" />
          </Button>
        </div>
      </div>
    </header>
  );
}
