"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { SessionList } from "@/components/sessions/session-list";
import { type MistakeDetail } from "@/components/quran/mushaf-session-viewer";

export default function StudentHistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const sessions = useQuery(
    api.sessions.list,
    isAuthenticated ? { limit: 50 } : "skip"
  );

  const loading = authLoading || sessions === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  const formattedSessions =
    sessions?.map((session) => ({
      id: session._id,
      surahId: session.surahNumber,
      surah: session.surah
        ? {
            id: session.surah.surahNumber,
            nameEnglish: session.surah.nameEnglish,
            nameArabic: session.surah.nameArabic,
            totalAyahs: session.surah.totalAyahs,
          }
        : {
            id: session.surahNumber,
            nameEnglish: "Unknown",
            nameArabic: "",
          },
      startAyah: session.startAyah,
      endAyah: session.endAyah,
      isPassed: session.isPassed,
      quality: session.quality,
      mistakeCount: session.mistakeCount,
      mistakeAyahs: session.mistakeDetails as MistakeDetail[] | undefined,
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">History</h1>
        <p className="text-sm text-ink/60">
          Review your recent recitation sessions and feedback.
        </p>
      </div>

      <SessionList
        sessions={formattedSessions}
        title="Session History"
        emptyMessage="No sessions recorded yet."
        detailHrefBase="/student/history"
      />
    </div>
  );
}
