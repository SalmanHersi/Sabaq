"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "../../convex/_generated/api";
import { Loader2, AlertCircle } from "lucide-react";

const roleRedirects: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: convexUser, isLoading } = useCurrentUser();
  const syncUser = useMutation(api.users.syncUser);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncAttempts = useRef(0);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    // Prevent infinite loop - max 3 sync attempts
    if (syncAttempts.current >= 3 && !convexUser) {
      setError("Unable to set up your account. Please check that your Clerk JWT template for Convex is configured correctly.");
      return;
    }

    // If signed in with Clerk but no Convex user, sync them
    if (isSignedIn && clerkUser && !isLoading && !convexUser && !syncing && !error) {
      setSyncing(true);
      syncAttempts.current += 1;
      syncUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "User",
        imageUrl: clerkUser.imageUrl,
      }).then(() => {
        setSyncing(false);
      }).catch((err) => {
        console.error("Failed to sync user:", err);
        setSyncing(false);
        setError("Failed to sync user account. Please try again.");
      });
      return;
    }

    // Redirect based on role once user exists
    if (convexUser?.role) {
      const redirectPath = roleRedirects[convexUser.role] || "/student";
      router.push(redirectPath);
    }
  }, [isLoaded, isSignedIn, clerkUser, convexUser, isLoading, syncing, error, router, syncUser]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream to-white">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-navy">Setup Error</h2>
          <p className="mt-2 text-ink/60">{error}</p>
          <button
            onClick={() => {
              setError(null);
              syncAttempts.current = 0;
            }}
            className="mt-4 px-4 py-2 bg-oxblood text-white rounded-md hover:bg-oxblood/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream to-white">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-oxblood mx-auto" />
        <p className="mt-4 text-ink/60">
          {syncing ? "Setting up your account..." : "Loading your dashboard..."}
        </p>
      </div>
    </div>
  );
}
