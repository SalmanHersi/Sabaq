"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, BookOpen, ClipboardList, ChevronRight, Loader2, Search } from "lucide-react";

export default function TeacherStudentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");
  const [search, setSearch] = useState("");

  if (authLoading || students === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const list = students.filter((s): s is NonNullable<typeof s> => s !== null);

    if (!normalizedSearch) {
      return list;
    }

    return list.filter((student) => {
      const name = student.user?.name?.toLowerCase() || "";
      const email = student.primaryContactEmail?.toLowerCase()
        || student.user?.email?.toLowerCase()
        || "";
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Students</h1>
        <p className="text-ink/60 text-sm">
          Browse all students in your organization and record sessions
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-gold/20 bg-white px-9 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-oxblood/20"
          placeholder="Search by student name or email"
        />
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy">No students found</h3>
            <p className="text-ink/60">No students are available in your organization yet.</p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy">No matches</h3>
            <p className="text-ink/60">Try a different name or email.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const contactEmail = student.primaryContactEmail || student.user?.email;
            const contactLabel = student.primaryContact === "PARENT" ? "Parent" : "Student";

            return (
              <Link key={student._id} href={`/teacher/students/${student._id}`}>
                <Card className="hover:border-ink/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.user?.name}</h3>
                          <p className="text-sm text-ink/60 font-normal">
                            {contactEmail}
                            <span className="text-xs text-ink/40 ml-1">({contactLabel})</span>
                          </p>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
