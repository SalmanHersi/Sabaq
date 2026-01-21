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

    const { id } = await params;

    const recitationSession = await prisma.recitationSession.findUnique({
      where: { id },
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
            user: { select: { name: true, email: true } },
          },
        },
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!recitationSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Role-based access control
    const userRole = session.user.role;
    const userId = session.user.id;

    if (userRole === "TEACHER") {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId },
      });
      if (teacherProfile?.id !== recitationSession.teacherId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (userRole === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
      });
      if (studentProfile?.id !== recitationSession.studentId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (userRole === "PARENT") {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId },
        include: { students: true },
      });
      const hasAccess = parentProfile?.students.some(
        (s) => s.id === recitationSession.studentId
      );
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(recitationSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
