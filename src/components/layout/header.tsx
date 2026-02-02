"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 lg:h-20 items-center justify-between border-b border-gold/10 bg-parchment/80 backdrop-blur-xl px-3 sm:px-4 lg:px-8">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-xl"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && (
          <div className="animate-fade-in">
            <h1 className="text-lg sm:text-2xl font-bold text-navy font-[family-name:var(--font-display)] tracking-tight">
              {title}
            </h1>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex rounded-xl text-ink/50 hover:text-ink"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex relative rounded-xl text-ink/50 hover:text-ink"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oxblood/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-oxblood" />
          </span>
        </Button>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-gold/20 mx-1" />

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-navy">
              {user?.fullName || user?.firstName || "Guest"}
            </p>
            <p className="text-xs text-ink/45">Welcome back</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-oxblood/20 to-gold/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <UserButton
              afterSignOutUrl="/login"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10 ring-2 ring-gold/20 hover:ring-gold/40 transition-all duration-200",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
