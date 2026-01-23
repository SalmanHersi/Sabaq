import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth, getStudentProfile } from "./lib/permissions";

// Get progress for a student
export const getByStudent = query({
  args: { studentId: v.id("studentProfiles") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const progressRecords = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Enrich with surah data
    const enrichedProgress = await Promise.all(
      progressRecords.map(async (progress) => {
        const surah = await ctx.db.get(progress.surahId);
        return {
          ...progress,
          surah,
        };
      })
    );

    return enrichedProgress.sort((a, b) => a.surahNumber - b.surahNumber);
  },
});

// Get progress for current user (if student)
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    if (user.role !== "STUDENT") {
      throw new Error("Only students can view their own progress");
    }

    const studentProfile = await getStudentProfile(ctx, user._id);
    if (!studentProfile) {
      throw new Error("Student profile not found");
    }

    const progressRecords = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", studentProfile._id))
      .collect();

    // Enrich with surah data
    const enrichedProgress = await Promise.all(
      progressRecords.map(async (progress) => {
        const surah = await ctx.db.get(progress.surahId);
        return {
          ...progress,
          surah,
        };
      })
    );

    return enrichedProgress.sort((a, b) => a.surahNumber - b.surahNumber);
  },
});

// Get progress summary for a student
export const getSummary = query({
  args: { studentId: v.id("studentProfiles") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const studentProfile = await ctx.db.get(args.studentId);
    if (!studentProfile) {
      throw new Error("Student not found");
    }

    const progressRecords = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Calculate totals
    const totalVersesMemorized = progressRecords.reduce(
      (sum, p) => sum + p.totalVersesMem,
      0
    );
    const surahsCompleted = progressRecords.filter(
      (p) => p.status === "MEMORIZED"
    ).length;
    const surahsInProgress = progressRecords.filter(
      (p) => p.status === "IN_PROGRESS"
    ).length;

    // Get milestones count
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Get recent sessions
    const recentSessions = await ctx.db
      .query("recitationSessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("voided"), false))
      .order("desc")
      .take(5);

    return {
      currentStreak: studentProfile.currentStreak,
      longestStreak: studentProfile.longestStreak,
      lastActiveDate: studentProfile.lastActiveDate,
      totalVersesMemorized,
      surahsCompleted,
      surahsInProgress,
      totalSurahs: 114,
      milestonesEarned: milestones.length,
      recentSessionCount: recentSessions.length,
    };
  },
});

// Get overall stats for dashboard
export const getOverallStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Only admins can view overall stats");
    }

    const allStudents = await ctx.db.query("studentProfiles").collect();
    const allProgress = await ctx.db.query("studentProgress").collect();
    const allSessions = await ctx.db
      .query("recitationSessions")
      .filter((q) => q.eq(q.field("voided"), false))
      .collect();

    // Today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const todaySessions = allSessions.filter(
      (s) => s.sessionDate >= todayMs
    ).length;

    // Active students (had a session in last 7 days)
    const weekAgo = todayMs - 7 * 24 * 60 * 60 * 1000;
    const activeStudents = allStudents.filter(
      (s) => s.lastActiveDate && s.lastActiveDate >= weekAgo
    ).length;

    return {
      totalStudents: allStudents.length,
      activeStudents,
      totalSessions: allSessions.length,
      todaySessions,
      totalVersesMemorized: allProgress.reduce(
        (sum, p) => sum + p.totalVersesMem,
        0
      ),
      surahsCompleted: allProgress.filter((p) => p.status === "MEMORIZED").length,
    };
  },
});
