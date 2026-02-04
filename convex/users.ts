import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { userRole } from "./schema";

// Get current user by Clerk ID
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    let identity;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch {
      return null;
    }
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Sync user from Clerk webhook
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Check if user exists by email (pre-created by admin)
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingByEmail) {
      // Link existing user to Clerk ID
      await ctx.db.patch(existingByEmail._id, {
        clerkId: args.clerkId,
        name: args.name,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existingByEmail._id;
    }

    // Create new user (default to STUDENT role - admin can change later)
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: "STUDENT",
      isActive: true,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    // Create student profile for new users
    await ctx.db.insert("studentProfiles", {
      userId,
      enrollmentDate: now,
      currentSurahId: 1,
      currentAyah: 1,
      currentStreak: 0,
      longestStreak: 0,
      primaryContact: "STUDENT",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Ensure a signed-in user exists in Convex (useful when webhooks aren't configured)
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    const email = identity.email;
    if (!email) {
      throw new Error("Email not available in identity");
    }

    const name =
      identity.name || email.split("@")[0] || "User";
    const imageUrl = typeof identity.picture === "string" ? identity.picture : undefined;

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    const now = Date.now();
    const centers = await ctx.db.query("centers").take(2);
    const defaultCenterId = centers.length === 1 ? centers[0]._id : undefined;

    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        clerkId: identity.subject,
        name,
        imageUrl,
        ...(existingByEmail.centerId ? {} : defaultCenterId ? { centerId: defaultCenterId } : {}),
        updatedAt: now,
      });
      return existingByEmail._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
      role: "STUDENT",
      isActive: true,
      imageUrl,
      ...(defaultCenterId ? { centerId: defaultCenterId } : {}),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("studentProfiles", {
      userId,
      enrollmentDate: now,
      currentSurahId: 1,
      currentAyah: 1,
      currentStreak: 0,
      longestStreak: 0,
      primaryContact: "STUDENT",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Delete user (called from Clerk webhook)
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      // Mark as inactive rather than delete to preserve data integrity
      await ctx.db.patch(user._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});

// Update user role (admin only)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: userRole,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      throw new Error("Only admins can update user roles");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Update role
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: now,
    });

    // Create appropriate profile if it doesn't exist
    if (args.role === "TEACHER") {
      const existingProfile = await ctx.db
        .query("teacherProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();

      if (!existingProfile) {
        await ctx.db.insert("teacherProfiles", {
          userId: args.userId,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else if (args.role === "STUDENT") {
      const existingProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();

      if (!existingProfile) {
        await ctx.db.insert("studentProfiles", {
          userId: args.userId,
          enrollmentDate: now,
          currentSurahId: 1,
          currentAyah: 1,
          currentStreak: 0,
          longestStreak: 0,
          primaryContact: "STUDENT",
          createdAt: now,
          updatedAt: now,
        });
      }
    } else if (args.role === "PARENT") {
      const existingProfile = await ctx.db
        .query("parentProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();

      if (!existingProfile) {
        await ctx.db.insert("parentProfiles", {
          userId: args.userId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return args.userId;
  },
});

// List users by role
export const listByRole = query({
  args: { role: userRole },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return [];
    }

    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});
