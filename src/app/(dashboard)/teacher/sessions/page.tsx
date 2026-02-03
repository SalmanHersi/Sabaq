"use client";

import { useMemo, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { SessionList } from "@/components/sessions/session-list";
import { type MistakeDetail } from "@/components/quran/mushaf-session-viewer";
import { Button } from "@/components/ui/button";

export default function TeacherSessionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const sessions = useQuery(
    api.sessions.list,
    isAuthenticated ? { limit: 50 } : "skip"
  );
  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");

  const [studentFilter, setStudentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    let filtered = sessions;

    if (studentFilter !== "all") {
      filtered = filtered.filter((session) => session.studentId === studentFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((session) =>
        statusFilter === "passed" ? session.isPassed : !session.isPassed
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      let start = new Date(now);

      if (dateFilter === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (dateFilter === "last7") {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "last30") {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "thisMonth") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startMs = start.getTime();
      filtered = filtered.filter((session) => session.sessionDate >= startMs);
    }

    return filtered;
  }, [sessions, studentFilter, statusFilter, dateFilter]);

  const formattedSessions =
    filteredSessions.map((session) => ({
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

  const studentOptions = (students ?? []).filter(
    (student): student is NonNullable<typeof student> => Boolean(student && student._id)
  );

  const selectedStudentName =
    studentFilter === "all"
      ? null
      : studentOptions.find((student) => student._id === studentFilter)?.user?.name || "Student";

  const buildDetailHref = (session: { id: string }) => {
    if (studentFilter === "all") {
      return `/teacher/sessions/${session.id}`;
    }

    const encodedName = encodeURIComponent(selectedStudentName ?? "Student");
    return `/teacher/sessions/${session.id}?studentId=${studentFilter}&studentName=${encodedName}`;
  };

  const hasActiveFilters =
    studentFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";

  const loading =
    authLoading || sessions === undefined || students === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">Sessions</h1>
        <p className="text-sm text-ink/60">
          Review session outcomes and open a full session review.
        </p>
      </div>

      <div className="rounded-2xl border border-gold/15 bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(26,26,26,0.04)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end">
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">
              Student
            </label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
            >
              <option value="all">All students</option>
              {studentOptions.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.user?.name || "Student"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
            >
              <option value="all">All</option>
              <option value="passed">Passed</option>
              <option value="failed">Needs Practice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="thisMonth">This month</option>
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStudentFilter("all");
              setStatusFilter("all");
              setDateFilter("all");
            }}
            disabled={!hasActiveFilters}
          >
            Clear filters
          </Button>
        </div>
        <p className="mt-3 text-xs text-ink/45">
          Showing {formattedSessions.length} of {sessions?.length ?? 0} sessions
        </p>
      </div>

      <SessionList
        sessions={formattedSessions}
        title="All Sessions"
        emptyMessage="No sessions recorded yet."
        getDetailHref={buildDetailHref}
      />
    </div>
  );
}
