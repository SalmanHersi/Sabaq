import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, getTeacherProfile } from "./lib/permissions";

// List all teachers (admin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN"]);

    const teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "TEACHER"))
      .collect();

    // Get profiles and student counts for each teacher
    const teachersWithDetails = await Promise.all(
      teachers.map(async (teacher) => {
        const profile = await ctx.db
          .query("teacherProfiles")
          .withIndex("by_user", (q) => q.eq("userId", teacher._id))
          .unique();

        let studentCount = 0;
        if (profile) {
          const studentTeachers = await ctx.db
            .query("studentTeachers")
            .withIndex("by_teacher", (q) => q.eq("teacherId", profile._id))
            .collect();
          studentCount = studentTeachers.length;
        }

        return {
          ...teacher,
          profile,
          studentCount,
        };
      })
    );

    return teachersWithDetails.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get teacher by ID
export const getById = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "TEACHER") {
      return null;
    }

    const profile = await ctx.db
      .query("teacherProfiles")
      .withIndex("by_user", (q) => q.eq("userId", teacher._id))
      .unique();

    return { ...teacher, profile };
  },
});

// Create a new teacher (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    specialization: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN"]);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const now = Date.now();

    // Create teacher user (will be linked to Clerk when they sign up)
    const teacherId = await ctx.db.insert("users", {
      clerkId: "", // Will be populated when user signs up via Clerk
      email: args.email,
      name: args.name,
      role: "TEACHER",
      isActive: true,
      ...(user.centerId ? { centerId: user.centerId } : {}),
      createdAt: now,
      updatedAt: now,
    });

    // Create teacher profile
    await ctx.db.insert("teacherProfiles", {
      userId: teacherId,
      specialization: args.specialization,
      createdAt: now,
      updatedAt: now,
    });

    return teacherId;
  },
});

// Update teacher profile
export const update = mutation({
  args: {
    teacherId: v.id("users"),
    name: v.optional(v.string()),
    specialization: v.optional(v.string()),
    bio: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN"]);

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "TEACHER") {
      throw new Error("Teacher not found");
    }

    const now = Date.now();

    // Update user
    const userUpdates: Record<string, unknown> = { updatedAt: now };
    if (args.name !== undefined) userUpdates.name = args.name;
    if (args.isActive !== undefined) userUpdates.isActive = args.isActive;

    await ctx.db.patch(args.teacherId, userUpdates);

    // Update profile
    const profile = await ctx.db
      .query("teacherProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.teacherId))
      .unique();

    if (profile) {
      const profileUpdates: Record<string, unknown> = { updatedAt: now };
      if (args.specialization !== undefined) profileUpdates.specialization = args.specialization;
      if (args.bio !== undefined) profileUpdates.bio = args.bio;

      await ctx.db.patch(profile._id, profileUpdates);
    }

    return args.teacherId;
  },
});

// Get students for a teacher
export const getStudents = query({
  args: { teacherId: v.optional(v.id("teacherProfiles")) },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    let teacherProfileId = args.teacherId;

    // If no teacherId provided and user is a teacher, use their profile
    if (!teacherProfileId && user.role === "TEACHER") {
      const profile = await getTeacherProfile(ctx, user._id);
      if (!profile) {
        throw new Error("Teacher profile not found");
      }
      teacherProfileId = profile._id;
    }

    if (!teacherProfileId) {
      throw new Error("Teacher ID required");
    }

    const studentTeachers = await ctx.db
      .query("studentTeachers")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherProfileId))
      .collect();

    const students = await Promise.all(
      studentTeachers.map(async (st) => {
        const studentProfile = await ctx.db.get(st.studentId);
        if (!studentProfile) return null;

        const studentUser = await ctx.db.get(studentProfile.userId);
        if (!studentUser) return null;

        // Get session count
        const sessions = await ctx.db
          .query("recitationSessions")
          .withIndex("by_student", (q) => q.eq("studentId", st.studentId))
          .filter((q) => q.eq(q.field("voided"), false))
          .collect();

        return {
          ...studentProfile,
          user: studentUser,
          isPrimary: st.isPrimary,
          sessionCount: sessions.length,
        };
      })
    );

    return students.filter(Boolean).sort((a, b) =>
      (a?.user.name || "").localeCompare(b?.user.name || "")
    );
  },
});
