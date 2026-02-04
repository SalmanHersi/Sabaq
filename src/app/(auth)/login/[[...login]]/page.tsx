"use client";

import { SignIn } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-parchment">
      <div className="w-full max-w-[400px]">
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oxblood">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-navy">
            Welcome back
          </h1>
          <p className="text-ink/50 mt-1.5 text-sm">
            Sign in to continue your Quran learning journey
          </p>
        </div>

        {/* Auth Card */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "border border-ink/10 rounded-xl bg-white shadow-none",
              headerTitle: "text-navy font-semibold text-base",
              headerSubtitle: "text-ink/50 text-sm",
              socialButtonsBlockButton: "border-ink/10 hover:bg-parchment hover:border-ink/20 transition-colors rounded-lg h-11",
              socialButtonsBlockButtonText: "text-ink/70 font-medium text-sm",
              dividerLine: "bg-ink/10",
              dividerText: "text-ink/40 text-sm",
              formButtonPrimary: "bg-oxblood hover:bg-oxblood/90 shadow-none rounded-lg h-11 text-sm font-medium transition-colors",
              formFieldInput: "border-ink/10 focus:border-oxblood/50 focus:ring-1 focus:ring-oxblood/20 rounded-lg h-11 transition-colors",
              formFieldLabel: "text-ink/70 font-medium text-sm",
              footerActionLink: "text-oxblood hover:text-oxblood/80 font-medium",
              footerActionText: "text-ink/50 text-sm",
              identityPreviewEditButton: "text-oxblood hover:text-oxblood/80",
              formResendCodeLink: "text-oxblood hover:text-oxblood/80",
              footer: "bg-parchment/50",
            },
            layout: {
              socialButtonsPlacement: "top",
            },
          }}
          fallbackRedirectUrl="/"
        />

        {/* Footer */}
        <p className="text-center text-xs text-ink/40 mt-8">
          Sabaq - Quran Learning Platform
        </p>
      </div>
    </div>
  );
}
