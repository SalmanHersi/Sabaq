"use client";

import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurahSelector } from "@/components/quran/surah-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Plus,
  Loader2,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslit: string;
  totalAyahs: number;
}

type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-100", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bgColor: "bg-blue-100", icon: ClipboardList },
  COMPLETED: { label: "Completed", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle },
  OVERDUE: { label: "Overdue", color: "text-red-700", bgColor: "bg-red-100", icon: AlertCircle },
};

export default function TeacherAssignmentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const students = useQuery(api.students.list, isAuthenticated ? {} : "skip");
  const assignments = useQuery(api.assignments.list, isAuthenticated ? { includeCompleted: true } : "skip");

  const createAssignment = useMutation(api.assignments.create);
  const updateStatus = useMutation(api.assignments.updateStatus);
  const deleteAssignment = useMutation(api.assignments.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [title, setTitle] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(1);
  const [dueDate, setDueDate] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [includeQuranRange, setIncludeQuranRange] = useState(false);

  const loading = authLoading || students === undefined || assignments === undefined;

  const resetForm = () => {
    setSelectedStudent("");
    setTitle("");
    setSelectedSurah(null);
    setStartAyah(1);
    setEndAyah(1);
    setDueDate("");
    setInstructions("");
    setIncludeQuranRange(false);
  };

  const handleCreate = async () => {
    if (!selectedStudent || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await createAssignment({
        studentId: selectedStudent as Id<"studentProfiles">,
        title: title.trim(),
        surahNumber: includeQuranRange && selectedSurah ? selectedSurah.id : undefined,
        startAyah: includeQuranRange && selectedSurah ? startAyah : undefined,
        endAyah: includeQuranRange && selectedSurah ? endAyah : undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        instructions: instructions.trim() || undefined,
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (assignmentId: Id<"assignments">, newStatus: AssignmentStatus) => {
    try {
      await updateStatus({ assignmentId, status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (assignmentId: Id<"assignments">) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignment({ assignmentId });
    } catch (error) {
      console.error("Failed to delete assignment:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  // Separate active and completed assignments
  const activeAssignments = assignments?.filter((a) => a.status !== "COMPLETED") || [];
  const completedAssignments = assignments?.filter((a) => a.status === "COMPLETED") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Assignments</h1>
          <p className="text-ink/60 text-sm">Create and manage student assignments</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-oxblood hover:bg-oxblood/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-gold/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {activeAssignments.filter((a) => a.status === "PENDING").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activeAssignments.filter((a) => a.status === "IN_PROGRESS").length}
                </p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {activeAssignments.filter((a) => a.isOverdue).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {completedAssignments.length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <Card className="border-gold/20 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy">
            <ClipboardList className="h-5 w-5 text-oxblood" />
            Active Assignments
            <span className="text-sm font-normal text-ink/50">({activeAssignments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <p className="text-center text-ink/50 py-8">
              No active assignments. Create one to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {activeAssignments.map((assignment) => {
                const displayStatus = assignment.isOverdue ? "OVERDUE" : assignment.status;
                const config = STATUS_CONFIG[displayStatus as AssignmentStatus];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={assignment._id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-navy">{assignment.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <StatusIcon className="inline h-3 w-3 mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-ink/60 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {assignment.student?.user?.name || "Unknown"}
                        </span>
                        {assignment.surah && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {assignment.surah.nameEnglish}
                            {assignment.startAyah && assignment.endAyah && (
                              <span className="text-xs">
                                ({assignment.startAyah}-{assignment.endAyah})
                              </span>
                            )}
                          </span>
                        )}
                        {assignment.dueDate && (
                          <span className={`flex items-center gap-1 ${assignment.isOverdue ? "text-red-600 font-medium" : ""}`}>
                            <Calendar className="h-3 w-3" />
                            Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {assignment.instructions && (
                        <p className="mt-2 text-sm text-ink/70 line-clamp-2">
                          {assignment.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(assignment._id, e.target.value as AssignmentStatus)}
                        className="text-sm border rounded px-2 py-1 bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Assignments (Collapsible) */}
      {completedAssignments.length > 0 && (
        <Card className="border-gold/20 bg-white">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <CardTitle className="flex items-center justify-between text-navy">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Assignments
                <span className="text-sm font-normal text-ink/50">({completedAssignments.length})</span>
              </span>
              {showCompleted ? (
                <ChevronUp className="h-5 w-5 text-ink/50" />
              ) : (
                <ChevronDown className="h-5 w-5 text-ink/50" />
              )}
            </CardTitle>
          </CardHeader>
          {showCompleted && (
            <CardContent>
              <div className="space-y-3">
                {completedAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-stone-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-navy/70 line-through">{assignment.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="inline h-3 w-3 mr-1" />
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-ink/50">
                        <span>{assignment.student?.user?.name || "Unknown"}</span>
                        {assignment.completedAt && (
                          <span>
                            Completed: {format(new Date(assignment.completedAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(assignment._id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-oxblood" />
              Create Assignment
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label>Student *</Label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="">Select a student...</option>
                {students?.filter((s): s is NonNullable<typeof s> => s !== null).map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.user?.name || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Memorize Surah Al-Fatihah"
              />
            </div>

            {/* Quran Range Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeQuranRange"
                checked={includeQuranRange}
                onChange={(e) => setIncludeQuranRange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="includeQuranRange" className="cursor-pointer">
                Include specific Quran verses
              </Label>
            </div>

            {/* Quran Range (Conditional) */}
            {includeQuranRange && (
              <div className="space-y-3 p-3 bg-stone-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Surah</Label>
                  <SurahSelector
                    value={selectedSurah?.id}
                    onChange={(surah) => {
                      setSelectedSurah(surah);
                      setStartAyah(1);
                      setEndAyah(1);
                    }}
                  />
                </div>
                {selectedSurah && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Verse</Label>
                      <Input
                        type="number"
                        min={1}
                        max={selectedSurah.totalAyahs}
                        value={startAyah}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setStartAyah(val);
                          if (val > endAyah) setEndAyah(val);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Verse</Label>
                      <Input
                        type="number"
                        min={startAyah}
                        max={selectedSurah.totalAyahs}
                        value={endAyah}
                        onChange={(e) => setEndAyah(parseInt(e.target.value) || startAyah)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Instructions (optional)</Label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any specific instructions for the student..."
                className="w-full min-h-[80px] border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !selectedStudent || !title.trim()}
                className="flex-1 bg-oxblood hover:bg-oxblood/90"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Assignment"
                )}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
