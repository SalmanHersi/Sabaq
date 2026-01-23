import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireRole, requireAuth, getTeacherProfile, getStudentProfile } from "./lib/permissions";
import {
  calculateQuality,
  updateStudentStreak,
  checkStreakMilestones,
  checkFirstSessionMilestone,
  checkSurahCompleteMilestone,
  mergeRanges,
  calculateTotalVerses,
} from "./lib/streaks";
import { sessionType } from "./schema";

// List sessions with filters
export const list = query({
  args: {
    studentId: v.optional(v.id("studentProfiles")),
    limit: v.optional(v.number()),
    includeVoided: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const limit = args.limit ?? 20;
    const includeVoided = args.includeVoided ?? false;

    let sessions;

    if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile) {
        return [];
      }

      let query = ctx.db
        .query("recitationSessions")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacherProfile._id));

      if (!includeVoided) {
        query = query.filter((q) => q.eq(q.field("voided"), false));
      }

      if (args.studentId) {
        query = query.filter((q) => q.eq(q.field("studentId"), args.studentId));
      }

      sessions = await query.order("desc").take(limit);
    } else if (user.role === "STUDENT") {
      const studentProfile = await getStudentProfile(ctx, user._id);
      if (!studentProfile) {
        return [];
      }

      let query = ctx.db
        .query("recitationSessions")
        .withIndex("by_student", (q) => q.eq("studentId", studentProfile._id));

      if (!includeVoided) {
        query = query.filter((q) => q.eq(q.field("voided"), false));
      }

      sessions = await query.order("desc").take(limit);
    } else if (user.role === "SUPER_ADMIN") {
      let query = ctx.db.query("recitationSessions");

      if (!includeVoided) {
        query = query.filter((q) => q.eq(q.field("voided"), false));
      }

      if (args.studentId) {
        query = query.filter((q) => q.eq(q.field("studentId"), args.studentId));
      }

      sessions = await query.order("desc").take(limit);
    } else {
      return [];
    }

    // Enrich with related data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const surah = await ctx.db.get(session.surahId);
        const studentProfile = await ctx.db.get(session.studentId);
        const teacherProfile = await ctx.db.get(session.teacherId);

        const studentUser = studentProfile
          ? await ctx.db.get(studentProfile.userId)
          : null;
        const teacherUser = teacherProfile
          ? await ctx.db.get(teacherProfile.userId)
          : null;

        return {
          ...session,
          surah,
          student: studentProfile ? { ...studentProfile, user: studentUser } : null,
          teacher: teacherProfile ? { ...teacherProfile, user: teacherUser } : null,
        };
      })
    );

    return enrichedSessions;
  },
});

