"use client";

import { SignUp } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-cream to-white">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 text-oxblood">
            <BookOpen className="h-10 w-10" />
            <span className="text-2xl font-bold">Quran LMS</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-navy">Create Account</h1>
        <p className="text-ink/60 mt-2">Join our Quran learning community</p>
      </div>

      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "border-gold/20 shadow-lg",
            headerTitle: "text-navy",
            headerSubtitle: "text-ink/60",
            socialButtonsBlockButton: "border-gold/30 hover:bg-cream",
            formButtonPrimary: "bg-oxblood hover:bg-oxblood/90",
            formFieldInput: "border-gold/30 focus:border-oxblood focus:ring-oxblood",
            footerActionLink: "text-oxblood hover:text-oxblood/80",
          },
        }}
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
