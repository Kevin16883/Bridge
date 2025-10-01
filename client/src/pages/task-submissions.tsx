import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Task, TaskSubmission } from "@shared/schema";

export default function TaskSubmissions() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reviewingSubmission, setReviewingSubmission] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId,
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<TaskSubmission[]>({
    queryKey: ["/api/tasks", taskId, "submissions"],
    enabled: !!taskId,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ submissionId, status, feedback }: { submissionId: string; status: string; feedback?: string }) => {
      return await apiRequest("POST", `/api/submissions/${submissionId}/review`, { status, feedback });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "The submission has been reviewed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setReviewingSubmission(null);
      setFeedback("");
    },
    onError: (error: Error) => {
      toast({
        title: "Review failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReview = (submissionId: string, status: "approved" | "rejected" | "revision_requested") => {
    reviewMutation.mutate({ submissionId, status, feedback: feedback || undefined });
  };

  if (taskLoading || submissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!task || !submissions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The task or submissions could not be found.
            </p>
            <Button onClick={() => setLocation(`/projects/${projectId}`)} data-testid="button-back">
              Back to Project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { variant: "default" as const, icon: CheckCircle, text: "Approved" };
      case "rejected":
        return { variant: "destructive" as const, icon: XCircle, text: "Rejected" };
      case "revision_requested":
        return { variant: "outline" as const, icon: MessageSquare, text: "Revision Requested" };
      default:
        return { variant: "secondary" as const, icon: AlertCircle, text: "Submitted" };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation(`/projects/${projectId}`)}
          className="mb-6"
          data-testid="button-back-project"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        {/* Task Info */}
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
              <Badge variant={task.status === "completed" ? "default" : "outline"} data-testid="badge-task-status">
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
          </CardHeader>
        </Card>

        {/* Submissions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Submissions ({submissions.length})</h2>
          </div>

          {submissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground">
                  The performer hasn't submitted any work for this task yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const statusBadge = getStatusBadge(submission.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <Card key={submission.id} data-testid={`submission-${submission.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={statusBadge.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.text}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()} at{" "}
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg">Work Submission</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Performer's Work:</p>
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="whitespace-pre-wrap">{submission.content}</p>
                        </div>
                      </div>

                      {submission.providerFeedback && (
                        <div>
                          <p className="text-sm font-medium mb-2">Your Feedback:</p>
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm">{submission.providerFeedback}</p>
                          </div>
                        </div>
                      )}

                      {submission.status === "submitted" && (
                        <div className="flex gap-3 pt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="default" 
                                className="flex-1"
                                onClick={() => { setReviewingSubmission(submission.id); setFeedback(""); }}
                                data-testid={`button-approve-${submission.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent data-testid="dialog-approve">
                              <DialogHeader>
                                <DialogTitle>Approve Submission</DialogTitle>
                                <DialogDescription>
                                  Approve this submission and complete the task. You can optionally provide positive feedback.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="feedback-approve">Feedback (optional)</Label>
                                  <Textarea
                                    id="feedback-approve"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Great work! The quality exceeded expectations..."
                                    className="mt-2"
                                    data-testid="textarea-approve-feedback"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handleReview(submission.id, "approved")}
                                  disabled={reviewMutation.isPending}
                                  data-testid="button-confirm-approve"
                                >
                                  {reviewMutation.isPending ? "Approving..." : "Confirm Approval"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => { setReviewingSubmission(submission.id); setFeedback(""); }}
                                data-testid={`button-request-revision-${submission.id}`}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Request Revision
                              </Button>
                            </DialogTrigger>
                            <DialogContent data-testid="dialog-revision">
                              <DialogHeader>
                                <DialogTitle>Request Revision</DialogTitle>
                                <DialogDescription>
                                  Request changes to this submission. Please provide clear feedback on what needs to be improved.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="feedback-revision">Feedback *</Label>
                                  <Textarea
                                    id="feedback-revision"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Please revise the following aspects..."
                                    className="mt-2"
                                    data-testid="textarea-revision-feedback"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handleReview(submission.id, "revision_requested")}
                                  disabled={reviewMutation.isPending || !feedback.trim()}
                                  data-testid="button-confirm-revision"
                                >
                                  {reviewMutation.isPending ? "Requesting..." : "Request Revision"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                className="flex-1"
                                onClick={() => { setReviewingSubmission(submission.id); setFeedback(""); }}
                                data-testid={`button-reject-${submission.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent data-testid="dialog-reject">
                              <DialogHeader>
                                <DialogTitle>Reject Submission</DialogTitle>
                                <DialogDescription>
                                  Reject this submission. Please provide a reason for rejection.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="feedback-reject">Reason *</Label>
                                  <Textarea
                                    id="feedback-reject"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Unfortunately, this doesn't meet our requirements because..."
                                    className="mt-2"
                                    data-testid="textarea-reject-feedback"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReview(submission.id, "rejected")}
                                  disabled={reviewMutation.isPending || !feedback.trim()}
                                  data-testid="button-confirm-reject"
                                >
                                  {reviewMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
