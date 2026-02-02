"use client";

import { SignIn } from "@clerk/nextjs";
import { BookOpen, Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-parchment bg-textured relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-oxblood/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-navy/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-oxblood/20 rounded-2xl blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-oxblood to-oxblood/90 shadow-[0_4px_16px_rgba(140,74,69,0.35)]">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-navy font-[family-name:var(--font-display)] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-ink/55 mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-gold" />
            <span>Continue your Quran learning journey</span>
          </p>
        </div>

        {/* Auth Card */}
        <div className="animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "border border-gold/15 shadow-[0_8px_32px_rgba(26,26,26,0.08)] rounded-2xl bg-white/90 backdrop-blur-sm",
                headerTitle: "text-navy font-[family-name:var(--font-display)] text-xl",
                headerSubtitle: "text-ink/55",
                socialButtonsBlockButton: "border-gold/20 hover:bg-cream/50 hover:border-gold/30 transition-all duration-200 rounded-xl",
                socialButtonsBlockButtonText: "text-ink/70 font-medium",
                dividerLine: "bg-gold/20",
                dividerText: "text-ink/40",
                formButtonPrimary: "bg-gradient-to-b from-oxblood to-oxblood/95 hover:from-oxblood/95 hover:to-oxblood/90 shadow-[0_2px_8px_rgba(140,74,69,0.25)] rounded-xl transition-all duration-200",
                formFieldInput: "border-gold/20 focus:border-oxblood/50 focus:ring-2 focus:ring-oxblood/20 rounded-xl transition-all duration-200",
                formFieldLabel: "text-ink/70 font-medium",
                footerActionLink: "text-oxblood hover:text-oxblood/80 font-medium",
                identityPreviewEditButton: "text-oxblood hover:text-oxblood/80",
                formResendCodeLink: "text-oxblood hover:text-oxblood/80",
                internal: "font-[family-name:var(--font-body)]",
              },
              layout: {
                socialButtonsPlacement: "top",
              },
            }}
            fallbackRedirectUrl="/"
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-ink/40 mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Quran LMS - Learning Platform
        </p>
      </div>
    </div>
  );
}
