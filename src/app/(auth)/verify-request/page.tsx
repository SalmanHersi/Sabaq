"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, BookOpen } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <Card className="w-full max-w-md border-gold/20 bg-cream">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 text-oxblood">
            <BookOpen className="h-10 w-10" />
            <span className="text-2xl font-bold">Quran LMS</span>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-sage/20 p-4">
            <Mail className="h-8 w-8 text-sage" />
          </div>
        </div>
        <CardTitle className="text-2xl text-navy">Check your email</CardTitle>
        <CardDescription className="text-ink/60">
          A sign-in link has been sent to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 text-sm text-ink/70 bg-parchment rounded-lg p-4 border border-gold/20">
          <p>Click the link in the email to sign in to your account.</p>
          <p>The link will expire in <strong>10 minutes</strong>.</p>
          <p className="text-ink/50">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login">
            <Button variant="outline" className="w-full border-gold/30 hover:bg-cream hover:border-oxblood">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
