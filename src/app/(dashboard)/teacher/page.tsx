"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TeacherDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Get teacher's students
  const shouldLoad = isAuthenticated;
  const students = useQuery(api.students.list, shouldLoad ? {} : "skip");

  // Get teacher's sessions
  const sessions = useQuery(api.sessions.list, shouldLoad ? { limit: 10 } : "skip");

  const loading = authLoading || (shouldLoad && (students === undefined || sessions === undefined));

  // Calculate stats
  const studentCount = students?.length || 0;
  const totalSessions = sessions?.length || 0;
  const passedSessions = sessions?.filter(s => s.isPassed).length || 0;

  // Count this week's sessions
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoMs = weekAgo.getTime();
  const sessionsThisWeek = sessions?.filter(s => s.sessionDate >= weekAgoMs).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
          <p className="text-sm text-ink/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-sm text-ink/60">Your session expired. Please sign in again.</p>
          <Link href="/login" className="text-sm text-oxblood hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-navy">
          Welcome back!
        </h1>
      </div>

      {/* Quick Actions - Full Width */}
      <div className="bg-white rounded-xl border border-ink/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-navy">Quick Actions</h2>
            <p className="text-sm text-ink/50">Common tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/teacher/students"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-ink/10 hover:border-oxblood/30 hover:bg-oxblood/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-oxblood/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-oxblood" />
            </div>
            <span className="text-sm font-medium text-navy">Record Session</span>
          </Link>
          <Link
            href="/teacher/students"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-ink/10 hover:border-sage/30 hover:bg-sage/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sage" />
            </div>
            <span className="text-sm font-medium text-navy">View Students</span>
          </Link>
          <Link
            href="/teacher/assignments"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-ink/10 hover:border-gold/30 hover:bg-gold/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-gold" />
            </div>
            <span className="text-sm font-medium text-navy">Assignments</span>
          </Link>
          <Link
            href="/teacher/students"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-ink/10 hover:border-navy/30 hover:bg-navy/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-navy" />
            </div>
            <span className="text-sm font-medium text-navy">Progress</span>
          </Link>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Students Overview Card */}
          <div className="bg-white rounded-xl border border-ink/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-navy">Students</h2>
                <p className="text-sm text-ink/50">{studentCount} total students</p>
              </div>
              <select className="text-sm border border-ink/15 rounded-lg px-3 py-1.5 text-ink/70 bg-white">
                <option>All students</option>
              </select>
            </div>

            {studentCount > 0 ? (
              <div className="space-y-3">
                {students?.filter(s => s !== null).slice(0, 4).map((student) => (
                  <Link
                    key={student._id}
                    href={`/teacher/students/${student._id}`}
                    className="flex items-center justify-between py-2 hover:bg-parchment/30 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-oxblood/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-oxblood">
                          {student.user?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {student.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-ink/50">
                          Student
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink/30" />
                  </Link>
                ))}
                <Link
                  href="/teacher/students"
                  className="block text-center text-sm text-oxblood hover:text-oxblood/70 pt-2 transition-colors"
                >
                  View all students
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-parchment flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-ink/30" />
                </div>
                <p className="text-ink/60 font-medium mb-1">No students yet</p>
                <p className="text-sm text-ink/40 mb-4">
                  Add students to start tracking their progress
                </p>
                <Link href="/teacher/students">
                  <Button variant="outline" size="sm">
                    Add student
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Sessions Overview */}
          <div className="bg-white rounded-xl border border-ink/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-navy">Sessions</h2>
                <p className="text-sm text-ink/50">This week vs. last week</p>
              </div>
              <select className="text-sm border border-ink/15 rounded-lg px-3 py-1.5 text-ink/70 bg-white">
                <option>This week</option>
                <option>This month</option>
                <option>All time</option>
              </select>
            </div>

            {/* Simple Stats Display */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-parchment/50">
                <p className="text-2xl font-semibold text-navy">{sessionsThisWeek}</p>
                <p className="text-xs text-ink/50">This week</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-parchment/50">
                <p className="text-2xl font-semibold text-sage">{passedSessions}</p>
                <p className="text-xs text-ink/50">Passed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-parchment/50">
                <p className="text-2xl font-semibold text-navy">{totalSessions}</p>
                <p className="text-xs text-ink/50">Total</p>
              </div>
            </div>

            {/* Mini Chart Placeholder */}
            <div className="h-24 flex items-end gap-1 px-2">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-full rounded-t",
                      i === 6 ? "bg-oxblood" : "bg-ink/10"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-ink/40">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl border border-ink/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-navy">Recent Sessions</h2>
                <p className="text-sm text-ink/50">Most recent</p>
              </div>
              <select className="text-sm border border-ink/15 rounded-lg px-3 py-1.5 text-ink/70 bg-white">
                <option>All sessions</option>
              </select>
            </div>

            {sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.slice(0, 4).map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-parchment/30 hover:bg-parchment/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        session.isPassed ? "bg-sage" : "bg-red-400"
                      )} />
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {session.student?.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-ink/50">
                          {session.surah?.nameEnglish || "Unknown surah"}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-md",
                      session.isPassed
                        ? "bg-sage/10 text-sage"
                        : "bg-red-100 text-red-600"
                    )}>
                      {session.isPassed ? "Passed" : "Needs Work"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-ink/50 text-sm">No sessions recorded yet.</p>
                <p className="text-ink/40 text-xs mt-1">
                  Record a session to see it here
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
