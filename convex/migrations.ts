import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Create a default center
export const seedCenter = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if center already exists
    const existingCenter = await ctx.db.query("centers").first();
    if (existingCenter) {
      console.log("Center already exists");
      return existingCenter._id;
    }

    const now = Date.now();
    const centerId = await ctx.db.insert("centers", {
      name: "Al-Hikmah Quran Learning Center",
      isActive: true,
      allowRetesting: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Created default center:", centerId);
    return centerId;
  },
});

// Create sample users for testing
export const seedSampleUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get or create center
    let center = await ctx.db.query("centers").first();
    if (!center) {
      const centerId = await ctx.db.insert("centers", {
        name: "Al-Hikmah Quran Learning Center",
        isActive: true,
        allowRetesting: true,
        createdAt: now,
        updatedAt: now,
      });
      center = await ctx.db.get(centerId);
    }

    if (!center) {
      throw new Error("Failed to create center");
    }

    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@alhikmah.com"))
      .unique();

    if (existingAdmin) {
      console.log("Sample users already exist");
      return { seeded: false };
    }

    // Create admin user
    const adminId = await ctx.db.insert("users", {
      clerkId: "", // Will be linked when they sign up
      email: "admin@alhikmah.com",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
      centerId: center._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create teacher user
    const teacherId = await ctx.db.insert("users", {
      clerkId: "",
      email: "teacher@alhikmah.com",
      name: "Ustadh Ahmad",
      role: "TEACHER",
      isActive: true,
      centerId: center._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create teacher profile
    const teacherProfileId = await ctx.db.insert("teacherProfiles", {
      userId: teacherId,
      specialization: "Hifz & Tajweed",
      createdAt: now,
      updatedAt: now,
    });

    // Create student user
    const studentUserId = await ctx.db.insert("users", {
      clerkId: "",
      email: "student@alhikmah.com",
      name: "Yusuf Ibrahim",
      role: "STUDENT",
      isActive: true,
      centerId: center._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create student profile
    const studentProfileId = await ctx.db.insert("studentProfiles", {
      userId: studentUserId,
      enrollmentDate: now,
      currentSurahId: 1,
      currentAyah: 1,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Link teacher and student
    await ctx.db.insert("studentTeachers", {
      studentId: studentProfileId,
      teacherId: teacherProfileId,
      isPrimary: true,
      assignedAt: now,
    });

    // Create parent user
    const parentUserId = await ctx.db.insert("users", {
      clerkId: "",
      email: "parent@alhikmah.com",
      name: "Ibrahim Hassan",
      role: "PARENT",
      isActive: true,
      centerId: center._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create parent profile
    const parentProfileId = await ctx.db.insert("parentProfiles", {
      userId: parentUserId,
      phone: "+1234567890",
      createdAt: now,
      updatedAt: now,
    });

    // Link parent and student
    await ctx.db.insert("parentStudents", {
      parentId: parentProfileId,
      studentId: studentProfileId,
      relationship: "parent",
      linkedAt: now,
    });

    console.log("Created sample users successfully");
    return { seeded: true };
  },
});

// Run all seed migrations
export const runAllSeeds = mutation({
  args: {},
  handler: async (ctx) => {
    // Note: This mutation schedules internal mutations
    // For initial setup, run these via the Convex dashboard or CLI

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to run seeds");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "SUPER_ADMIN") {
      throw new Error("Only admins can run seed migrations");
    }

    // Schedule the internal mutations
    await ctx.scheduler.runAfter(0, internal.quran.seedSurahs, {});
    await ctx.scheduler.runAfter(100, internal.quran.seedAyahs, {});
    await ctx.scheduler.runAfter(200, internal.migrations.seedCenter, {});
    await ctx.scheduler.runAfter(300, internal.migrations.seedSampleUsers, {});

    return { scheduled: true };
  },
});

// Debug: Check all data in the system
export const debugAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const teacherProfiles = await ctx.db.query("teacherProfiles").collect();
    const studentProfiles = await ctx.db.query("studentProfiles").collect();
    const studentTeachers = await ctx.db.query("studentTeachers").collect();

    return {
      users: users.map(u => ({ _id: u._id, email: u.email, name: u.name, role: u.role })),
      teacherProfiles: teacherProfiles.map(t => ({ _id: t._id, userId: t.userId })),
      studentProfiles: studentProfiles.map(s => ({ _id: s._id, userId: s.userId })),
      studentTeachers,
    };
  },
});

// Promote a user to SUPER_ADMIN by email
export const promoteToAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      console.log(`User not found: ${args.email}`);
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(user._id, {
      role: "SUPER_ADMIN",
      updatedAt: Date.now(),
    });

    console.log(`Promoted ${args.email} to SUPER_ADMIN`);
    return { success: true, userId: user._id };
  },
});

// Migration helper to import data from PostgreSQL export
// This expects data to be passed in the specific format from a PostgreSQL export
export const importFromPostgres = internalMutation({
  args: {
    entityType: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    switch (args.entityType) {
      case "users": {
        const users = args.data as Array<{
          id: string;
          email: string;
          name: string;
          role: string;
          isActive: boolean;
          createdAt: string;
        }>;

        for (const user of users) {
          const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", user.email))
            .unique();

          if (!existing) {
            await ctx.db.insert("users", {
              clerkId: "",
              email: user.email,
              name: user.name,
              role: user.role as "SUPER_ADMIN" | "TEACHER" | "STUDENT" | "PARENT",
              isActive: user.isActive,
              createdAt: new Date(user.createdAt).getTime(),
              updatedAt: now,
            });
          }
        }
        break;
      }

      // Add more entity types as needed for full migration
      default:
        console.log(`Unknown entity type: ${args.entityType}`);
    }

    return { imported: true };
  },
});
