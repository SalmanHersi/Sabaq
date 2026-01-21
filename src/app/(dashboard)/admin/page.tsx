import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Admin Dashboard</h1>
        <p className="text-ink/60 text-sm">Welcome to Al-Hikmah Quran Learning Center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-oxblood" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">5</div>
            <p className="text-xs text-ink/50">Active instructors</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">42</div>
            <p className="text-xs text-ink/50">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Sessions Today</CardTitle>
            <BookOpen className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">12</div>
            <p className="text-xs text-ink/50">Recitation sessions</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">87%</div>
            <p className="text-xs text-ink/50">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-gold/20 bg-white">
        <CardHeader>
          <CardTitle className="text-navy">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-ink/50 text-sm">
            Activity feed will be displayed here once the database is set up.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
