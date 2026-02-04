"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";

export type UserRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");

  return {
    user,
    isLoading: authLoading || user === undefined,
    isAuthenticated,
    role: user?.role as UserRole | undefined,
    isAdmin: user?.role === "SUPER_ADMIN",
    isTeacher: user?.role === "TEACHER",
    isStudent: user?.role === "STUDENT",
    isParent: user?.role === "PARENT",
  };
}
