import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Enum validators
export const userRole = v.union(
  v.literal("SUPER_ADMIN"),
  v.literal("TEACHER"),
  v.literal("STUDENT"),
  v.literal("PARENT")
);

export const assignmentStatus = v.union(
  v.literal("PENDING"),
  v.literal("IN_PROGRESS"),
  v.literal("COMPLETED"),
  v.literal("OVERDUE")
);

export const sessionType = v.union(
  v.literal("NEW_MEMORIZATION"),
  v.literal("REVISION"),
  v.literal("RE_TEST")
);

export const progressStatus = v.union(
  v.literal("NOT_STARTED"),
  v.literal("IN_PROGRESS"),
  v.literal("MEMORIZED"),
  v.literal("NEEDS_REVIEW")
);

export const qualityRating = v.union(
  v.literal("EXCELLENT"),
  v.literal("GOOD"),
  v.literal("NEEDS_IMPROVEMENT")
);

export const milestoneType = v.union(
  v.literal("SURAH_COMPLETE"),
  v.literal("JUZ_COMPLETE"),
  v.literal("STREAK_3"),
  v.literal("STREAK_7"),
  v.literal("STREAK_30"),
  v.literal("FIRST_SESSION")
);

export default defineSchema({
  // ============================================
  // USERS & AUTHENTICATION
  // ============================================
  users: defineTable({
    // Clerk user ID for authentication
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: userRole,
    isActive: v.boolean(),
    imageUrl: v.optional(v.string()),
    centerId: v.optional(v.id("centers")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_center", ["centerId"]),

  // ============================================
  // CENTER (Multi-tenancy)
  // ============================================
  centers: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    allowRetesting: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ============================================
  // ROLE-SPECIFIC PROFILES
  // ============================================
  teacherProfiles: defineTable({
    userId: v.id("users"),
    specialization: v.optional(v.string()),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  studentProfiles: defineTable({
    userId: v.id("users"),
    dateOfBirth: v.optional(v.number()),
    enrollmentDate: v.number(),
    currentSurahId: v.number(),
    currentAyah: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  parentProfiles: defineTable({
    userId: v.id("users"),
    phone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ============================================
  // RELATIONSHIP TABLES
  // ============================================
  studentTeachers: defineTable({
    studentId: v.id("studentProfiles"),
    teacherId: v.id("teacherProfiles"),
    isPrimary: v.boolean(),
    assignedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_teacher", ["teacherId"])
    .index("by_student_teacher", ["studentId", "teacherId"]),

  parentStudents: defineTable({
    parentId: v.id("parentProfiles"),
    studentId: v.id("studentProfiles"),
    relationship: v.string(),
    linkedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"])
    .index("by_parent_student", ["parentId", "studentId"]),

  parentAccessCodes: defineTable({
    code: v.string(),
    studentId: v.id("studentProfiles"),
    isUsed: v.boolean(),
    usedBy: v.optional(v.string()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_student", ["studentId"]),

  // ============================================
  // QURAN REFERENCE DATA
  // ============================================
  surahs: defineTable({
    surahNumber: v.number(),
    nameArabic: v.string(),
    nameEnglish: v.string(),
    nameTranslit: v.string(),
    totalAyahs: v.number(),
    revelationType: v.string(),
    orderInQuran: v.number(),
  })
    .index("by_surah_number", ["surahNumber"])
    .index("by_name", ["nameEnglish"]),

  ayahs: defineTable({
    surahId: v.id("surahs"),
    surahNumber: v.number(),
    ayahNumber: v.number(),
    textArabic: v.string(),
    textUthmani: v.optional(v.string()),
  })
    .index("by_surah", ["surahId"])
    .index("by_surah_ayah", ["surahNumber", "ayahNumber"]),

  // ============================================
  // CORE: SESSIONS & ASSIGNMENTS
  // ============================================
  recitationSessions: defineTable({
    studentId: v.id("studentProfiles"),
    teacherId: v.id("teacherProfiles"),
    surahId: v.id("surahs"),
    surahNumber: v.number(),
    startAyah: v.number(),
    endAyah: v.number(),
    sessionDate: v.number(),
    duration: v.optional(v.number()),
    mistakeCount: v.number(),
    // Detailed mistake tracking: which ayahs/words had mistakes
    mistakeDetails: v.optional(v.array(v.object({
      ayah: v.number(),
      wordIndex: v.optional(v.number()),
      wordText: v.optional(v.string()),
      type: v.union(v.literal("FORGOT_AYAH"), v.literal("WORD_MISTAKE")),
    }))),
    isPassed: v.boolean(),
    quality: qualityRating,
    sessionType: sessionType,
    notes: v.optional(v.string()),
    voided: v.boolean(),
    voidedAt: v.optional(v.number()),
    voidedBy: v.optional(v.string()),
    voidReason: v.optional(v.string()),
    assignmentId: v.optional(v.id("assignments")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_teacher", ["teacherId"])
    .index("by_session_date", ["sessionDate"])
    .index("by_surah", ["surahId"])
    .index("by_assignment", ["assignmentId"]),

  assignments: defineTable({
    studentId: v.id("studentProfiles"),
    teacherId: v.id("teacherProfiles"),
    title: v.string(),
    // Optional Quran-specific fields
    surahId: v.optional(v.id("surahs")),
    surahNumber: v.optional(v.number()),
    startAyah: v.optional(v.number()),
    endAyah: v.optional(v.number()),
    status: assignmentStatus,
    dueDate: v.optional(v.number()),
    instructions: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_teacher", ["teacherId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_surah", ["surahId"]),

  // ============================================
  // PROGRESS TRACKING
  // ============================================
  studentProgress: defineTable({
    studentId: v.id("studentProfiles"),
    surahId: v.id("surahs"),
    surahNumber: v.number(),
    memorizedRanges: v.array(v.object({
      start: v.number(),
      end: v.number(),
    })),
    totalVersesMem: v.number(),
    totalVersesInSurah: v.number(),
    status: progressStatus,
    lastReviewDate: v.optional(v.number()),
    avgMistakes: v.number(),
    sessionCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_surah", ["surahId"])
    .index("by_student_surah", ["studentId", "surahNumber"]),

  milestones: defineTable({
    studentId: v.id("studentProfiles"),
    type: milestoneType,
    surahNumber: v.optional(v.number()),
    juzNumber: v.optional(v.number()),
    earnedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_type", ["type"]),
});
