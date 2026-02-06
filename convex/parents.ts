import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireRole, getParentProfile } from "./lib/permissions";
import { nanoid } from "nanoid";

// Get children for the current parent
export const getChildren = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    if (user.role !== "PARENT") {
      throw new Error("Only parents can access this");
    }

    const parentProfile = await getParentProfile(ctx, user._id);
    if (!parentProfile) {
      throw new Error("Parent profile not found");
    }

    const parentStudents = await ctx.db
      .query("parentStudents")
      .withIndex("by_parent", (q) => q.eq("parentId", parentProfile._id))
      .collect();

    const children = await Promise.all(
      parentStudents.map(async (ps) => {
        const studentProfile = await ctx.db.get(ps.studentId);
        if (!studentProfile) return null;

        const studentUser = await ctx.db.get(studentProfile.userId);
        if (!studentUser) return null;

        // Get recent sessions
        const recentSessions = await ctx.db
          .query("recitationSessions")
          .withIndex("by_student", (q) => q.eq("studentId", ps.studentId))
          .filter((q) => q.eq(q.field("voided"), false))
          .order("desc")
          .take(5);

        // Get progress summary
        const progressRecords = await ctx.db
          .query("studentProgress")
          .withIndex("by_student", (q) => q.eq("studentId", ps.studentId))
          .collect();

        const totalVersesMemorized = progressRecords.reduce(
          (sum, p) => sum + p.totalVersesMem,
          0
        );
        const surahsCompleted = progressRecords.filter(
          (p) => p.status === "MEMORIZED"
        ).length;

        return {
          ...studentProfile,
          user: studentUser,
          relationship: ps.relationship,
          recentSessions: recentSessions.length,
          currentStreak: studentProfile.currentStreak,
          totalVersesMemorized,
          surahsCompleted,
        };
      })
    );

    return children.filter(Boolean);
  },
});

// Get detailed summary for a child
export const getChildSummary = query({
  args: { studentId: v.id("studentProfiles") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (user.role !== "PARENT") {
      throw new Error("Only parents can access this");
    }

    const parentProfile = await getParentProfile(ctx, user._id);
    if (!parentProfile) {
      throw new Error("Parent profile not found");
    }

    // Verify parent-child relationship
    const relation = await ctx.db
      .query("parentStudents")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", parentProfile._id).eq("studentId", args.studentId)
      )
      .unique();

    if (!relation) {
      throw new Error("Access denied - not your child");
    }

    const studentProfile = await ctx.db.get(args.studentId);
    if (!studentProfile) {
      throw new Error("Student not found");
    }

    const studentUser = await ctx.db.get(studentProfile.userId);

    // Get progress
    const progressRecords = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Enrich progress with surah data
    const enrichedProgress = await Promise.all(
      progressRecords.map(async (p) => {
        const surah = await ctx.db.get(p.surahId);
        return { ...p, surah };
      })
    );

    // Get recent sessions with surah data
    const recentSessions = await ctx.db
      .query("recitationSessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("voided"), false))
      .order("desc")
      .take(10);

    const enrichedSessions = await Promise.all(
      recentSessions.map(async (s) => {
        const surah = await ctx.db.get(s.surahId);
        return { ...s, surah };
      })
    );

    // Get milestones
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    return {
      student: {
        ...studentProfile,
        user: studentUser,
      },
      progress: enrichedProgress.sort((a, b) => a.surahNumber - b.surahNumber),
      recentSessions: enrichedSessions,
      milestones: milestones.sort((a, b) => b.earnedAt - a.earnedAt),
      summary: {
        currentStreak: studentProfile.currentStreak,
        longestStreak: studentProfile.longestStreak,
        totalVersesMemorized: progressRecords.reduce(
          (sum, p) => sum + p.totalVersesMem,
          0
        ),
        surahsCompleted: progressRecords.filter((p) => p.status === "MEMORIZED")
          .length,
        surahsInProgress: progressRecords.filter(
          (p) => p.status === "IN_PROGRESS"
        ).length,
      },
    };
  },
});

// Generate access code for a student
export const generateAccessCode = mutation({
  args: { studentId: v.id("studentProfiles") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    const studentProfile = await ctx.db.get(args.studentId);
    if (!studentProfile) {
      throw new Error("Student not found");
    }

    const code = nanoid(8).toUpperCase();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const codeId = await ctx.db.insert("parentAccessCodes", {
      code,
      studentId: args.studentId,
      parentId: undefined,
      isUsed: false,
      expiresAt,
      createdAt: now,
    });

    return { codeId, code, expiresAt };
  },
});

// Link parent to student using access code
export const linkWithCode = mutation({
  args: {
    code: v.string(),
    relationship: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (user.role !== "PARENT") {
      throw new Error("Only parents can use access codes");
    }

    const parentProfile = await getParentProfile(ctx, user._id);
    if (!parentProfile) {
      throw new Error("Parent profile not found");
    }

    // Find the code
    const accessCode = await ctx.db
      .query("parentAccessCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!accessCode) {
      throw new Error("Invalid access code");
    }

    if (accessCode.isUsed) {
      throw new Error("This code has already been used");
    }

    if (accessCode.expiresAt < Date.now()) {
      throw new Error("This code has expired");
    }

    if (accessCode.parentId && accessCode.parentId !== parentProfile._id) {
      throw new Error("This access code was issued for another parent account");
    }

    // Check if already linked
    const existingLink = await ctx.db
      .query("parentStudents")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", parentProfile._id).eq("studentId", accessCode.studentId)
      )
      .unique();

    if (existingLink) {
      throw new Error("You are already linked to this student");
    }

    // Create the link
    await ctx.db.insert("parentStudents", {
      parentId: parentProfile._id,
      studentId: accessCode.studentId,
      relationship: args.relationship || "parent",
      linkedAt: Date.now(),
    });

    // Mark code as used
    await ctx.db.patch(accessCode._id, {
      isUsed: true,
      usedBy: user._id,
    });

    return { success: true };
  },
});
