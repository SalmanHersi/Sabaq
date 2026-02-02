"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardList, Plus, Loader2, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
          <p className="text-sm text-ink/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "My Students",
      value: studentCount,
      subtitle: "Assigned to you",
      icon: Users,
      iconColor: "text-oxblood",
      iconBg: "bg-oxblood/10",
      trend: null,
    },
    {
      title: "Sessions Today",
      value: sessionsToday,
      subtitle: "Recitations recorded",
      icon: BookOpen,
      iconColor: "text-sage",
      iconBg: "bg-sage/10",
      trend: sessionsToday > 0 ? "+active" : null,
    },
    {
      title: "Total Sessions",
      value: sessions?.length || 0,
      subtitle: "All time",
      icon: ClipboardList,
      iconColor: "text-gold",
      iconBg: "bg-gold/10",
      trend: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-oxblood/80">Welcome back</p>
          <h1 className="text-3xl font-bold text-navy font-[family-name:var(--font-display)] tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-ink/55">Manage your students and track their progress</p>
        </div>
        <Link href="/teacher/students">
          <Button size="lg" className="w-full sm:w-auto group">
            <Plus className="mr-2 h-4 w-4" />
            Record Session
            <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="group overflow-hidden"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-ink/60">
                {stat.title}
              </CardTitle>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                stat.iconBg
              )}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-navy font-[family-name:var(--font-display)]">
                  {stat.value}
                </div>
                {stat.trend && (
                  <span className="flex items-center text-xs font-medium text-sage mb-1">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink/45 mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Sessions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/teacher/students" className="block">
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center">
                  <Users className="mr-3 h-4 w-4 text-ink/50" />
                  View My Students
                </span>
                <ArrowRight className="h-4 w-4 text-ink/30 group-hover:text-ink/60 group-hover:translate-x-1 transition-all duration-200" />
              </Button>
            </Link>
            <Link href="/teacher/assignments" className="block">
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center">
                  <ClipboardList className="mr-3 h-4 w-4 text-ink/50" />
                  Manage Assignments
                </span>
                <ArrowRight className="h-4 w-4 text-ink/30 group-hover:text-ink/60 group-hover:translate-x-1 transition-all duration-200" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            {sessions && sessions.length > 3 && (
              <Link href="/teacher/sessions">
                <Button variant="ghost" size="sm" className="text-xs text-ink/50 hover:text-ink">
                  View all
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session, index) => (
                  <div
                    key={session._id}
                    className="flex justify-between items-center p-3 rounded-xl bg-parchment/50 hover:bg-parchment transition-colors duration-200"
                    style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        session.isPassed ? "bg-sage" : "bg-red-500"
                      )} />
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {session.student?.user?.name}
                        </p>
                        <p className="text-xs text-ink/50">
                          {session.surah?.nameEnglish}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-lg",
                      session.isPassed
                        ? "bg-sage/10 text-sage"
                        : "bg-red-100 text-red-600"
                    )}>
                      {session.isPassed ? "Passed" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                <p className="text-ink/50 text-sm">
                  No sessions recorded yet.
                </p>
                <p className="text-ink/40 text-xs mt-1">
                  Start by recording a student session.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
