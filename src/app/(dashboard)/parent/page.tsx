"use client";

import { useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakDisplay } from "@/components/progress/streak-display";
import { MilestoneBadges } from "@/components/progress/milestone-badges";
import { Users, BookOpen, Flame, Calendar, Award, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function ParentDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { role, isLoading: userLoading } = useCurrentUser();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Get all children for this parent - only query when authenticated
  const children = useQuery(
    api.parents.getChildren,
    isAuthenticated && role === "PARENT" ? {} : "skip"
  );

  // Get detailed summary for selected child
  const childSummary = useQuery(
    api.parents.getChildSummary,
    selectedChildId ? { studentId: selectedChildId as Id<"studentProfiles"> } : "skip"
  );

  // Set initial selected child
  if (children && children.length > 0 && !selectedChildId && children[0]) {
    setSelectedChildId(children[0]._id);
  }

  const loading = authLoading || userLoading || (role === "PARENT" && children === undefined);
  const summaryLoading = selectedChildId && childSummary === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  if (role && role !== "PARENT") {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Parent Dashboard</h1>
          <p className="text-ink/60 text-sm">Monitor your child&apos;s Quran memorization progress</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-ink/60">
              This area is only available to parent accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Parent Dashboard</h1>
        <p className="text-ink/60 text-sm">Monitor your child&apos;s Quran memorization progress</p>
      </div>

      {!children || children.length === 0 ? (
        <Card className="">
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
            <Card className="">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-ink/70">Select Child</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {children.filter((c): c is NonNullable<typeof c> => c !== null).map((child) => (
                    <button
                      key={child._id}
                      onClick={() => setSelectedChildId(child._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedChildId === child._id
                          ? "bg-oxblood text-white"
                          : "bg-cream text-ink hover:bg-gold/20"
                      }`}
                    >
                      {child.user?.name || "Child"}
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
                currentStreak={childSummary.summary.currentStreak}
                longestStreak={childSummary.summary.longestStreak}
                lastActiveDate={childSummary.student.lastActiveDate ? new Date(childSummary.student.lastActiveDate).toISOString() : null}
              />

              {/* Progress Stats */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Total Sessions</CardTitle>
                    <BookOpen className="h-4 w-4 text-sage" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.recentSessions.length}
                    </div>
                    <p className="text-xs text-ink/50">Recent recitations</p>
                  </CardContent>
                </Card>

                <Card className="">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Verses Memorized</CardTitle>
                    <Flame className="h-4 w-4 text-oxblood" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.summary.totalVersesMemorized}
                    </div>
                    <p className="text-xs text-ink/50">Total ayahs</p>
                  </CardContent>
                </Card>

                <Card className="">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Surahs Complete</CardTitle>
                    <Award className="h-4 w-4 text-gold" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.summary.surahsCompleted}
                    </div>
                    <p className="text-xs text-ink/50">Fully memorized</p>
                  </CardContent>
                </Card>

                <Card className="">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-ink/70">Milestones</CardTitle>
                    <Award className="h-4 w-4 text-sage" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-navy">
                      {childSummary.milestones.length}
                    </div>
                    <p className="text-xs text-ink/50">Badges earned</p>
                  </CardContent>
                </Card>
              </div>

              {/* Last Session */}
              {childSummary.recentSessions.length > 0 && (
                <Card className="">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-navy">
                      <Calendar className="h-5 w-5 text-gold" />
                      Last Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const lastSession = childSummary.recentSessions[0];
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-navy">
                              {lastSession.surah?.nameEnglish || "Unknown Surah"}
                              <span className="text-ink/50 ml-2 font-arabic">
                                {lastSession.surah?.nameArabic || ""}
                              </span>
                            </p>
                            <p className="text-sm text-ink/60">
                              {format(new Date(lastSession.sessionDate), "MMMM d, yyyy")}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                lastSession.isPassed
                                  ? "bg-sage/10 text-sage"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {lastSession.isPassed ? "Passed" : "Needs Practice"}
                            </span>
                            <p className="text-xs text-ink/50 mt-1">
                              Quality: {lastSession.quality.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Milestones */}
              <MilestoneBadges
                milestones={childSummary.milestones.map((m) => ({
                  id: m._id,
                  type: m.type,
                  surahId: m.surahNumber,
                  juzNumber: m.juzNumber,
                  earnedAt: new Date(m.earnedAt).toISOString(),
                }))}
              />
            </>
          ) : (
            <Card className="">
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
