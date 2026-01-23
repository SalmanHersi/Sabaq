"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCircle, Mail, Users, Loader2, Link2, Copy, Check } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  teacherProfile: {
    specialization: string | null;
    _count?: {
      students: number;
    };
  } | null;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", specialization: "" });
  const [error, setError] = useState("");

  // Login link state
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [loginLinks, setLoginLinks] = useState<Record<string, string>>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      const res = await fetch("/api/teachers");
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newTeacher = await res.json();
        setTeachers([...teachers, newTeacher]);
        setFormData({ name: "", email: "", specialization: "" });
        setShowAddForm(false);

        // Auto-generate login link for new teacher
        generateLoginLink(newTeacher.email);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create teacher");
      }
    } catch (err) {
      setError("Failed to create teacher");
    } finally {
      setSubmitting(false);
    }
  }

  async function generateLoginLink(email: string) {
    setGeneratingLink(email);
    try {
      const res = await fetch("/api/auth/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        setLoginLinks(prev => ({ ...prev, [email]: data.magicLink }));
      } else {
        const data = await res.json();
        console.error("Failed to generate link:", data.error);
      }
    } catch (err) {
      console.error("Failed to generate link:", err);
    } finally {
      setGeneratingLink(null);
    }
  }

  async function copyToClipboard(email: string, link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Teachers</h1>
          <p className="text-ink/60 text-sm">Manage your teaching staff</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-oxblood hover:bg-oxblood/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <Card className="border-gold/20 bg-white">
          <CardHeader>
            <CardTitle className="text-navy">Add New Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink/70 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
                    placeholder="e.g. Sheikh Ahmad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink/70 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
                    placeholder="e.g. ahmad@alhikmah.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink/70 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
                    placeholder="e.g. Tajweed, Hifz"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-oxblood hover:bg-oxblood/90"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Teacher
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Teachers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
        </div>
      ) : teachers.length === 0 ? (
        <Card className="border-gold/20 bg-white">
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-ink/30 mb-4" />
            <h3 className="text-lg font-medium text-navy mb-2">No teachers yet</h3>
            <p className="text-ink/50 text-sm mb-4">
              Add your first teacher to get started
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-oxblood hover:bg-oxblood/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="border-gold/20 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood/10">
                    <UserCircle className="h-7 w-7 text-oxblood" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy truncate">{teacher.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-ink/50 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    {teacher.teacherProfile?.specialization && (
                      <p className="text-sm text-ink/60 mt-1">
                        {teacher.teacherProfile.specialization}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-sage mt-2">
                      <Users className="h-3 w-3" />
                      <span>
                        {teacher.teacherProfile?._count?.students || 0} students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Login Link Section */}
                <div className="mt-4 pt-4 border-t border-gold/10">
                  {loginLinks[teacher.email] ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={loginLinks[teacher.email]}
                          className="flex-1 text-xs px-2 py-1.5 bg-parchment border border-gold/20 rounded truncate"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(teacher.email, loginLinks[teacher.email])}
                          className="shrink-0"
                        >
                          {copiedEmail === teacher.email ? (
                            <Check className="h-3 w-3 text-sage" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-ink/50">
                        Share this link with the teacher to let them sign in. Expires in 24h.
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateLoginLink(teacher.email)}
                      disabled={generatingLink === teacher.email}
                      className="w-full"
                    >
                      {generatingLink === teacher.email ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="h-3 w-3 mr-2" />
                      )}
                      Generate Login Link
                    </Button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      teacher.isActive
                        ? "bg-sage/10 text-sage"
                        : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {teacher.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
