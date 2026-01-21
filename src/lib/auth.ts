import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      centerId: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    centerId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    centerId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/login",
  },
  providers: [
    // Development credentials provider - allows login with just email
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            name: "Development Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "teacher@alhikmah.com" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                  centerId: true,
                  isActive: true,
                },
              });

              if (!user || !user.isActive) return null;

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                centerId: user.centerId,
              };
            },
          }),
        ]
      : []),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@quran-lms.com",
      maxAge: 10 * 60, // Magic link valid for 10 minutes
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if user exists and is active
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { isActive: true },
      });

      if (dbUser && !dbUser.isActive) {
        return false; // Reject deactivated users
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch full user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            centerId: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.centerId = dbUser.centerId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.centerId = token.centerId;
      }
      return session;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);

// Helper to check if user has specific role
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Permission types
export type Permission =
  | "view_all_students"
  | "create_teacher"
  | "create_student"
  | "record_session"
  | "create_assignment"
  | "view_own_progress"
  | "view_child_progress"
  | "manage_center_settings"
  | "generate_parent_code";

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "view_all_students",
    "create_teacher",
    "create_student",
    "record_session",
    "create_assignment",
    "view_own_progress",
    "manage_center_settings",
    "generate_parent_code",
  ],
  TEACHER: [
    "view_all_students",
    "create_student",
    "record_session",
    "create_assignment",
    "generate_parent_code",
  ],
  STUDENT: ["view_own_progress"],
  PARENT: ["view_child_progress"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
