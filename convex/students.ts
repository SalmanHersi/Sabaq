import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, requireAuth, getTeacherProfile, getStudentProfile } from "./lib/permissions";

// List students based on user role
export const list = query({
  args: {
    teacherId: v.optional(v.id("teacherProfiles")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (user.role === "SUPER_ADMIN") {
      // Admin sees all students
      const studentProfiles = await ctx.db.query("studentProfiles").collect();

      const students = await Promise.all(
        studentProfiles.map(async (profile) => {
          const studentUser = await ctx.db.get(profile.userId);
          if (!studentUser) return null;

          // Get teachers
          const studentTeachers = await ctx.db
            .query("studentTeachers")
            .withIndex("by_student", (q) => q.eq("studentId", profile._id))
            .collect();

          const teachers = await Promise.all(
            studentTeachers.map(async (st) => {
              const teacherProfile = await ctx.db.get(st.teacherId);
              if (!teacherProfile) return null;
              const teacherUser = await ctx.db.get(teacherProfile.userId);
              return teacherUser ? { ...teacherProfile, user: teacherUser, isPrimary: st.isPrimary } : null;
            })
          );

          // Get session count
          const sessions = await ctx.db
            .query("recitationSessions")
            .withIndex("by_student", (q) => q.eq("studentId", profile._id))
            .filter((q) => q.eq(q.field("voided"), false))
            .collect();

          // Get assignment count
          const assignments = await ctx.db
            .query("assignments")
            .withIndex("by_student", (q) => q.eq("studentId", profile._id))
            .collect();

          return {
            ...profile,
            user: studentUser,
            teachers: teachers.filter(Boolean),
            sessionCount: sessions.length,
            assignmentCount: assignments.length,
          };
        })
      );

      return students.filter(Boolean).sort((a, b) =>
        (a?.user.name || "").localeCompare(b?.user.name || "")
      );
    } else if (user.role === "TEACHER") {
      // Teacher sees only their students
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile) {
        throw new Error("Teacher profile not found");
      }

      const studentTeachers = await ctx.db
        .query("studentTeachers")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacherProfile._id))
        .collect();

      const students = await Promise.all(
        studentTeachers.map(async (st) => {
          const profile = await ctx.db.get(st.studentId);
          if (!profile) return null;

          const studentUser = await ctx.db.get(profile.userId);
          if (!studentUser) return null;

          // Get session count
          const sessions = await ctx.db
            .query("recitationSessions")
            .withIndex("by_student", (q) => q.eq("studentId", profile._id))
            .filter((q) => q.eq(q.field("voided"), false))
            .collect();

          // Get assignment count
          const assignments = await ctx.db
            .query("assignments")
            .withIndex("by_student", (q) => q.eq("studentId", profile._id))
            .collect();

          return {
            ...profile,
            user: studentUser,
            sessionCount: sessions.length,
            assignmentCount: assignments.length,
          };
        })
      );

      return students.filter(Boolean).sort((a, b) =>
        (a?.user.name || "").localeCompare(b?.user.name || "")
      );
    }

    throw new Error("Access denied");
  },
});

// Get student by ID
export const getById = query({
  args: { studentId: v.id("studentProfiles") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const profile = await ctx.db.get(args.studentId);
    if (!profile) return null;

    const studentUser = await ctx.db.get(profile.userId);
    if (!studentUser) return null;

    // Check access
    if (user.role === "STUDENT") {
      const myProfile = await getStudentProfile(ctx, user._id);
      if (!myProfile || myProfile._id !== args.studentId) {
        throw new Error("Access denied");
      }
    } else if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile) {
        throw new Error("Access denied");
      }
      const relation = await ctx.db
        .query("studentTeachers")
        .withIndex("by_student_teacher", (q) =>
          q.eq("studentId", args.studentId).eq("teacherId", teacherProfile._id)
        )
        .unique();
      if (!relation) {
        throw new Error("Access denied");
      }
    }

    // Get teachers
    const studentTeachers = await ctx.db
      .query("studentTeachers")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .collect();

    const teachers = await Promise.all(
      studentTeachers.map(async (st) => {
        const teacherProfile = await ctx.db.get(st.teacherId);
        if (!teacherProfile) return null;
        const teacherUser = await ctx.db.get(teacherProfile.userId);
        return teacherUser ? { ...teacherProfile, user: teacherUser, isPrimary: st.isPrimary } : null;
      })
    );

    // Get progress
    const progress = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .collect();

    // Get milestones
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .collect();

    return {
      ...profile,
      user: studentUser,
      teachers: teachers.filter(Boolean),
      progress,
      milestones,
    };
  },
});

