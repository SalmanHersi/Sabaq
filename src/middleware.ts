import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Define which routes each role can access
const roleRoutes: Record<string, string[]> = {
  SUPER_ADMIN: ["/admin", "/teacher", "/student", "/parent"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
  PARENT: ["/parent"],
};

// Default redirect paths for each role
const roleDefaultPaths: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If no token, redirect to login (handled by withAuth)
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role as string;
    const allowedPaths = roleRoutes[userRole] || [];

    // Check if user has access to the current path
    const hasAccess = allowedPaths.some((allowedPath) =>
      path.startsWith(allowedPath)
    );

    if (!hasAccess) {
      // Redirect to user's default dashboard
      const defaultPath = roleDefaultPaths[userRole] || "/login";
      return NextResponse.redirect(new URL(defaultPath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
  ],
};
