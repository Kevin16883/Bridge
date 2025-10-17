import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, DollarSign, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, TaskSubmission } from "@shared/schema";

const submissionFormSchema = z.object({
  content: z.string().min(10, "Submission content must be at least 10 characters"),
  attachments: z.any().optional(),
});

type SubmissionFormData = z.infer<typeof submissionFormSchema>;

interface TaskWithSubmissions extends Task {
  submissions?: TaskSubmission[];
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: task, isLoading } = useQuery<TaskWithSubmissions>({
    queryKey: ["/api/tasks", id],
    enabled: !!id,
  });

  const { data: submissions } = useQuery<TaskSubmission[]>({
    queryKey: ["/api/tasks", id, "submissions"],
    enabled: !!id && !!task,
  });

  const { data: applicationStatus } = useQuery<{ hasApplied: boolean; application: any }>({
    queryKey: ["/api/tasks", id, "application-status"],
    enabled: !!id && !!task && task.status === "pending",
  });

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      return await apiRequest("POST", `/api/tasks/${id}/submit`, data);
    },
    onSuccess: () => {
      toast({
        title: "Submission successful",
        description: "Your work has been submitted for review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performer/my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performer/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performer/stats"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/tasks/${id}/apply`, {});
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id, "application-status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelApplicationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/tasks/${id}/application`, {});
    },
    onSuccess: () => {
      toast({
        title: "Application canceled",
        description: "Your application has been canceled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id, "application-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performer/applications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: "in_progress") => {
      return await apiRequest("PATCH", `/api/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Task status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // Remove from available tasks list
      queryClient.invalidateQueries({ queryKey: ["/api/performer/my-tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmissionFormData) => {
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Task Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The task you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/performer-dashboard")} data-testid="button-back">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestSubmission = submissions?.[0];
  const canSubmit = task.status === "matched" || task.status === "in_progress";
  const needsRevision = latestSubmission?.status === "revision_requested";

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/performer-dashboard")}
          className="mb-6"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Task Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2" data-testid="text-task-title">
                  {task.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {task.description}
                </CardDescription>
              </div>
              <Badge
                variant={task.status === "completed" ? "default" : "outline"}
                data-testid="badge-task-status"
              >
                {task.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {task.estimatedTime}
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-primary border-primary/20 bg-primary/10">
                <DollarSign className="h-3.5 w-3.5" />
                {task.budget}
              </Badge>
              <Badge variant="outline">
                {task.difficulty}
              </Badge>
            </div>

            {task.skills && task.skills.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Required Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {task.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" data-testid={`badge-skill-${index}`}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          
          {/* Apply/Cancel Application Button - for pending, unassigned tasks */}
          {task.status === "pending" && !task.matchedPerformerId && (
            <CardContent className="pt-0">
              {applicationStatus?.hasApplied ? (
                <Button
                  onClick={() => {
                    if (confirm("确定要取消申请吗？")) {
                      cancelApplicationMutation.mutate();
                    }
                  }}
                  disabled={cancelApplicationMutation.isPending}
                  variant="destructive"
                  className="w-full"
                  data-testid="button-cancel-application"
                >
                  {cancelApplicationMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      取消中...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      取消申请
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending}
                  className="w-full"
                  data-testid="button-apply-task"
                >
                  {applyMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply for Task
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          )}
          
          {/* Start Task Button */}
          {task.status === "matched" && (
            <CardContent className="pt-0">
              <Button
                onClick={() => updateStatusMutation.mutate("in_progress")}
                disabled={updateStatusMutation.isPending}
                className="w-full"
                data-testid="button-start-task"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Start Working on Task
                  </>
                )}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Submission History */}
        {submissions && submissions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Submission History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 rounded-lg border bg-card"
                  data-testid={`submission-${submission.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        submission.status === "approved"
                          ? "default"
                          : submission.status === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                      data-testid={`badge-submission-status-${submission.id}`}
                    >
                      {submission.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {submission.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{submission.content}</p>
                  {submission.providerFeedback && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-xs font-medium mb-1">Provider Feedback:</p>
                      <p className="text-sm">{submission.providerFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Revision Request Notice */}
        {needsRevision && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Revision Requested
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    The provider has requested changes to your submission. Please review their feedback and submit a revised version.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Form */}
        {canSubmit && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-submit-work">
                {needsRevision ? "Submit Revised Work" : "Submit Your Work"}
              </CardTitle>
              <CardDescription>
                Provide details about your completed work for this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe what you've completed, any challenges you faced, and how you addressed them..."
                            className="min-h-[150px]"
                            data-testid="textarea-submission-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="flex-1"
                      data-testid="button-submit-work"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Work
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Completed State */}
        {task.status === "completed" && (
          <Card className="border-primary/50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Task Completed</h3>
              <p className="text-muted-foreground">
                This task has been completed and approved by the provider
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
