import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    let students;

    if (session.user.role === "SUPER_ADMIN") {
      // Admin sees all students
      students = await prisma.studentProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          teachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              sessions: true,
              assignments: true,
            },
          },
        },
        orderBy: {
          user: { name: "asc" },
        },
      });
    } else if (session.user.role === "TEACHER") {
      // Teacher sees only their students
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }

      students = await prisma.studentProfile.findMany({
        where: {
          teachers: {
            some: {
              teacherId: teacherProfile.id,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              assignments: true,
            },
          },
        },
        orderBy: {
          user: { name: "asc" },
        },
      });
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
