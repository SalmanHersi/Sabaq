import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const voidSchema = z.object({
  voidReason: z.string().min(1, "Void reason is required"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !["SUPER_ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = voidSchema.parse(body);

    // Check if session exists
    const existingSession = await prisma.recitationSession.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only the teacher who created the session or admin can void it
    if (
      session.user.role !== "SUPER_ADMIN" &&
      existingSession.teacher.user.id !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You can only void sessions you created" },
        { status: 403 }
      );
    }

    if (existingSession.voided) {
      return NextResponse.json(
        { error: "Session is already voided" },
        { status: 400 }
      );
    }

    // Void the session
    const voidedSession = await prisma.recitationSession.update({
      where: { id },
      data: {
        voided: true,
        voidedAt: new Date(),
        voidedBy: session.user.id,
        voidReason: validated.voidReason,
      },
    });

    return NextResponse.json(voidedSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Void session error:", error);
    return NextResponse.json({ error: "Failed to void session" }, { status: 500 });
  }
}
