import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export type UserRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export type Permission =
  | "view_all_students"
  | "create_teacher"
  | "create_student"
  | "record_session"
  | "create_assignment"
  | "view_own_progress"
  | "view_child_progress"
  | "manage_center_settings"
  | "generate_parent_code";

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "view_all_students",
    "create_teacher",
    "create_student",
    "record_session",
    "create_assignment",
    "view_own_progress",
    "manage_center_settings",
    "generate_parent_code",
  ],
  TEACHER: [
    "view_all_students",
    "create_student",
    "record_session",
    "create_assignment",
    "generate_parent_code",
  ],
  STUDENT: ["view_own_progress"],
  PARENT: ["view_child_progress"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Get current user from context
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

// Require authentication and return user
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }
  return user;
}

// Require specific roles
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: UserRole[]
): Promise<Doc<"users">> {
  const user = await requireAuth(ctx);
  if (!hasRole(user.role as UserRole, allowedRoles)) {
    throw new Error("Access denied");
  }
  return user;
}

// Get teacher profile for current user
export async function getTeacherProfile(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("teacherProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

// Get student profile for current user
export async function getStudentProfile(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("studentProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

// Get parent profile for current user
export async function getParentProfile(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("parentProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}
