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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 border-r border-gold/20 bg-cream transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gold/20 px-6">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-oxblood" />
            <span className="text-xl font-bold text-navy">Quran LMS</span>
          </Link>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-oxblood/10"
          >
            <X className="h-5 w-5 text-ink/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavItems.map((item) => {
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-oxblood/10 text-oxblood"
                    : "text-ink/70 hover:bg-parchment hover:text-ink"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-oxblood" : "text-ink/50"
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gold/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oxblood/10">
              <UserCircle className="h-6 w-6 text-oxblood" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-navy truncate">
                {convexUser?.name || clerkUser?.fullName || "User"}
              </p>
              <p className="text-xs text-ink/50 capitalize">
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
