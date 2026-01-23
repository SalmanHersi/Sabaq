"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardList, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Get teacher's students
  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");

  // Get teacher's sessions
  const sessions = useQuery(api.sessions.list, isAuthenticated ? { limit: 10 } : "skip");

  const loading = authLoading || students === undefined || sessions === undefined;

  // Calculate stats
  const studentCount = students?.length || 0;

  // Count today's sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const sessionsToday = sessions?.filter(s => s.sessionDate >= todayMs).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Teacher Dashboard</h1>
          <p className="text-ink/60 text-sm">Manage your students and sessions</p>
        </div>
        <Link href="/teacher/students">
          <Button className="w-full sm:w-auto bg-oxblood hover:bg-oxblood/90">
            <Plus className="mr-2 h-4 w-4" />
            Record Session
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">My Students</CardTitle>
            <Users className="h-4 w-4 text-oxblood" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{studentCount}</div>
            <p className="text-xs text-ink/50">Assigned to you</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Sessions Today</CardTitle>
            <BookOpen className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{sessionsToday}</div>
            <p className="text-xs text-ink/50">Recitations recorded</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Total Sessions</CardTitle>
            <ClipboardList className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{sessions?.length || 0}</div>
            <p className="text-xs text-ink/50">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-gold/20 bg-white">
          <CardHeader>
            <CardTitle className="text-navy">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/teacher/students" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                View My Students
              </Button>
            </Link>
            <Link href="/teacher/assignments" className="block">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="mr-2 h-4 w-4" />
                Manage Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader>
            <CardTitle className="text-navy">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session._id} className="flex justify-between items-center text-sm">
                    <span className="text-navy">
                      {session.student?.user?.name} - {session.surah?.nameEnglish}
                    </span>
                    <span className={session.isPassed ? "text-sage" : "text-red-500"}>
                      {session.isPassed ? "Passed" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink/50 text-sm">
                No sessions recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
