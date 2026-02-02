"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { SurahSelector } from "@/components/quran/surah-selector";
import { MushafSessionViewer, type MistakeDetail } from "@/components/quran/mushaf-session-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Minus,
  Plus,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  History,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslit: string;
  totalAyahs: number;
}

interface LastSessionData {
  surahId: number;
  surahName: string;
  surahNameArabic: string;
  startAyah: number;
  endAyah: number;
  totalAyahs: number;
  isPassed: boolean;
  mistakeCount: number;
  mistakeDetails?: MistakeDetail[];
  sessionType: string;
  sessionDate: string;
}

interface SessionFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
  lastSession?: LastSessionData;
  continueFrom?: {
    surahId: number;
    surahName: string;
    startAyah: number;
    endAyah?: number; // Optional - if not provided, just suggesting a starting point
    sessionType: "NEW_MEMORIZATION" | "REVISION" | "RE_TEST";
    isRetest?: boolean;
    isNextSurah?: boolean; // Flag when suggesting next surah (name needs to be fetched)
  };
}

export function SessionForm({ studentId, studentName, onSuccess, lastSession, continueFrom }: SessionFormProps) {
  const router = useRouter();
  const createSession = useMutation(api.sessions.create);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(1);
  const [isPassed, setIsPassed] = useState<boolean | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [sessionType, setSessionType] = useState<"NEW_MEMORIZATION" | "REVISION" | "RE_TEST">("NEW_MEMORIZATION");
  const [notes, setNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQuranViewer, setShowQuranViewer] = useState(false);
  const [mistakeDetails, setMistakeDetails] = useState<MistakeDetail[]>([]);
  const [showLastSession, setShowLastSession] = useState(false);

  // Get surah data for continueFrom
  const continueFromSurah = useQuery(
    api.quran.getSurah,
    continueFrom ? { surahNumber: continueFrom.surahId } : "skip"
  );

  // Get surah data for last session viewer
  const lastSessionSurah = useQuery(
    api.quran.getSurah,
    lastSession ? { surahNumber: lastSession.surahId } : "skip"
  );

  // Initialize from continueFrom prop if provided
  useEffect(() => {
    if (continueFrom) {
      setStartAyah(continueFrom.startAyah);
      setEndAyah(continueFrom.endAyah ?? continueFrom.startAyah);
      setSessionType(continueFrom.sessionType);
    }
  }, [continueFrom]);

  const handleSurahChange = (surah: Surah) => {
    setSelectedSurah(surah);
    setStartAyah(1);
    setEndAyah(1);
    setMistakeDetails([]);
    setMistakeCount(0);
  };

  const handleContinueFrom = () => {
    if (continueFromSurah && continueFrom) {
      setSelectedSurah({
        id: continueFromSurah.surahNumber,
        nameArabic: continueFromSurah.nameArabic,
        nameEnglish: continueFromSurah.nameEnglish,
        nameTranslit: continueFromSurah.nameTranslit,
        totalAyahs: continueFromSurah.totalAyahs,
      });
      setStartAyah(continueFrom.startAyah);
      // If no endAyah provided, just set to startAyah (teacher will adjust)
      const suggestedEnd = continueFrom.endAyah ?? continueFrom.startAyah;
      setEndAyah(Math.min(suggestedEnd, continueFromSurah.totalAyahs));
      setSessionType(continueFrom.sessionType);
      setShowQuranViewer(true);
      setShowLastSession(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurah) {
      setError("Please select a surah");
      return;
    }
    if (isPassed === null) {
      setError("Please mark as Pass or Fail");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await createSession({
        studentId: studentId as Id<"studentProfiles">,
        surahNumber: selectedSurah.id,
        startAyah,
        endAyah,
        isPassed,
        mistakeCount,
        mistakeDetails: mistakeDetails.length > 0 ? mistakeDetails : undefined,
        sessionType,
        notes: notes || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedSurah(null);
        setStartAyah(1);
        setEndAyah(1);
        setIsPassed(null);
        setMistakeCount(0);
        setMistakeDetails([]);
        setNotes("");
        onSuccess?.();
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record session");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="border-sage/30">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-sage mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-sage">Session Recorded!</h3>
          <p className="text-ink/60">Progress has been updated.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last Session Summary Card */}
      {lastSession && showLastSession && (
        <Card className={cn(
          "border-2 transition-all duration-200",
          lastSession.isPassed
            ? "border-sage/30 bg-sage/5"
            : "border-amber-300 bg-amber-50"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Last Session
              {!lastSession.isPassed && (
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Needs Re-test
                </span>
              )}
              {lastSession.isPassed && (
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Passed
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">{lastSession.surahName}</p>
                <p className="text-sm text-ink/60">
                  Verses {lastSession.startAyah} - {lastSession.endAyah}
                  <span className="mx-2">|</span>
                  {lastSession.mistakeCount} mistake{lastSession.mistakeCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-ink/40 mt-1">
                  {new Date(lastSession.sessionDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLastSession(false)}
                className="text-xs text-ink/50"
              >
                Hide
              </Button>
            </div>

            {/* Last Session Quran Viewer */}
            {lastSessionSurah && (
              <div className="border border-gold/20 rounded-lg overflow-hidden">
                <MushafSessionViewer
                  surahId={lastSession.surahId}
                  startAyah={lastSession.startAyah}
                  endAyah={lastSession.endAyah}
                  mistakeDetails={lastSession.mistakeDetails || []}
                  mode="view"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Session Form Card */}
      <Card className="border-gold/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-navy">Record Session for {studentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Smart Continue Suggestion */}
            {continueFrom && !selectedSurah && continueFromSurah && (
              <button
                type="button"
                onClick={handleContinueFrom}
                className={cn(
                  "w-full p-4 text-left border-2 border-dashed rounded-xl transition-all duration-200",
                  continueFrom.isRetest
                    ? "border-amber-300 hover:border-amber-400 hover:bg-amber-50 bg-amber-50/50"
                    : "border-sage/40 hover:border-sage hover:bg-sage/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {continueFrom.isRetest ? (
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <RotateCcw className="h-5 w-5 text-amber-600" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-sage/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-sage" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink/70">
                        {continueFrom.isRetest ? "Re-test Required" : "Continue Learning"}
                      </p>
                      <p className="font-semibold text-navy">
                        {continueFrom.isNextSurah && continueFromSurah
                          ? continueFromSurah.nameEnglish
                          : continueFrom.surahName}
                        {continueFrom.isRetest && continueFrom.endAyah
                          ? `: Verses ${continueFrom.startAyah}-${continueFrom.endAyah}`
                          : `: Starting from Verse ${continueFrom.startAyah}`}
                      </p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {continueFrom.isRetest
                          ? "Student needs to re-do this section"
                          : continueFrom.isNextSurah
                            ? "Start the next surah"
                            : "Continue where they left off"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={cn(
                    "h-5 w-5",
                    continueFrom.isRetest ? "text-amber-500" : "text-sage"
                  )} />
                </div>
              </button>
            )}

            {/* Show last session toggle if hidden */}
            {lastSession && !showLastSession && !selectedSurah && (
              <button
                type="button"
                onClick={() => setShowLastSession(true)}
                className="w-full p-3 text-sm text-ink/60 hover:text-ink border border-dashed border-gold/30 rounded-lg hover:bg-cream/50 transition-colors flex items-center justify-center gap-2"
              >
                <History className="h-4 w-4" />
                Show last session
              </button>
            )}

            {/* Surah Selection */}
            <div className="space-y-2">
              <Label className="text-ink">Surah</Label>
              <SurahSelector
                value={selectedSurah?.id}
                onChange={handleSurahChange}
              />
            </div>

            {/* Verse Range - Simplified */}
            {selectedSurah && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-ink">Start Verse</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedSurah.totalAyahs}
                      value={startAyah}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setStartAyah(val);
                        if (val > endAyah) setEndAyah(val);
                      }}
                      className="border-gold/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-ink">End Verse</Label>
                    <Input
                      type="number"
                      min={startAyah}
                      max={selectedSurah.totalAyahs}
                      value={endAyah}
                      onChange={(e) => setEndAyah(parseInt(e.target.value) || startAyah)}
                      className="border-gold/30"
                    />
                  </div>
                </div>
                <p className="text-xs text-ink/50">
                  {selectedSurah.nameEnglish} has {selectedSurah.totalAyahs} verses
                  {startAyah && endAyah && (
                    <span className="text-oxblood font-medium"> | Recording {endAyah - startAyah + 1} verses</span>
                  )}
                </p>

                {/* Quran Viewer Toggle */}
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-oxblood hover:text-oxblood/80 font-medium"
                  onClick={() => setShowQuranViewer(!showQuranViewer)}
                >
                  <BookOpen className="h-4 w-4" />
                  {showQuranViewer ? "Hide" : "View"} Quran Text
                  {showQuranViewer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Mushaf Viewer */}
                {showQuranViewer && (
                  <div className="border border-gold/20 rounded-lg overflow-hidden">
                    <MushafSessionViewer
                      surahId={selectedSurah.id}
                      startAyah={startAyah}
                      endAyah={endAyah}
                      mistakeDetails={mistakeDetails}
                      onRangeChange={(start, end) => {
                        setStartAyah(start);
                        setEndAyah(end);
                      }}
                      onMistakeDetailsChange={(mistakes) => {
                        setMistakeDetails(mistakes);
                        setMistakeCount(mistakes.length);
                      }}
                      mode="select"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Mistake Counter */}
            <div className="space-y-2">
              <Label className="text-ink">Mistakes</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-gold/30"
                  onClick={() => {
                    const newCount = Math.max(0, mistakeCount - 1);
                    setMistakeCount(newCount);
                    if (newCount < mistakeDetails.length) {
                      setMistakeDetails(mistakeDetails.slice(0, newCount));
                    }
                  }}
                  disabled={mistakeCount === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold text-navy w-12 text-center">
                  {mistakeCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-gold/30"
                  onClick={() => setMistakeCount(mistakeCount + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-ink/50">
                  {mistakeCount === 0 && "Excellent!"}
                  {mistakeCount >= 1 && mistakeCount <= 2 && "Good"}
                  {mistakeCount >= 3 && "Needs Improvement"}
                </span>
              </div>
              {mistakeDetails.length > 0 && (
                <p className="text-xs text-oxblood">
                  {mistakeDetails.length} mistake{mistakeDetails.length !== 1 ? "s" : ""} marked in Quran viewer
                </p>
              )}
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              className="text-sm text-ink/50 hover:text-ink underline"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide" : "Show"} advanced options
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-cream rounded-lg">
                {/* Session Type */}
                <div className="space-y-2">
                  <Label className="text-ink">Session Type</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "NEW_MEMORIZATION", label: "New" },
                      { value: "REVISION", label: "Revision" },
                      { value: "RE_TEST", label: "Re-test" },
                    ].map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={sessionType === type.value ? "default" : "outline"}
                        size="sm"
                        className={sessionType === type.value ? "bg-oxblood hover:bg-oxblood/90" : "border-gold/30"}
                        onClick={() => setSessionType(type.value as typeof sessionType)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-ink">Notes (optional)</Label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-oxblood"
                    placeholder="Any notes about this session..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Pass/Fail Toggle - Big Buttons (at bottom before submit) */}
            <div className="space-y-2 pt-2 border-t border-gold/20">
              <Label className="text-ink font-semibold">Result</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={isPassed === true ? "default" : "outline"}
                  className={`h-16 text-lg font-semibold ${
                    isPassed === true
                      ? "bg-sage hover:bg-sage/90 text-white"
                      : "border-sage/30 text-sage hover:bg-sage/10"
                  }`}
                  onClick={() => setIsPassed(true)}
                >
                  <CheckCircle className="mr-2 h-6 w-6" />
                  PASS
                </Button>
                <Button
                  type="button"
                  variant={isPassed === false ? "default" : "outline"}
                  className={`h-16 text-lg font-semibold ${
                    isPassed === false
                      ? "bg-red-600 hover:bg-red-600/90 text-white"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                  onClick={() => setIsPassed(false)}
                >
                  <XCircle className="mr-2 h-6 w-6" />
                  FAIL
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-oxblood hover:bg-oxblood/90"
              disabled={isSubmitting || !selectedSurah || isPassed === null}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Session"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
