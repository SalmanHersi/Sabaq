"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { SessionReview } from "@/components/sessions/session-review";

export default function TeacherSessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const studentNameParam = searchParams.get("studentName");

  let decodedStudentName: string | null = null;
  if (studentNameParam) {
    try {
      decodedStudentName = decodeURIComponent(studentNameParam);
    } catch {
      decodedStudentName = studentNameParam;
    }
  }

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const session = useQuery(
    api.sessions.getById,
    isAuthenticated ? { sessionId: sessionId as Id<"recitationSessions"> } : "skip"
  );

  const loading = authLoading || session === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Session not found or unavailable.
      </div>
    );
  }

  const backHref = studentId ? `/teacher/students/${studentId}` : "/teacher/sessions";
  const backLabel = studentId
    ? `Back to ${decodedStudentName || "student"}`
    : "Back to sessions";

  return (
    <SessionReview
      session={session}
      backHref={backHref}
      backLabel={backLabel}
      showStudent
      showTeacher
    />
  );
}
