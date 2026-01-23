"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const stats = useQuery(api.progress.getOverallStats, isAuthenticated ? {} : "skip");
  const teachers = useQuery(api.teachers.list, isAuthenticated ? {} : "skip");

  const loading = authLoading || stats === undefined || teachers === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Admin Dashboard</h1>
        <p className="text-ink/60 text-sm">Welcome to Al-Hikmah Quran Learning Center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/teachers">
          <Card className="border-gold/20 bg-white hover:border-oxblood/30 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-ink/70">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-oxblood" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{teachers?.length || 0}</div>
              <p className="text-xs text-ink/50">Active instructors</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/students">
          <Card className="border-gold/20 bg-white hover:border-sage/30 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-ink/70">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-sage" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-ink/50">Enrolled students</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Sessions Today</CardTitle>
            <BookOpen className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{stats?.todaySessions || 0}</div>
            <p className="text-xs text-ink/50">Recitation sessions</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Active Students</CardTitle>
            <TrendingUp className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{stats?.activeStudents || 0}</div>
            <p className="text-xs text-ink/50">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-gold/20 bg-white">
        <CardHeader>
          <CardTitle className="text-navy">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/teachers"
              className="flex items-center gap-3 p-3 rounded-lg border border-gold/20 hover:border-oxblood/30 hover:bg-oxblood/5 transition-colors"
            >
              <Users className="h-5 w-5 text-oxblood" />
              <span className="font-medium text-navy">Manage Teachers</span>
            </Link>
            <Link
              href="/admin/students"
              className="flex items-center gap-3 p-3 rounded-lg border border-gold/20 hover:border-sage/30 hover:bg-sage/5 transition-colors"
            >
              <GraduationCap className="h-5 w-5 text-sage" />
              <span className="font-medium text-navy">Manage Students</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
