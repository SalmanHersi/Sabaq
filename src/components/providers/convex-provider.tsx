"use client";

import { ReactNode, Component, ErrorInfo, useEffect } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Create Convex client only if URL is available
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

interface ConvexClientProviderProps {
  children: ReactNode;
}

function ConfigError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Configuration Error</h2>
        <p className="text-red-800 mb-4">{message}</p>
        <div className="text-left text-sm bg-red-100 p-3 rounded">
          <p><strong>CONVEX_URL:</strong> {convexUrl ? "✓ Set" : "✗ Missing"}</p>
          <p><strong>CLERK_KEY:</strong> {clerkPubKey ? "✓ Set" : "✗ Missing"}</p>
        </div>
      </div>
    </div>
  );
}

// Simple Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ProviderErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Provider Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ConfigError message={this.state.error?.message || "An unexpected error occurred"} />;
    }
    return this.props.children;
  }
}

function UserBootstrap() {
  const { isLoaded, isSignedIn } = useAuth();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      ensureCurrentUser().catch((error) => {
        console.error("Failed to sync user:", error);
      });
    }
  }, [isLoaded, isSignedIn, ensureCurrentUser]);

  return null;
}

function useAuthWithConvexFallback() {
  const auth = useAuth();

  const getToken = async (options?: { template?: string; skipCache?: boolean }) => {
    try {
      return await auth.getToken({ template: "convex", skipCache: options?.skipCache });
    } catch {
      return await auth.getToken({ skipCache: options?.skipCache });
    }
  };

  return { ...auth, getToken };
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  // Check for missing environment variables
  if (!convexUrl || !convex) {
    return (
      <ConfigError message="Missing NEXT_PUBLIC_CONVEX_URL environment variable. Please check your Vercel environment settings." />
    );
  }

  if (!clerkPubKey) {
    return (
      <ConfigError message="Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. Please check your Vercel environment settings." />
    );
  }

  return (
    <ProviderErrorBoundary>
      <ClerkProvider
        publishableKey={clerkPubKey}
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuthWithConvexFallback}>
          <UserBootstrap />
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ProviderErrorBoundary>
  );
}
