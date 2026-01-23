import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, requireAuth, getTeacherProfile, getStudentProfile } from "./lib/permissions";
import { assignmentStatus } from "./schema";

// List assignments based on user role
export const list = query({
  args: {
    studentId: v.optional(v.id("studentProfiles")),
    status: v.optional(assignmentStatus),
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const includeCompleted = args.includeCompleted ?? true;

    let assignments;

    if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile) {
        return [];
      }

      let query = ctx.db
        .query("assignments")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacherProfile._id));

      if (args.studentId) {
        query = query.filter((q) => q.eq(q.field("studentId"), args.studentId));
      }

      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      } else if (!includeCompleted) {
        query = query.filter((q) => q.neq(q.field("status"), "COMPLETED"));
      }

      assignments = await query.order("desc").collect();
    } else if (user.role === "STUDENT") {
      const studentProfile = await getStudentProfile(ctx, user._id);
      if (!studentProfile) {
        return [];
      }

      let query = ctx.db
        .query("assignments")
        .withIndex("by_student", (q) => q.eq("studentId", studentProfile._id));

      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      } else if (!includeCompleted) {
        query = query.filter((q) => q.neq(q.field("status"), "COMPLETED"));
      }

      assignments = await query.order("desc").collect();
    } else if (user.role === "SUPER_ADMIN") {
      let query = ctx.db.query("assignments");

      if (args.studentId) {
        query = query.filter((q) => q.eq(q.field("studentId"), args.studentId));
      }

      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      assignments = await query.order("desc").collect();
    } else {
      return [];
    }

    // Enrich with related data
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const studentProfile = await ctx.db.get(assignment.studentId);
        const teacherProfile = await ctx.db.get(assignment.teacherId);
        const surah = assignment.surahId ? await ctx.db.get(assignment.surahId) : null;

        const studentUser = studentProfile
          ? await ctx.db.get(studentProfile.userId)
          : null;
        const teacherUser = teacherProfile
          ? await ctx.db.get(teacherProfile.userId)
          : null;

        // Check if overdue
        const now = Date.now();
        const isOverdue = assignment.dueDate &&
          assignment.dueDate < now &&
          assignment.status !== "COMPLETED";

        return {
          ...assignment,
          surah,
          student: studentProfile ? { ...studentProfile, user: studentUser } : null,
          teacher: teacherProfile ? { ...teacherProfile, user: teacherUser } : null,
          isOverdue,
        };
      })
    );

    return enrichedAssignments;
  },
});

// Get assignment by ID
export const getById = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) return null;

    const studentProfile = await ctx.db.get(assignment.studentId);
    const teacherProfile = await ctx.db.get(assignment.teacherId);
    const surah = assignment.surahId ? await ctx.db.get(assignment.surahId) : null;

    const studentUser = studentProfile
      ? await ctx.db.get(studentProfile.userId)
      : null;
    const teacherUser = teacherProfile
      ? await ctx.db.get(teacherProfile.userId)
      : null;

    return {
      ...assignment,
      surah,
      student: studentProfile ? { ...studentProfile, user: studentUser } : null,
      teacher: teacherProfile ? { ...teacherProfile, user: teacherUser } : null,
    };
  },
});

// Create a new assignment
export const create = mutation({
  args: {
    studentId: v.id("studentProfiles"),
    title: v.string(),
    surahNumber: v.optional(v.number()),
    startAyah: v.optional(v.number()),
    endAyah: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    // Get teacher profile
    const teacherProfile = await getTeacherProfile(ctx, user._id);
    if (!teacherProfile) {
      throw new Error("Teacher profile not found");
    }

    // Validate surah if provided
    let surahId = undefined;
    if (args.surahNumber) {
      const surah = await ctx.db
        .query("surahs")
        .withIndex("by_surah_number", (q) => q.eq("surahNumber", args.surahNumber!))
        .unique();

      if (!surah) {
        throw new Error("Surah not found");
      }

      surahId = surah._id;

      // Validate verse range if provided
      if (args.startAyah && args.endAyah) {
        if (args.startAyah > args.endAyah) {
          throw new Error("Start verse must be less than or equal to end verse");
        }
        if (args.endAyah > surah.totalAyahs) {
          throw new Error(
            `Invalid verse range. ${surah.nameEnglish} has ${surah.totalAyahs} verses.`
          );
        }
      }
    }

    const now = Date.now();

    const assignmentId = await ctx.db.insert("assignments", {
      studentId: args.studentId,
      teacherId: teacherProfile._id,
      title: args.title,
      surahId,
      surahNumber: args.surahNumber,
      startAyah: args.startAyah,
      endAyah: args.endAyah,
      status: "PENDING",
      dueDate: args.dueDate,
      instructions: args.instructions,
      createdAt: now,
      updatedAt: now,
    });

    return assignmentId;
  },
});

