import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  updateStudentStreak,
  checkStreakMilestones,
  checkFirstSessionMilestone,
  checkSurahCompleteMilestone,
  calculateQuality,
} from "@/lib/streaks";

const sessionSchema = z.object({
  studentId: z.string().min(1),
  surahId: z.number().min(1).max(114),
  startAyah: z.number().min(1),
  endAyah: z.number().min(1),
  isPassed: z.boolean(),
  mistakeCount: z.number().min(0).default(0),
  sessionType: z.enum(["NEW_MEMORIZATION", "REVISION", "RE_TEST"]).default("NEW_MEMORIZATION"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !["SUPER_ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = sessionSchema.parse(body);

    // Validate verse range
    const surah = await prisma.surah.findUnique({
      where: { id: validated.surahId },
    });

    if (!surah) {
      return NextResponse.json({ error: "Surah not found" }, { status: 404 });
    }

    if (validated.startAyah > validated.endAyah) {
      return NextResponse.json(
        { error: "Start verse must be less than or equal to end verse" },
        { status: 400 }
      );
    }

    if (validated.endAyah > surah.totalAyahs) {
      return NextResponse.json(
        { error: `Invalid verse range. ${surah.nameEnglish} has ${surah.totalAyahs} verses.` },
        { status: 400 }
      );
    }

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Calculate quality based on mistake count
    const quality = calculateQuality(validated.mistakeCount);

    // Create the session
    const newSession = await prisma.recitationSession.create({
      data: {
        studentId: validated.studentId,
        teacherId: teacherProfile.id,
        surahId: validated.surahId,
        startAyah: validated.startAyah,
        endAyah: validated.endAyah,
        mistakeCount: validated.mistakeCount,
        isPassed: validated.isPassed,
        quality,
        sessionType: validated.sessionType,
        notes: validated.notes,
      },
      include: {
        surah: true,
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // Update student progress if session passed
    if (validated.isPassed) {
      await updateStudentProgress(
        validated.studentId,
        validated.surahId,
        validated.startAyah,
        validated.endAyah,
        validated.mistakeCount
      );
    }

    // Update streak and check milestones
    const newStreak = await updateStudentStreak(validated.studentId);
    await checkStreakMilestones(validated.studentId, newStreak);
    await checkFirstSessionMilestone(validated.studentId);

    // Check surah completion milestone if progress was updated
    if (validated.isPassed) {
      await checkSurahCompleteMilestone(validated.studentId, validated.surahId);
    }

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const includeVoided = searchParams.get("includeVoided") === "true";

    const where: Record<string, unknown> = {};

    // Filter out voided sessions by default
    if (!includeVoided) {
      where.voided = false;
    }

    if (session.user.role === "TEACHER") {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (teacherProfile) {
        where.teacherId = teacherProfile.id;
      }
    } else if (session.user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (studentProfile) {
        where.studentId = studentProfile.id;
      }
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const sessions = await prisma.recitationSession.findMany({
      where,
      include: {
        surah: {
          select: {
            id: true,
            nameEnglish: true,
            nameArabic: true,
            totalAyahs: true,
          },
        },
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { sessionDate: "desc" },
      take: limit,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

async function updateStudentProgress(
  studentId: string,
  surahId: number,
  startAyah: number,
  endAyah: number,
  mistakeCount: number
) {
  const surah = await prisma.surah.findUnique({ where: { id: surahId } });
  if (!surah) return;

  const existingProgress = await prisma.studentProgress.findUnique({
    where: {
      studentId_surahId: { studentId, surahId },
    },
  });

  const versesInSession = endAyah - startAyah + 1;

  if (existingProgress) {
    // Update existing progress
    const currentRanges = existingProgress.memorizedRanges as Array<{ start: number; end: number }>;
    const newRanges = mergeRanges([...currentRanges, { start: startAyah, end: endAyah }]);
    const totalMem = calculateTotalVerses(newRanges);

    await prisma.studentProgress.update({
      where: { id: existingProgress.id },
      data: {
        memorizedRanges: newRanges,
        totalVersesMem: totalMem,
        status: totalMem >= surah.totalAyahs ? "MEMORIZED" : "IN_PROGRESS",
        avgMistakes: (existingProgress.avgMistakes * existingProgress.sessionCount + mistakeCount) / (existingProgress.sessionCount + 1),
        sessionCount: existingProgress.sessionCount + 1,
        lastReviewDate: new Date(),
      },
    });
  } else {
    // Create new progress
    await prisma.studentProgress.create({
      data: {
        studentId,
        surahId,
        memorizedRanges: [{ start: startAyah, end: endAyah }],
        totalVersesMem: versesInSession,
        totalVersesInSurah: surah.totalAyahs,
        status: versesInSession >= surah.totalAyahs ? "MEMORIZED" : "IN_PROGRESS",
        avgMistakes: mistakeCount,
        sessionCount: 1,
        lastReviewDate: new Date(),
      },
    });
  }
}

function mergeRanges(ranges: Array<{ start: number; end: number }>) {
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

function calculateTotalVerses(ranges: Array<{ start: number; end: number }>) {
  return ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
}
