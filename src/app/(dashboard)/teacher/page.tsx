import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Teacher Dashboard</h1>
          <p className="text-ink/60 text-sm">Manage your students and sessions</p>
        </div>
        <Link href="/teacher/students">
          <Button className="w-full sm:w-auto">
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
            <div className="text-2xl font-bold text-navy">8</div>
            <p className="text-xs text-ink/50">Assigned to you</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Sessions Today</CardTitle>
            <BookOpen className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">3</div>
            <p className="text-xs text-ink/50">Recitations recorded</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ink/70">Pending Assignments</CardTitle>
            <ClipboardList className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">5</div>
            <p className="text-xs text-ink/50">Awaiting completion</p>
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
            <Link href="/teacher/sessions" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Sessions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-white">
          <CardHeader>
            <CardTitle className="text-navy">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink/50 text-sm">
              Your recent sessions will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
