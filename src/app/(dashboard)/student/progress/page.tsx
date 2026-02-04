"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { QuranProgressGrid } from "@/components/progress/quran-progress-grid";
import { Loader2, Sparkles } from "lucide-react";

export default function StudentProgressPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const studentProfile = useQuery(api.students.getMine, isAuthenticated ? {} : "skip");

  if (authLoading || studentProfile === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
          <p className="text-sm text-ink/50">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-ink/50">No student profile found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <p className="text-sm font-medium text-gold">Your Journey</p>
        </div>
        <h1 className="text-3xl font-bold text-navy font-[family-name:var(--font-display)] tracking-tight">
          My Progress
        </h1>
        <p className="text-ink/55">See what you&apos;ve memorized and what&apos;s next</p>
      </div>

      <QuranProgressGrid studentId={studentProfile._id} />
    </div>
  );
}
