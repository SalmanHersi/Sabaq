"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SessionForm } from "@/components/sessions/session-form";
import { SessionList } from "@/components/sessions/session-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Loader2 } from "lucide-react";

interface Student {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  enrollmentDate: string;
}

interface Session {
  id: string;
  surahId: number;
  surah: {
    id: number;
    nameEnglish: string;
    nameArabic: string;
    totalAyahs?: number;
  };
  startAyah: number;
  endAyah: number;
  isPassed: boolean;
  quality: string;
  mistakeCount: number;
  mistakeAyahs?: number[];
  sessionType: string;
  sessionDate: string;
  notes?: string | null;
  student: {
    user: { name: string };
  };
  teacher: {
    user: { name: string };
  };
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/students`).then((r) => r.json()),
      fetch(`/api/sessions?studentId=${studentId}&limit=10`).then((r) => r.json()),
    ])
      .then(([studentsData, sessionsData]) => {
        const foundStudent = Array.isArray(studentsData)
          ? studentsData.find((s: Student) => s.id === studentId)
          : null;
        setStudent(foundStudent);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Student not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/teacher/students">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-navy truncate">{student.user.name}</h1>
            <p className="text-ink/60 text-sm truncate">{student.user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Session Form */}
        <div className="lg:col-span-2">
          <SessionForm
            studentId={student.id}
            studentName={student.user.name}
            onSuccess={fetchData}
          />
        </div>

        {/* Recent Sessions */}
        <SessionList
          sessions={sessions}
          title="Recent Sessions"
          emptyMessage="No sessions recorded yet."
        />
      </div>
    </div>
  );
}
