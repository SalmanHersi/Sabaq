"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, BookOpen } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-parchment">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oxblood">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <div className="flex justify-center mb-5">
              <div className="rounded-full bg-sage/10 p-4">
                <Mail className="h-8 w-8 text-sage" />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-navy mb-2">
              Check your email
            </h1>
            <p className="text-ink/50 text-sm mb-6">
              A sign-in link has been sent to your email address
            </p>

            <div className="space-y-3 text-sm text-ink/60 bg-parchment/50 rounded-lg p-4 text-left mb-6">
              <p>Click the link in the email to sign in to your account.</p>
              <p>The link will expire in <span className="font-medium text-ink/70">10 minutes</span>.</p>
              <p className="text-ink/40">
                If you don&apos;t see the email, check your spam folder.
              </p>
            </div>

            <Link href="/login">
              <Button variant="outline" className="w-full h-11 border-ink/10 hover:bg-parchment hover:border-ink/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-ink/40 mt-8">
          Sabaq - Quran Learning Platform
        </p>
      </div>
    </div>
  );
}
