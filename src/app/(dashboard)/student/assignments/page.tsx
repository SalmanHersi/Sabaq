"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Loader2,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-100", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bgColor: "bg-blue-100", icon: PlayCircle },
  COMPLETED: { label: "Completed", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle },
  OVERDUE: { label: "Overdue", color: "text-red-700", bgColor: "bg-red-100", icon: AlertCircle },
};

export default function StudentAssignmentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const assignments = useQuery(api.assignments.list, isAuthenticated ? { includeCompleted: true } : "skip");
  const stats = useQuery(api.assignments.getStudentStats, isAuthenticated ? {} : "skip");

  const updateStatus = useMutation(api.assignments.updateStatus);

  const [showCompleted, setShowCompleted] = useState(false);

  const loading = authLoading || assignments === undefined;

  const handleStartAssignment = async (assignmentId: Id<"assignments">) => {
    try {
      await updateStatus({ assignmentId, status: "IN_PROGRESS" });
    } catch (error) {
      console.error("Failed to start assignment:", error);
    }
  };

  const handleCompleteAssignment = async (assignmentId: Id<"assignments">) => {
    try {
      await updateStatus({ assignmentId, status: "COMPLETED" });
    } catch (error) {
      console.error("Failed to complete assignment:", error);
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">My Assignments</h1>
        <p className="text-ink/60 text-sm">Track and complete your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink/60">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-6 w-6 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink/60">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</p>
              </div>
              <PlayCircle className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink/60">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink/60">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy">
            <ClipboardList className="h-5 w-5 text-oxblood" />
            Active Assignments
            <span className="text-sm font-normal text-ink/50">({activeAssignments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-200 mx-auto mb-3" />
              <p className="text-ink/50">No active assignments. Great job!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => {
                const displayStatus = assignment.isOverdue ? "OVERDUE" : assignment.status;
                const config = STATUS_CONFIG[displayStatus as AssignmentStatus];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={assignment._id}
                    className={`p-4 rounded-lg border ${assignment.isOverdue ? "border-red-200 bg-red-50/50" : "bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-navy">{assignment.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            <StatusIcon className="inline h-3 w-3 mr-1" />
                            {config.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-sm text-ink/60 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            From: {assignment.teacher?.user?.name || "Teacher"}
                          </span>
                          {assignment.surah && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {assignment.surah.nameEnglish}
                              {assignment.startAyah && assignment.endAyah && (
                                <span className="text-xs">
                                  (Verses {assignment.startAyah}-{assignment.endAyah})
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
                          <div className="mt-3 p-3 bg-stone-50 rounded-md">
                            <p className="text-sm text-ink/70 font-medium mb-1">Instructions:</p>
                            <p className="text-sm text-ink/80">{assignment.instructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {assignment.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartAssignment(assignment._id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {(assignment.status === "IN_PROGRESS" || assignment.status === "PENDING") && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteAssignment(assignment._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
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
        <Card className="">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <CardTitle className="flex items-center justify-between text-navy">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed
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
                    className="p-3 rounded-lg border bg-stone-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h3 className="font-medium text-navy/70">{assignment.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-ink/50">
                      {assignment.surah && (
                        <span>{assignment.surah.nameEnglish}</span>
                      )}
                      {assignment.completedAt && (
                        <span>
                          Completed: {format(new Date(assignment.completedAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
