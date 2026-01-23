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
import { Loader2, CheckCircle, XCircle, Minus, Plus, ArrowRight, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslit: string;
  totalAyahs: number;
}

interface SessionFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
  continueFrom?: {
    surahId: number;
    surahName: string;
    startAyah: number;
    endAyah: number;
  };
}

export function SessionForm({ studentId, studentName, onSuccess, continueFrom }: SessionFormProps) {
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

  // Get surah data for continueFrom
  const continueFromSurah = useQuery(
    api.quran.getSurah,
    continueFrom ? { surahNumber: continueFrom.surahId } : "skip"
  );

  // Initialize from continueFrom prop if provided
  useEffect(() => {
    if (continueFrom) {
      setStartAyah(continueFrom.startAyah);
      setEndAyah(continueFrom.endAyah);
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
      setEndAyah(continueFrom.endAyah);
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

          {/* Continue From Suggestion */}
          {continueFrom && !selectedSurah && continueFromSurah && (
            <button
              type="button"
              onClick={handleContinueFrom}
              className="w-full p-4 text-left border-2 border-dashed border-oxblood/30 rounded-lg hover:border-oxblood hover:bg-oxblood/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink/60">Continue from last session</p>
                  <p className="font-medium text-navy">
                    {continueFrom.surahName}: Verses {continueFrom.startAyah}-{continueFrom.endAyah}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-oxblood" />
              </div>
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
  );
}
