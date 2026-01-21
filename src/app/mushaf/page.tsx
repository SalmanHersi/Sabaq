"use client";

import { useState } from "react";
import { MushafSessionViewer, type MistakeDetail } from "@/components/quran/mushaf-session-viewer";

export default function MushafTestPage() {
  const [startAyah, setStartAyah] = useState<number | null>(null);
  const [endAyah, setEndAyah] = useState<number | null>(null);
  const [mistakeDetails, setMistakeDetails] = useState<MistakeDetail[]>([]);

  const handleRangeChange = (start: number, end: number) => {
    setStartAyah(start);
    setEndAyah(end);
    // Clear mistakes when range changes
    setMistakeDetails([]);
  };

  return (
    <div className="min-h-screen bg-stone-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            المصحف الشريف
          </h1>
          <p className="text-stone-500">
            Mushaf Session Viewer - Select Range & Mark Mistakes
          </p>
        </div>

        <MushafSessionViewer
          surahId={1}
          startAyah={startAyah}
          endAyah={endAyah}
          onRangeChange={handleRangeChange}
          mistakeDetails={mistakeDetails}
          onMistakeDetailsChange={setMistakeDetails}
          mode="select"
          fontVersion="v1"
        />

        {/* Debug output */}
        <div className="mt-8 p-4 bg-white rounded-lg border text-sm font-mono">
          <h3 className="font-bold mb-2">Debug State:</h3>
          <p>Selection: {startAyah || "none"} → {endAyah || "none"}</p>
          <p>Mistakes: {mistakeDetails.length}</p>
          {mistakeDetails.length > 0 && (
            <pre className="mt-2 text-xs bg-stone-50 p-2 rounded overflow-auto">
              {JSON.stringify(mistakeDetails, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
