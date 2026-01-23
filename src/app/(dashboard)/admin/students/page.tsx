"use client";

import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Mail, BookOpen, Loader2, UserPlus, X } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function StudentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");
  const teachers = useQuery(api.teachers.list, isAuthenticated ? {} : "skip");
  const createStudent = useMutation(api.students.create);
  const assignTeacher = useMutation(api.students.assignTeacher);
  const removeTeacher = useMutation(api.students.removeTeacher);

  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", teacherId: "" });
  const [error, setError] = useState("");

  // Track which student is being assigned a teacher
  const [assigningStudent, setAssigningStudent] = useState<string | null>(null);
  const [assigningTeacherId, setAssigningTeacherId] = useState<string>("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createStudent({
        name: formData.name,
        email: formData.email,
        teacherId: formData.teacherId ? formData.teacherId as Id<"teacherProfiles"> : undefined,
      });
      setFormData({ name: "", email: "", teacherId: "" });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignTeacher(studentId: string) {
    if (!assigningTeacherId) return;

    setAssigningLoading(true);
    try {
      await assignTeacher({
        studentId: studentId as Id<"studentProfiles">,
        teacherId: assigningTeacherId as Id<"teacherProfiles">,
        isPrimary: true,
      });
      setAssigningStudent(null);
      setAssigningTeacherId("");
    } catch (err) {
      console.error("Failed to assign teacher:", err);
    } finally {
      setAssigningLoading(false);
    }
  }

  async function handleRemoveTeacher(studentId: string, teacherId: string) {
    try {
      await removeTeacher({
        studentId: studentId as Id<"studentProfiles">,
        teacherId: teacherId as Id<"teacherProfiles">,
      });
    } catch (err) {
      console.error("Failed to remove teacher:", err);
    }
  }

  const loading = authLoading || students === undefined || teachers === undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Students</h1>
          <p className="text-ink/60 text-sm">Manage enrolled students and assign teachers</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-oxblood hover:bg-oxblood/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <Card className="border-gold/20 bg-white">
          <CardHeader>
            <CardTitle className="text-navy">Add New Student</CardTitle>
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
                    placeholder="e.g. Ahmad Ali"
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
                    placeholder="e.g. ahmad@email.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink/70 mb-1">
                    Assign Teacher
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
                  >
                    <option value="">No teacher assigned</option>
                    {teachers?.map((teacher) => (
                      <option
                        key={teacher._id}
                        value={teacher.profile?._id || ""}
                        disabled={!teacher.profile}
                      >
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-oxblood hover:bg-oxblood/90"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Student
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

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
        </div>
      ) : !students || students.length === 0 ? (
        <Card className="border-gold/20 bg-white">
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-ink/30 mb-4" />
            <h3 className="text-lg font-medium text-navy mb-2">No students yet</h3>
            <p className="text-ink/50 text-sm mb-4">
              Add your first student to get started
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-oxblood hover:bg-oxblood/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.filter((s): s is NonNullable<typeof s> => s !== null).map((student) => (
            <Card key={student._id} className="border-gold/20 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/10">
                    <GraduationCap className="h-7 w-7 text-sage" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy truncate">{student.user?.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-ink/50 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{student.user?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Teacher Assignment Section */}
                <div className="mt-4 pt-4 border-t border-gold/10">
                  <label className="block text-xs font-medium text-ink/50 mb-2">
                    Assigned Teacher
                  </label>

                  {"teachers" in student && Array.isArray(student.teachers) && student.teachers.length > 0 ? (
                    <div className="space-y-2">
                      {(student.teachers as any[]).map((teacher: any) => (
                        <div
                          key={teacher._id}
                          className="flex items-center justify-between bg-sage/10 px-3 py-2 rounded-lg"
                        >
                          <span className="text-sm font-medium text-navy">
                            {teacher.user?.name}
                          </span>
                          <button
                            onClick={() => handleRemoveTeacher(student._id, teacher._id)}
                            className="text-ink/40 hover:text-red-500 transition-colors"
                            title="Remove teacher"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : assigningStudent === student._id ? (
                    <div className="space-y-2">
                      <select
                        value={assigningTeacherId}
                        onChange={(e) => setAssigningTeacherId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oxblood/20"
                      >
                        <option value="">Select a teacher...</option>
                        {teachers?.map((teacher) => (
                          <option
                            key={teacher._id}
                            value={teacher.profile?._id || ""}
                            disabled={!teacher.profile}
                          >
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAssignTeacher(student._id)}
                          disabled={!assigningTeacherId || assigningLoading}
                          className="bg-oxblood hover:bg-oxblood/90"
                        >
                          {assigningLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAssigningStudent(null);
                            setAssigningTeacherId("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningStudent(student._id)}
                      className="flex items-center gap-2 text-sm text-oxblood hover:text-oxblood/80 font-medium"
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign Teacher
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gold/10 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-ink/50">
                    <BookOpen className="h-3 w-3" />
                    <span>{student.sessionCount} sessions</span>
                  </div>
                  <span className="text-sm text-sage font-medium">
                    {student.currentStreak} day streak
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