// Get session by ID
export const getById = query({
  args: { sessionId: v.id("recitationSessions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const surah = await ctx.db.get(session.surahId);
    const studentProfile = await ctx.db.get(session.studentId);
    const teacherProfile = await ctx.db.get(session.teacherId);

    const studentUser = studentProfile
      ? await ctx.db.get(studentProfile.userId)
      : null;
    const teacherUser = teacherProfile
      ? await ctx.db.get(teacherProfile.userId)
      : null;

    return {
      ...session,
      surah,
      student: studentProfile ? { ...studentProfile, user: studentUser } : null,
      teacher: teacherProfile ? { ...teacherProfile, user: teacherUser } : null,
    };
  },
});

// Create a new session
export const create = mutation({
  args: {
    studentId: v.id("studentProfiles"),
    surahNumber: v.number(),
    startAyah: v.number(),
    endAyah: v.number(),
    isPassed: v.boolean(),
    mistakeCount: v.optional(v.number()),
    sessionType: sessionType,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    // Get teacher profile
    const teacherProfile = await getTeacherProfile(ctx, user._id);
    if (!teacherProfile) {
      throw new Error("Teacher profile not found");
    }

    // Validate surah
    const surah = await ctx.db
      .query("surahs")
      .withIndex("by_surah_number", (q) => q.eq("surahNumber", args.surahNumber))
      .unique();

    if (!surah) {
      throw new Error("Surah not found");
    }

    // Validate verse range
    if (args.startAyah > args.endAyah) {
      throw new Error("Start verse must be less than or equal to end verse");
    }

    if (args.endAyah > surah.totalAyahs) {
      throw new Error(
        `Invalid verse range. ${surah.nameEnglish} has ${surah.totalAyahs} verses.`
      );
    }

    const mistakeCount = args.mistakeCount ?? 0;
    const quality = calculateQuality(mistakeCount);
    const now = Date.now();

    // Create the session
    const sessionId = await ctx.db.insert("recitationSessions", {
      studentId: args.studentId,
      teacherId: teacherProfile._id,
      surahId: surah._id,
      surahNumber: args.surahNumber,
      startAyah: args.startAyah,
      endAyah: args.endAyah,
      sessionDate: now,
      mistakeCount,
      isPassed: args.isPassed,
      quality,
      sessionType: args.sessionType,
      notes: args.notes,
      voided: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update student progress if session passed
    if (args.isPassed) {
      await updateStudentProgress(
        ctx,
        args.studentId,
        surah._id,
        args.surahNumber,
        args.startAyah,
        args.endAyah,
        mistakeCount,
        surah.totalAyahs
      );
    }

    // Update streak and check milestones
    const newStreak = await updateStudentStreak(ctx, args.studentId);
    await checkStreakMilestones(ctx, args.studentId, newStreak);
    await checkFirstSessionMilestone(ctx, args.studentId);

    // Check surah completion milestone if progress was updated
    if (args.isPassed) {
      await checkSurahCompleteMilestone(ctx, args.studentId, args.surahNumber);
    }

    return sessionId;
  },
});

// Void a session
export const voidSession = mutation({
  args: {
    sessionId: v.id("recitationSessions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["SUPER_ADMIN", "TEACHER"]);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.voided) {
      throw new Error("Session is already voided");
    }

    // Teachers can only void their own sessions
    if (user.role === "TEACHER") {
      const teacherProfile = await getTeacherProfile(ctx, user._id);
      if (!teacherProfile || session.teacherId !== teacherProfile._id) {
        throw new Error("You can only void your own sessions");
      }
    }

    await ctx.db.patch(args.sessionId, {
      voided: true,
      voidedAt: Date.now(),
      voidedBy: user._id,
      voidReason: args.reason,
      updatedAt: Date.now(),
    });

    // TODO: Consider recalculating progress when a session is voided

    return args.sessionId;
  },
});

// Helper function to update student progress
async function updateStudentProgress(
  ctx: MutationCtx,
  studentId: Id<"studentProfiles">,
  surahId: Id<"surahs">,
  surahNumber: number,
  startAyah: number,
  endAyah: number,
  mistakeCount: number,
  totalVersesInSurah: number
) {
  const existingProgress = await ctx.db
    .query("studentProgress")
    .withIndex("by_student_surah", (q: any) =>
      q.eq("studentId", studentId).eq("surahNumber", surahNumber)
    )
    .first();

  const versesInSession = endAyah - startAyah + 1;
  const now = Date.now();

  if (existingProgress) {
    // Update existing progress
    const currentRanges = existingProgress.memorizedRanges as Array<{
      start: number;
      end: number;
    }>;
    const newRanges = mergeRanges([
      ...currentRanges,
      { start: startAyah, end: endAyah },
    ]);
    const totalMem = calculateTotalVerses(newRanges);

    await ctx.db.patch(existingProgress._id, {
      memorizedRanges: newRanges,
      totalVersesMem: totalMem,
      status: totalMem >= totalVersesInSurah ? "MEMORIZED" : "IN_PROGRESS",
      avgMistakes:
        (existingProgress.avgMistakes * existingProgress.sessionCount +
          mistakeCount) /
        (existingProgress.sessionCount + 1),
      sessionCount: existingProgress.sessionCount + 1,
      lastReviewDate: now,
      updatedAt: now,
    });
  } else {
    // Create new progress
    await ctx.db.insert("studentProgress", {
      studentId,
      surahId,
      surahNumber,
      memorizedRanges: [{ start: startAyah, end: endAyah }],
      totalVersesMem: versesInSession,
      totalVersesInSurah,
      status: versesInSession >= totalVersesInSurah ? "MEMORIZED" : "IN_PROGRESS",
      avgMistakes: mistakeCount,
      sessionCount: 1,
      lastReviewDate: now,
      createdAt: now,
      updatedAt: now,
    });
  }
}
