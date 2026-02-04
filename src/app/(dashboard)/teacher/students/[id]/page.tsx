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
import { type MistakeDetail } from "@/components/quran/mushaf-session-viewer";

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

  const contactEmail = student.primaryContactEmail || student.user?.email;
  const contactLabel = student.primaryContact === "PARENT" ? "Parent" : "Student";

  const encodedStudentName = encodeURIComponent(student.user?.name || "Student");

  // Get the last session (first in the array since it's sorted by date desc)
  const lastSessionRaw = sessions?.[0];

  // Build last session data for the form
  const lastSession = lastSessionRaw ? {
    surahId: lastSessionRaw.surahNumber,
    surahName: lastSessionRaw.surah?.nameEnglish || "Unknown",
    surahNameArabic: lastSessionRaw.surah?.nameArabic || "",
    startAyah: lastSessionRaw.startAyah,
    endAyah: lastSessionRaw.endAyah,
    totalAyahs: lastSessionRaw.surah?.totalAyahs || 0,
    isPassed: lastSessionRaw.isPassed,
    mistakeCount: lastSessionRaw.mistakeCount,
    mistakeDetails: lastSessionRaw.mistakeDetails as MistakeDetail[] | undefined,
    sessionType: lastSessionRaw.sessionType,
    sessionDate: new Date(lastSessionRaw.sessionDate).toISOString(),
  } : undefined;

  // Calculate smart suggestion based on last session
  const continueFrom = lastSessionRaw ? (() => {
    const surahTotalAyahs = lastSessionRaw.surah?.totalAyahs || 0;

    if (!lastSessionRaw.isPassed) {
      // Failed: suggest re-test with same verses
      return {
        surahId: lastSessionRaw.surahNumber,
        surahName: lastSessionRaw.surah?.nameEnglish || "Unknown",
        startAyah: lastSessionRaw.startAyah,
        endAyah: lastSessionRaw.endAyah,
        sessionType: "RE_TEST" as const,
        isRetest: true,
      };
    } else {
      // Passed: suggest next starting point (just the first ayah, not a range)
      const nextStartAyah = lastSessionRaw.endAyah + 1;

      // Check if there are more verses in this surah
      if (nextStartAyah <= surahTotalAyahs) {
        // Continue in the same surah, starting from the next ayah
        return {
          surahId: lastSessionRaw.surahNumber,
          surahName: lastSessionRaw.surah?.nameEnglish || "Unknown",
          startAyah: nextStartAyah,
          sessionType: "NEW_MEMORIZATION" as const,
          isRetest: false,
        };
      } else {
        // Surah completed - suggest the next surah starting from ayah 1
        const nextSurahNumber = lastSessionRaw.surahNumber + 1;

        if (nextSurahNumber <= 114) {
          // Move to the next surah
          return {
            surahId: nextSurahNumber,
            surahName: "", // Will be fetched by the form
            startAyah: 1,
            sessionType: "NEW_MEMORIZATION" as const,
            isRetest: false,
            isNextSurah: true, // Flag to indicate surah name needs to be fetched
          };
        } else {
          // Completed all 114 surahs - suggest revision from surah 1
          return {
            surahId: 1,
            surahName: "Al-Fatihah",
            startAyah: 1,
            sessionType: "REVISION" as const,
            isRetest: false,
          };
        }
      }
    }
  })() : undefined;

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
            <p className="text-ink/60 text-sm truncate">
              {contactEmail}
              <span className="text-xs text-ink/40 ml-1">({contactLabel})</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Session Form */}
        <div className="lg:col-span-2">
          <SessionForm
            studentId={student._id}
            studentName={student.user?.name || "Student"}
            lastSession={lastSession}
            continueFrom={continueFrom}
          />
        </div>

        {/* Recent Sessions */}
        <SessionList
          sessions={formattedSessions}
          title="Recent Sessions"
          emptyMessage="No sessions recorded yet."
          getDetailHref={(session) =>
            `/teacher/sessions/${session.id}?studentId=${studentId}&studentName=${encodedStudentName}`
          }
        />
      </div>
    </div>
  );
}