// Create a new student
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    dateOfBirth: v.optional(v.number()),
    teacherId: v.optional(v.id("teacherProfiles")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const now = Date.now();

    // Create student user
    const studentUserId = await ctx.db.insert("users", {
      clerkId: "", // Will be populated when user signs up via Clerk
      email: args.email,
      name: args.name,
      role: "STUDENT",
      isActive: true,
      ...(user.centerId ? { centerId: user.centerId } : {}),
      createdAt: now,
      updatedAt: now,
    });

    // Create student profile
    const studentProfileId = await ctx.db.insert("studentProfiles", {
      userId: studentUserId,
      dateOfBirth: args.dateOfBirth,
      enrollmentDate: now,
      currentSurahId: 1,
      currentAyah: 1,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Assign teacher if provided or if creator is a teacher
    let assignTeacherId = args.teacherId;
    if (!assignTeacherId && user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      assignTeacherId = teacherProfile?._id;
    }

    if (assignTeacherId) {
      await ctx.db.insert("studentTeachers", {
        studentId: studentProfileId,
        teacherId: assignTeacherId,
        isPrimary: true,
        assignedAt: now,
      });
    }

    return studentProfileId;
  },
});

// Update student
export const update = mutation({
  args: {
    studentId: v.id("studentProfiles"),
    name: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    const profile = await ctx.db.get(args.studentId);
    if (!profile) {
      throw new Error("Student not found");
    }

    const now = Date.now();

    // Update user if name or isActive provided
    if (args.name !== undefined || args.isActive !== undefined) {
      const userUpdates: Record<string, unknown> = { updatedAt: now };
      if (args.name !== undefined) userUpdates.name = args.name;
      if (args.isActive !== undefined) userUpdates.isActive = args.isActive;

      await ctx.db.patch(profile.userId, userUpdates);
    }

    // Update profile if dateOfBirth provided
    if (args.dateOfBirth !== undefined) {
      await ctx.db.patch(args.studentId, {
        dateOfBirth: args.dateOfBirth,
        updatedAt: now,
      });
    }

    return args.studentId;
  },
});

// Assign teacher to student
export const assignTeacher = mutation({
  args: {
    studentId: v.id("studentProfiles"),
    teacherId: v.id("teacherProfiles"),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["SUPER_ADMIN"]);

    // Check if relation already exists
    const existing = await ctx.db
      .query("studentTeachers")
      .withIndex("by_student_teacher", (q) =>
        q.eq("studentId", args.studentId).eq("teacherId", args.teacherId)
      )
      .unique();

    if (existing) {
      // Update isPrimary if needed
      if (args.isPrimary !== undefined) {
        await ctx.db.patch(existing._id, { isPrimary: args.isPrimary });
      }
      return existing._id;
    }

    // Create new relation
    return await ctx.db.insert("studentTeachers", {
      studentId: args.studentId,
      teacherId: args.teacherId,
      isPrimary: args.isPrimary ?? false,
      assignedAt: Date.now(),
    });
  },
});

// Remove teacher from student
export const removeTeacher = mutation({
  args: {
    studentId: v.id("studentProfiles"),
    teacherId: v.id("teacherProfiles"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["SUPER_ADMIN"]);

    const relation = await ctx.db
      .query("studentTeachers")
      .withIndex("by_student_teacher", (q) =>
        q.eq("studentId", args.studentId).eq("teacherId", args.teacherId)
      )
      .unique();

    if (relation) {
      await ctx.db.delete(relation._id);
    }
  },
});

// Get student milestones
export const getMilestones = query({
  args: { studentId: v.id("studentProfiles") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    return milestones.sort((a, b) => b.earnedAt - a.earnedAt);
  },
});
