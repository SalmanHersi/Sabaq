"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslit: string;
  totalAyahs: number;
}

interface SurahSelectorProps {
  value?: number;
  onChange: (surah: Surah) => void;
}

export function SurahSelector({ value, onChange }: SurahSelectorProps) {
  const [open, setOpen] = useState(false);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/surahs")
      .then((res) => res.json())
      .then((data) => {
        setSurahs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedSurah = surahs.find((s) => s.id === value);

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
      surah.nameArabic.includes(search) ||
      surah.nameTranslit.toLowerCase().includes(search.toLowerCase()) ||
      surah.id.toString() === search
  );

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
        disabled={loading}
      >
        {loading ? (
          "Loading surahs..."
        ) : selectedSurah ? (
          <span className="flex items-center gap-2">
            <span className="font-medium">{selectedSurah.id}.</span>
            <span>{selectedSurah.nameEnglish}</span>
            <span className="text-ink/50">({selectedSurah.nameArabic})</span>
          </span>
        ) : (
          "Select a surah..."
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gold/30 bg-white shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-ink/40" />
              <Input
                placeholder="Search by name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredSurahs.length === 0 ? (
              <div className="p-4 text-center text-sm text-ink/50">
                No surah found
              </div>
            ) : (
              filteredSurahs.map((surah) => (
                <button
                  key={surah.id}
                  type="button"
                  onClick={() => {
                    onChange(surah);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-cream",
                    value === surah.id && "bg-green-50"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 text-green-600",
                      value === surah.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="w-8 font-medium text-ink/50">{surah.id}.</span>
                  <span className="flex-1 text-left">{surah.nameEnglish}</span>
                  <span className="text-ink/50">{surah.nameArabic}</span>
                  <span className="text-xs text-ink/40">({surah.totalAyahs} verses)</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