// Update assignment status
export const updateStatus = mutation({
  args: {
    assignmentId: v.id("assignments"),
    status: assignmentStatus,
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Students can only mark their own assignments as IN_PROGRESS or COMPLETED
    if (user.role === "STUDENT") {
      const studentProfile = await getStudentProfile(ctx, user._id);
      if (!studentProfile || assignment.studentId !== studentProfile._id) {
        throw new Error("You can only update your own assignments");
      }
      if (args.status !== "IN_PROGRESS" && args.status !== "COMPLETED") {
        throw new Error("Students can only mark assignments as in progress or completed");
      }
    }

    // Teachers can update any status for their assignments
    if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile || assignment.teacherId !== teacherProfile._id) {
        throw new Error("You can only update your own assignments");
      }
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "COMPLETED") {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.assignmentId, updates);

    return args.assignmentId;
  },
});

// Update assignment details (teacher only)
export const update = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    surahNumber: v.optional(v.number()),
    startAyah: v.optional(v.number()),
    endAyah: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Teachers can only update their own assignments
    if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile || assignment.teacherId !== teacherProfile._id) {
        throw new Error("You can only update your own assignments");
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    if (args.surahNumber !== undefined) {
      const surah = await ctx.db
        .query("surahs")
        .withIndex("by_surah_number", (q) => q.eq("surahNumber", args.surahNumber!))
        .unique();

      if (!surah) {
        throw new Error("Surah not found");
      }

      updates.surahId = surah._id;
      updates.surahNumber = args.surahNumber;
    }

    if (args.startAyah !== undefined) {
      updates.startAyah = args.startAyah;
    }

    if (args.endAyah !== undefined) {
      updates.endAyah = args.endAyah;
    }

    if (args.dueDate !== undefined) {
      updates.dueDate = args.dueDate;
    }

    if (args.instructions !== undefined) {
      updates.instructions = args.instructions;
    }

    await ctx.db.patch(args.assignmentId, updates);

    return args.assignmentId;
  },
});

// Delete assignment (teacher only)
export const remove = mutation({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Teachers can only delete their own assignments
    if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile || assignment.teacherId !== teacherProfile._id) {
        throw new Error("You can only delete your own assignments");
      }
    }

    await ctx.db.delete(args.assignmentId);

    return args.assignmentId;
  },
});

// Get assignment counts for a student (for dashboard stats)
export const getStudentStats = query({
  args: {
    studentId: v.optional(v.id("studentProfiles")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    let studentId = args.studentId;

    // If no studentId provided and user is a student, use their profile
    if (!studentId && user.role === "STUDENT") {
      const studentProfile = await getStudentProfile(ctx, user._id);
      if (!studentProfile) {
        return { pending: 0, inProgress: 0, completed: 0, overdue: 0 };
      }
      studentId = studentProfile._id;
    }

    if (!studentId) {
      return { pending: 0, inProgress: 0, completed: 0, overdue: 0 };
    }

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_student", (q) => q.eq("studentId", studentId!))
      .collect();

    const now = Date.now();
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    for (const a of assignments) {
      if (a.status === "COMPLETED") {
        completed++;
      } else if (a.dueDate && a.dueDate < now) {
        overdue++;
      } else if (a.status === "IN_PROGRESS") {
        inProgress++;
      } else {
        pending++;
      }
    }

    return { pending, inProgress, completed, overdue };
  },
});
