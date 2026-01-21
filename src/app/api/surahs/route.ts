import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const surahs = await prisma.surah.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        nameArabic: true,
        nameEnglish: true,
        nameTranslit: true,
        totalAyahs: true,
        revelationType: true,
      },
    });

    return NextResponse.json(surahs);
  } catch (error) {
    console.error("Error fetching surahs:", error);
    return NextResponse.json(
      { error: "Failed to fetch surahs" },
      { status: 500 }
    );
  }
}
