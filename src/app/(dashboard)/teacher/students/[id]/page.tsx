"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { SessionForm } from "@/components/sessions/session-form";
import { SessionList } from "@/components/sessions/session-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Loader2 } from "lucide-react";

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Get all students (teacher will only see their assigned students)
  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");

  // Get sessions for this student
  const sessions = useQuery(
    api.sessions.list,
    isAuthenticated ? { studentId: studentId as Id<"studentProfiles">, limit: 10 } : "skip"
  );

  const loading = authLoading || students === undefined || sessions === undefined;

  // Find the specific student
  const student = students?.find((s) => s !== null && s._id === studentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <Link href="/teacher/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
        <div className="p-4 text-red-600 bg-red-50 rounded-md">
          Student not found. They may not be assigned to you.
        </div>
      </div>
    );
  }

  // Transform sessions to match SessionList expected format
  const formattedSessions = sessions?.map((session) => ({
    id: session._id,
    surahId: session.surahNumber,
    surah: session.surah ? {
      id: session.surah.surahNumber,
      nameEnglish: session.surah.nameEnglish,
      nameArabic: session.surah.nameArabic,
      totalAyahs: session.surah.totalAyahs,
    } : {
      id: session.surahNumber,
      nameEnglish: "Unknown",
      nameArabic: "",
    },
    startAyah: session.startAyah,
    endAyah: session.endAyah,
    isPassed: session.isPassed,
    quality: session.quality,
    mistakeCount: session.mistakeCount,
    mistakeAyahs: session.mistakeDetails,
    sessionType: session.sessionType,
    sessionDate: new Date(session.sessionDate).toISOString(),
    notes: session.notes,
    student: {
      user: { name: session.student?.user?.name || "Student" },
    },
    teacher: {
      user: { name: session.teacher?.user?.name || "Teacher" },
    },
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/teacher/students">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-navy truncate">
              {student.user?.name}
            </h1>
            <p className="text-ink/60 text-sm truncate">{student.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Session Form */}
        <div className="lg:col-span-2">
          <SessionForm
            studentId={student._id}
            studentName={student.user?.name || "Student"}
          />
        </div>

        {/* Recent Sessions */}
        <SessionList
          sessions={formattedSessions}
          title="Recent Sessions"
          emptyMessage="No sessions recorded yet."
        />
      </div>
    </div>
  );
}
