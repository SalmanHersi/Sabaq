"use client";

import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, BookOpen, ClipboardList, ChevronRight, Loader2 } from "lucide-react";

export default function TeacherStudentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");

  if (authLoading || students === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">My Students</h1>
        <p className="text-ink/60 text-sm">Select a student to record a session or view progress</p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy">No students assigned</h3>
            <p className="text-ink/60">You don&apos;t have any students assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.filter((s): s is NonNullable<typeof s> => s !== null).map((student) => (
            <Link key={student._id} href={`/teacher/students/${student._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{student.user?.name}</h3>
                        <p className="text-sm text-ink/60 font-normal">{student.user?.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-oxblood" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-ink/60">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{student.sessionCount} sessions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClipboardList className="h-4 w-4" />
                      <span>{student.assignmentCount} assignments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
