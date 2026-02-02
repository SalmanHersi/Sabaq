"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Settings,
  BarChart3,
  UserCircle,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  // Admin routes
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Teachers",
    href: "/admin/teachers",
    icon: UserCircle,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
  },

  // Teacher routes
  {
    title: "Dashboard",
    href: "/teacher",
    icon: LayoutDashboard,
    roles: ["TEACHER"],
  },
  {
    title: "My Students",
    href: "/teacher/students",
    icon: Users,
    roles: ["TEACHER"],
  },
  {
    title: "Assignments",
    href: "/teacher/assignments",
    icon: ClipboardList,
    roles: ["TEACHER"],
  },
  {
    title: "Sessions",
    href: "/teacher/sessions",
    icon: BookOpen,
    roles: ["TEACHER"],
  },

  // Student routes
  {
    title: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
    roles: ["STUDENT"],
  },
  {
    title: "My Progress",
    href: "/student/progress",
    icon: BarChart3,
    roles: ["STUDENT"],
  },
  {
    title: "Assignments",
    href: "/student/assignments",
    icon: ClipboardList,
    roles: ["STUDENT"],
  },
  {
    title: "History",
    href: "/student/history",
    icon: BookOpen,
    roles: ["STUDENT"],
  },

  // Parent routes
  {
    title: "Dashboard",
    href: "/parent",
    icon: LayoutDashboard,
    roles: ["PARENT"],
  },
  {
    title: "My Children",
    href: "/parent/children",
    icon: Users,
    roles: ["PARENT"],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const { user: convexUser, role: userRole } = useCurrentUser();

  const filteredNavItems = navItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-72 border-r border-gold/15 bg-gradient-to-b from-cream via-cream to-cream/95",
        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "shadow-[1px_0_12px_rgba(26,26,26,0.04)]",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] via-transparent to-oxblood/[0.02] pointer-events-none" />

        <div className="relative flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-gold/15 px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-oxblood/20 rounded-xl blur-lg group-hover:bg-oxblood/30 transition-colors duration-300" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-oxblood to-oxblood/90 shadow-[0_2px_8px_rgba(140,74,69,0.3)]">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-navy font-[family-name:var(--font-display)] tracking-tight">
                  Quran LMS
                </span>
                <p className="text-[10px] text-ink/40 font-medium tracking-wider uppercase">
                  Learning Platform
                </p>
              </div>
            </Link>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-oxblood/10 transition-colors duration-200"
            >
              <X className="h-5 w-5 text-ink/60" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            <p className="px-3 mb-3 text-[10px] font-semibold text-ink/40 uppercase tracking-wider">
              Navigation
            </p>
            {filteredNavItems.map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  item.href !== "/teacher" &&
                  item.href !== "/student" &&
                  item.href !== "/parent" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "animate-fade-in opacity-0",
                    isActive
                      ? "bg-gradient-to-r from-oxblood/10 via-oxblood/[0.08] to-transparent text-oxblood shadow-[inset_0_1px_1px_rgba(140,74,69,0.1)]"
                      : "text-ink/60 hover:bg-parchment hover:text-ink hover:shadow-[0_1px_3px_rgba(26,26,26,0.04)]"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-oxblood/10"
                      : "bg-transparent group-hover:bg-gold/10"
                  )}>
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] transition-colors duration-200",
                        isActive ? "text-oxblood" : "text-ink/45 group-hover:text-ink/70"
                      )}
                    />
                  </div>
                  <span className="flex-1">{item.title}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-oxblood animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gold/15 p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-parchment/80 shadow-[0_1px_3px_rgba(26,26,26,0.04)]">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-oxblood/15 to-oxblood/10">
                  <UserCircle className="h-6 w-6 text-oxblood/70" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sage border-2 border-cream" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy truncate">
                  {convexUser?.name || clerkUser?.fullName || "User"}
                </p>
                <p className="text-xs text-ink/45 capitalize flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {userRole?.toLowerCase().replace("_", " ") || "Guest"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
