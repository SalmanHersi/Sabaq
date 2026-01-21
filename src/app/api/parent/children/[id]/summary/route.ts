import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only parents can access this endpoint
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify parent has access to this child
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          where: { studentId: id },
          select: { studentId: true },
        },
      },
    });

    if (!parentProfile || parentProfile.students.length === 0) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Get student profile with streak data
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get session count and last session date
    const sessionStats = await prisma.recitationSession.aggregate({
      where: {
        studentId: id,
        voided: false,
      },
      _count: true,
    });

    const lastSession = await prisma.recitationSession.findFirst({
      where: {
        studentId: id,
        voided: false,
      },
      orderBy: { sessionDate: "desc" },
      select: {
        sessionDate: true,
        surah: {
          select: { nameEnglish: true, nameArabic: true },
        },
        isPassed: true,
        quality: true,
      },
    });

    // Get progress summary (total verses memorized)
    const progressStats = await prisma.studentProgress.aggregate({
      where: { studentId: id },
      _sum: {
        totalVersesMem: true,
      },
    });

    // Get memorized surahs count
    const memorizedSurahsCount = await prisma.studentProgress.count({
      where: {
        studentId: id,
        status: "MEMORIZED",
      },
    });

    // Get milestones count
    const milestonesCount = await prisma.milestone.count({
      where: { studentId: id },
    });

    // Return summary (excluding notes and detailed mistake info)
    return NextResponse.json({
      child: {
        id: student.id,
        name: student.user.name,
      },
      streak: {
        current: student.currentStreak,
        longest: student.longestStreak,
        lastActiveDate: student.lastActiveDate,
      },
      progress: {
        totalSessions: sessionStats._count,
        totalVersesMemorized: progressStats._sum.totalVersesMem || 0,
        memorizedSurahsCount,
        milestonesEarned: milestonesCount,
      },
      lastSession: lastSession
        ? {
            date: lastSession.sessionDate,
            surah: lastSession.surah.nameEnglish,
            surahArabic: lastSession.surah.nameArabic,
            passed: lastSession.isPassed,
            quality: lastSession.quality,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching child summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch child summary" },
      { status: 500 }
    );
  }
}
