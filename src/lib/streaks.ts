import { prisma } from "./prisma";
import { MilestoneType } from "@prisma/client";

/**
 * Update a student's streak based on their session history.
 * Returns the new current streak value.
 */
export async function updateStudentStreak(studentId: string): Promise<number> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
    },
  });

  if (!student) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastActive = student.lastActiveDate
    ? new Date(student.lastActiveDate)
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  let newStreak = student.currentStreak;

  // Check if already active today (no streak change needed)
  if (lastActive && lastActive.getTime() === today.getTime()) {
    return newStreak;
  }

  // Check if last active was yesterday (continue streak)
  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    newStreak = student.currentStreak + 1;
  }
  // Check if first session ever or streak broken
  else if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
    newStreak = 1;
  }

  // Update longest streak if necessary
  const newLongestStreak = Math.max(newStreak, student.longestStreak);

  await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
    },
  });

  return newStreak;
}

/**
 * Check and award streak milestones based on the current streak.
 */
export async function checkStreakMilestones(
  studentId: string,
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
      const existing = await prisma.milestone.findFirst({
        where: {
          studentId,
          type: milestone.type,
        },
      });

      if (!existing) {
        await prisma.milestone.create({
          data: {
            studentId,
            type: milestone.type,
          },
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
  studentId: string
): Promise<boolean> {
  // Check if milestone already earned
  const existing = await prisma.milestone.findFirst({
    where: {
      studentId,
      type: "FIRST_SESSION",
    },
  });

  if (existing) {
    return false;
  }

  // Check total session count
  const sessionCount = await prisma.recitationSession.count({
    where: {
      studentId,
      voided: false,
    },
  });

  // Award first session milestone if this is the first
  if (sessionCount === 1) {
    await prisma.milestone.create({
      data: {
        studentId,
        type: "FIRST_SESSION",
      },
    });
    return true;
  }

  return false;
}

/**
 * Check if a surah is fully memorized and award milestone.
 */
export async function checkSurahCompleteMilestone(
  studentId: string,
  surahId: number
): Promise<boolean> {
  const progress = await prisma.studentProgress.findUnique({
    where: {
      studentId_surahId: { studentId, surahId },
    },
    select: {
      status: true,
    },
  });

  if (progress?.status !== "MEMORIZED") {
    return false;
  }

  // Check if milestone already earned for this surah
  const existing = await prisma.milestone.findFirst({
    where: {
      studentId,
      type: "SURAH_COMPLETE",
      surahId,
    },
  });

  if (existing) {
    return false;
  }

  await prisma.milestone.create({
    data: {
      studentId,
      type: "SURAH_COMPLETE",
      surahId,
    },
  });

  return true;
}

/**
 * Calculate quality rating from mistake count.
 * 0 mistakes = EXCELLENT
 * 1-2 mistakes = GOOD
 * 3+ mistakes = NEEDS_IMPROVEMENT
 */
export function calculateQuality(
  mistakeCount: number
): "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" {
  if (mistakeCount === 0) return "EXCELLENT";
  if (mistakeCount <= 2) return "GOOD";
  return "NEEDS_IMPROVEMENT";
}
