"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export type UserRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export function useCurrentUser() {
  const user = useQuery(api.users.getCurrentUser);

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== null && user !== undefined,
    role: user?.role as UserRole | undefined,
    isAdmin: user?.role === "SUPER_ADMIN",
    isTeacher: user?.role === "TEACHER",
    isStudent: user?.role === "STUDENT",
    isParent: user?.role === "PARENT",
  };
}
