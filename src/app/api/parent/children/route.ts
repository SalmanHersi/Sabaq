import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only parents can access this endpoint
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get parent profile with linked students
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!parentProfile) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }

    // Format children data
    const children = await Promise.all(
      parentProfile.students.map(async (ps) => {
        const student = ps.student;

        // Get session count
        const sessionCount = await prisma.recitationSession.count({
          where: {
            studentId: student.id,
            voided: false,
          },
        });

        return {
          id: student.id,
          name: student.user.name,
          relationship: ps.relationship,
          linkedAt: ps.linkedAt,
          currentStreak: student.currentStreak,
          longestStreak: student.longestStreak,
          lastActiveDate: student.lastActiveDate,
          totalSessions: sessionCount,
        };
      })
    );

    return NextResponse.json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}
