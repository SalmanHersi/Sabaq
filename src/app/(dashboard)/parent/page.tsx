"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakDisplay } from "@/components/progress/streak-display";
import { MilestoneBadges } from "@/components/progress/milestone-badges";
import { Users, BookOpen, Flame, Calendar, Award, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Child {
  id: string;
  name: string;
  relationship: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalSessions: number;
}

interface ChildSummary {
  child: {
    id: string;
    name: string;
  };
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
  };
  progress: {
    totalSessions: number;
    totalVersesMemorized: number;
    memorizedSurahsCount: number;
    milestonesEarned: number;
  };
  lastSession: {
    date: string;
    surah: string;
    surahArabic: string;
    passed: boolean;
    quality: string;
  } | null;
}

interface Milestone {
  id: string;
  type: string;
  surahId?: number | null;
  juzNumber?: number | null;
  earnedAt: string;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childSummary, setChildSummary] = useState<ChildSummary | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChildren(data);
          if (data.length > 0) {
            setSelectedChild(data[0].id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedChild) {
      setSummaryLoading(true);
      Promise.all([
        fetch(`/api/parent/children/${selectedChild}/summary`).then((r) => r.json()),
        fetch(`/api/students/${selectedChild}/milestones`).then((r) => r.json()),
      ])
        .then(([summary, milestonesData]) => {
          if (summary && !summary.error) {
            setChildSummary(summary);
          }
          if (Array.isArray(milestonesData)) {
            setMilestones(milestonesData);
          }
          setSummaryLoading(false);
        })
        .catch(() => setSummaryLoading(false));
    }
  }, [selectedChild]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Parent Dashboard</h1>
        <p className="text-ink/60 text-sm">Monitor your child&apos;s Quran memorization progress</p>
      </div>

      {children.length === 0 ? (
        <Card className="border-gold/20 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Users className="h-5 w-5 text-oxblood" />
              My Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink/50 text-sm">
              No children linked yet. Use the access code provided by your child&apos;s
              teacher to link their account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Child Selector */}
          {children.length > 1 && (
            <Card className="border-gold/20 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-ink/70">Select Child</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedChild === child.id
                          ? "bg-oxblood text-white"
                          : "bg-cream text-ink hover:bg-gold/20"
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {summaryLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-oxblood" />
            </div>
          ) : childSummary ? (
            <>
              {/* Streak Display */}
              <StreakDisplay
                currentStreak={childSummary.streak.current}
                longestStreak={childSummary.streak.longest}
                lastActiveDate={childSummary.streak.lastActiveDate}
              />

              {/* Progress Stats */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-gold/20 bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Total Sessions</CardTitle>
                    <BookOpen className="h-4 w-4 text-sage" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.progress.totalSessions}
                    </div>
                    <p className="text-xs text-ink/50">Recitations recorded</p>
                  </CardContent>
                </Card>

                <Card className="border-gold/20 bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Verses Memorized</CardTitle>
                    <Flame className="h-4 w-4 text-oxblood" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.progress.totalVersesMemorized}
                    </div>
                    <p className="text-xs text-ink/50">Total ayahs</p>
                  </CardContent>
                </Card>

                <Card className="border-gold/20 bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Surahs Complete</CardTitle>
                    <Award className="h-4 w-4 text-gold" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.progress.memorizedSurahsCount}
                    </div>
                    <p className="text-xs text-ink/50">Fully memorized</p>
                  </CardContent>
                </Card>

                <Card className="border-gold/20 bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Milestones</CardTitle>
                    <Award className="h-4 w-4 text-sage" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.progress.milestonesEarned}
                    </div>
                    <p className="text-xs text-ink/50">Badges earned</p>
                  </CardContent>
                </Card>
              </div>

              {/* Last Session */}
              {childSummary.lastSession && (
                <Card className="border-gold/20 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-navy">
                      <Calendar className="h-5 w-5 text-gold" />
                      Last Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-navy">
                          {childSummary.lastSession.surah}
                          <span className="text-ink/50 ml-2 font-arabic">
                            {childSummary.lastSession.surahArabic}
                          </span>
                        </p>
                        <p className="text-sm text-ink/60">
                          {format(new Date(childSummary.lastSession.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            childSummary.lastSession.passed
                              ? "bg-sage/10 text-sage"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {childSummary.lastSession.passed ? "Passed" : "Needs Practice"}
                        </span>
                        <p className="text-xs text-ink/50 mt-1">
                          Quality: {childSummary.lastSession.quality.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Milestones */}
              <MilestoneBadges milestones={milestones} />
            </>
          ) : (
            <Card className="border-gold/20 bg-white">
              <CardContent className="py-8 text-center">
                <p className="text-ink/50">Unable to load child data</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
