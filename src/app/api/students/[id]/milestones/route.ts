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

    // Check access permissions
    if (session.user.role === "STUDENT") {
      // Students can only view their own milestones
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!studentProfile || studentProfile.id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      // Parents can only view their linked children's milestones
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          students: {
            select: { studentId: true },
          },
        },
      });
      if (!parentProfile) {
        return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
      }
      const linkedStudentIds = parentProfile.students.map((s) => s.studentId);
      if (!linkedStudentIds.includes(id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // Teachers and admins can view any student's milestones

    // Get milestones
    const milestones = await prisma.milestone.findMany({
      where: { studentId: id },
      orderBy: { earnedAt: "desc" },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}
