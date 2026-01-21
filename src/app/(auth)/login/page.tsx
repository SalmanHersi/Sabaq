"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, BookOpen, LogIn } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDevLoading, setIsDevLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Verification":
        return "The magic link has expired or already been used. Please request a new one.";
      case "AccessDenied":
        return "Your account has been deactivated. Please contact an administrator.";
      case "CredentialsSignin":
        return "Invalid email. Make sure the user exists in the database.";
      default:
        return error ? "An error occurred. Please try again." : "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
      } else if (result?.url) {
        // Redirect to verify-request page
        window.location.href = "/verify-request";
      }
    } catch {
      setErrorMessage("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsDevLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(getErrorMessage(result.error));
        setIsDevLoading(false);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setErrorMessage("An unexpected error occurred");
      setIsDevLoading(false);
    }
  };

  const displayError = errorMessage || getErrorMessage(error);

  return (
    <Card className="w-full max-w-md border-gold/20 bg-cream">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 text-oxblood">
            <BookOpen className="h-10 w-10" />
            <span className="text-2xl font-bold">Quran LMS</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-navy">Welcome Back</CardTitle>
        <CardDescription className="text-ink/60">
          {isDev ? "Enter your email to sign in" : "Enter your email to receive a magic sign-in link"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={isDev ? handleDevLogin : handleSubmit} className="space-y-4">
          {displayError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {displayError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-ink">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={isDev ? "teacher@alhikmah.com" : "you@example.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || isDevLoading}
              className="border-gold/30 focus:border-oxblood focus:ring-oxblood"
            />
          </div>

          {isDev ? (
            <Button
              type="submit"
              className="w-full bg-oxblood hover:bg-oxblood/90 text-white"
              disabled={isDevLoading}
            >
              {isDevLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In (Dev Mode)
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-oxblood hover:bg-oxblood/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Magic Link
                </>
              )}
            </Button>
          )}
        </form>

        {isDev ? (
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 font-medium">Development Mode</p>
            <p className="text-xs text-yellow-700 mt-1">
              Test accounts: teacher@alhikmah.com, student@alhikmah.com, admin@alhikmah.com
            </p>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-ink/50">
            <p>A secure sign-in link will be sent to your email.</p>
            <p className="mt-1">The link expires in 10 minutes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-oxblood" />
          <p className="mt-2 text-ink/60">Loading...</p>
        </CardContent>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
