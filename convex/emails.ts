import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { Resend } from "resend";

export const getSessionEmailSummary = internalQuery({
  args: { sessionId: v.id("recitationSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.voided) {
      return null;
    }

    const surah = await ctx.db.get(session.surahId);
    const studentProfile = await ctx.db.get(session.studentId);
    const teacherProfile = await ctx.db.get(session.teacherId);

    const studentUser = studentProfile ? await ctx.db.get(studentProfile.userId) : null;
    const teacherUser = teacherProfile ? await ctx.db.get(teacherProfile.userId) : null;

    if (!studentUser) {
      return null;
    }

    const parentLinks = await ctx.db
      .query("parentStudents")
      .withIndex("by_student", (q) => q.eq("studentId", session.studentId))
      .collect();

    const parentUsers = await Promise.all(
      parentLinks.map(async (link) => {
        const parentProfile = await ctx.db.get(link.parentId);
        if (!parentProfile) return null;
        const parentUser = await ctx.db.get(parentProfile.userId);
        return parentUser ? { email: parentUser.email, name: parentUser.name } : null;
      })
    );

    return {
      sessionDate: session.sessionDate,
      surahName: surah?.nameEnglish || `Surah ${session.surahNumber}`,
      surahNumber: session.surahNumber,
      startAyah: session.startAyah,
      endAyah: session.endAyah,
      isPassed: session.isPassed,
      quality: session.quality,
      mistakeCount: session.mistakeCount,
      notes: session.notes,
      student: {
        name: studentUser.name,
        email: studentUser.email,
      },
      teacher: {
        name: teacherUser?.name || "Teacher",
      },
      parents: parentUsers.filter((p): p is NonNullable<typeof p> => p !== null),
    };
  },
});

export const sendSessionSummaryEmail = internalAction({
  args: { sessionId: v.id("recitationSessions") },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
      console.warn("RESEND_API_KEY or RESEND_FROM is not set; skipping email send.");
      return { skipped: true };
    }

    const summary = await ctx.runQuery(getSessionEmailSummary, {
      sessionId: args.sessionId,
    });

    if (!summary) {
      return { skipped: true };
    }

    const resend = new Resend(apiKey);
    const recipients = new Set<string>();

    if (summary.student.email) {
      recipients.add(summary.student.email);
    }
    for (const parent of summary.parents) {
      if (parent.email) {
        recipients.add(parent.email);
      }
    }

    const sessionDate = new Date(summary.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const subject = `Session summary: ${summary.surahName} (${summary.startAyah}-${summary.endAyah})`;
    const statusLabel = summary.isPassed ? "Passed" : "Needs practice";
    const qualityLabel = summary.quality.replace("_", " ");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1A1A1A;">
        <h2 style="margin: 0 0 8px;">Session Summary</h2>
        <p style="margin: 0 0 12px;">${summary.student.name} completed a session on ${formattedDate} with ${summary.teacher.name}.</p>
        <ul style="margin: 0 0 12px; padding-left: 18px;">
          <li><strong>Surah:</strong> ${summary.surahName} (${summary.surahNumber})</li>
          <li><strong>Verses:</strong> ${summary.startAyah}-${summary.endAyah}</li>
          <li><strong>Result:</strong> ${statusLabel}</li>
          <li><strong>Quality:</strong> ${qualityLabel}</li>
          <li><strong>Mistakes:</strong> ${summary.mistakeCount}</li>
        </ul>
        ${summary.notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${summary.notes}</p>` : ""}
      </div>
    `;

    const text = [
      "Session Summary",
      `${summary.student.name} completed a session on ${formattedDate} with ${summary.teacher.name}.`,
      `Surah: ${summary.surahName} (${summary.surahNumber})`,
      `Verses: ${summary.startAyah}-${summary.endAyah}`,
      `Result: ${statusLabel}`,
      `Quality: ${qualityLabel}`,
      `Mistakes: ${summary.mistakeCount}`,
      summary.notes ? `Notes: ${summary.notes}` : "",
    ].filter(Boolean).join("\n");

    const results = [];
    for (const email of recipients) {
      results.push(
        await resend.emails.send({
          from,
          to: email,
          subject,
          html,
          text,
        })
      );
    }

    return { sent: recipients.size, results };
  },
});
