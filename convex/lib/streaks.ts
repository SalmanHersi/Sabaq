import { MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

export type MilestoneType =
  | "SURAH_COMPLETE"
  | "JUZ_COMPLETE"
  | "STREAK_3"
  | "STREAK_7"
  | "STREAK_30"
  | "FIRST_SESSION";

export type QualityRating = "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT";

/**
 * Calculate quality rating from mistake count.
 * 0 mistakes = EXCELLENT
 * 1-2 mistakes = GOOD
 * 3+ mistakes = NEEDS_IMPROVEMENT
 */
export function calculateQuality(mistakeCount: number): QualityRating {
  if (mistakeCount === 0) return "EXCELLENT";
  if (mistakeCount <= 2) return "GOOD";
  return "NEEDS_IMPROVEMENT";
}

/**
 * Update a student's streak based on their session history.
 * Returns the new current streak value.
 */
export async function updateStudentStreak(
  ctx: MutationCtx,
  studentProfileId: Id<"studentProfiles">
): Promise<number> {
  const student = await ctx.db.get(studentProfileId);
  if (!student) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayMs = yesterday.getTime();

  const lastActive = student.lastActiveDate ? new Date(student.lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }
  const lastActiveMs = lastActive?.getTime();

  let newStreak = student.currentStreak;

  // Check if already active today (no streak change needed)
  if (lastActiveMs === todayMs) {
    return newStreak;
  }

  // Check if last active was yesterday (continue streak)
  if (lastActiveMs === yesterdayMs) {
    newStreak = student.currentStreak + 1;
  }
  // Check if first session ever or streak broken
  else if (!lastActiveMs || lastActiveMs < yesterdayMs) {
    newStreak = 1;
  }

  // Update longest streak if necessary
  const newLongestStreak = Math.max(newStreak, student.longestStreak);

  await ctx.db.patch(studentProfileId, {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: todayMs,
    updatedAt: Date.now(),
  });

  return newStreak;
}

/**
 * Check and award streak milestones based on the current streak.
 */
export async function checkStreakMilestones(
  ctx: MutationCtx,
  studentProfileId: Id<"studentProfiles">,
  currentStreak: number
): Promise<MilestoneType[]> {
  const awarded: MilestoneType[] = [];

  const streakMilestones: { streak: number; type: MilestoneType }[] = [
    { streak: 3, type: "STREAK_3" },
    { streak: 7, type: "STREAK_7" },
    { streak: 30, type: "STREAK_30" },
  ];

  for (const milestone of streakMilestones) {
    if (currentStreak >= milestone.streak) {
      // Check if milestone already earned
      const existing = await ctx.db
        .query("milestones")
        .withIndex("by_student", (q) => q.eq("studentId", studentProfileId))
        .filter((q) => q.eq(q.field("type"), milestone.type))
        .first();

      if (!existing) {
        await ctx.db.insert("milestones", {
          studentId: studentProfileId,
          type: milestone.type,
          earnedAt: Date.now(),
        });
        awarded.push(milestone.type);
      }
    }
  }

  return awarded;
}

/**
 * Check if this is the student's first session and award milestone.
 */
export async function checkFirstSessionMilestone(
  ctx: MutationCtx,
  studentProfileId: Id<"studentProfiles">
): Promise<boolean> {
  // Check if milestone already earned
  const existing = await ctx.db
    .query("milestones")
    .withIndex("by_student", (q) => q.eq("studentId", studentProfileId))
    .filter((q) => q.eq(q.field("type"), "FIRST_SESSION"))
    .first();

  if (existing) {
    return false;
  }

  // Count non-voided sessions
  const sessions = await ctx.db
    .query("recitationSessions")
    .withIndex("by_student", (q) => q.eq("studentId", studentProfileId))
    .filter((q) => q.eq(q.field("voided"), false))
    .collect();

  // Award first session milestone if this is the first
  if (sessions.length === 1) {
    await ctx.db.insert("milestones", {
      studentId: studentProfileId,
      type: "FIRST_SESSION",
      earnedAt: Date.now(),
    });
    return true;
  }

  return false;
}

/**
 * Check if a surah is fully memorized and award milestone.
 */
export async function checkSurahCompleteMilestone(
  ctx: MutationCtx,
  studentProfileId: Id<"studentProfiles">,
  surahNumber: number
): Promise<boolean> {
  const progress = await ctx.db
    .query("studentProgress")
    .withIndex("by_student_surah", (q) =>
      q.eq("studentId", studentProfileId).eq("surahNumber", surahNumber)
    )
    .first();

  if (progress?.status !== "MEMORIZED") {
    return false;
  }

  // Check if milestone already earned for this surah
  const existing = await ctx.db
    .query("milestones")
    .withIndex("by_student", (q) => q.eq("studentId", studentProfileId))
    .filter((q) =>
      q.and(
        q.eq(q.field("type"), "SURAH_COMPLETE"),
        q.eq(q.field("surahNumber"), surahNumber)
      )
    )
    .first();

  if (existing) {
    return false;
  }

  await ctx.db.insert("milestones", {
    studentId: studentProfileId,
    type: "SURAH_COMPLETE",
    surahNumber,
    earnedAt: Date.now(),
  });

  return true;
}

/**
 * Merge overlapping or adjacent verse ranges.
 */
export function mergeRanges(
  ranges: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current.start <= last.end + 1) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Calculate total verses from ranges.
 */
export function calculateTotalVerses(
  ranges: Array<{ start: number; end: number }>
): number {
  return ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
}
