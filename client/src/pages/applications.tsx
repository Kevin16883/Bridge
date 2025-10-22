import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, XCircle, Trash2, Briefcase } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  estimatedTime: string;
  difficulty: string;
  status: string;
}

interface Application {
  id: string;
  taskId: string;
  performerId: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  task: Task;
}

export default function Applications() {
  const { toast } = useToast();
  
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/performer/applications"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest(`/api/applications/${applicationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performer/applications"] });
      toast({
        title: "Success",
        description: "Application cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel application",
        variant: "destructive",
      });
    },
  });

  const statusConfig = {
    pending: {
      label: "Pending",
      icon: Clock,
      variant: "default" as const,
      description: "Waiting for provider review",
    },
    accepted: {
      label: "Accepted",
      icon: CheckCircle2,
      variant: "secondary" as const,
      description: "Your application was accepted",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      variant: "destructive" as const,
      description: "Your application was not accepted",
    },
  };

  const pendingApplications = applications?.filter(app => app.status === "pending") || [];
  const processedApplications = applications?.filter(app => app.status !== "pending") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">My Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track your task applications and their status
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : !applications || applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start applying for tasks to see them here
              </p>
              <Link href="/tasks">
                <Button data-testid="button-browse-tasks">Browse Available Tasks</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pending Applications */}
            {pendingApplications.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Pending Applications ({pendingApplications.length})</h2>
                <div className="grid gap-4">
                  {pendingApplications.map((application) => {
                    const StatusIcon = statusConfig[application.status].icon;
                    return (
                      <Card key={application.id} className="hover-elevate" data-testid={`card-application-${application.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                <Link href={`/tasks/${application.task.id}`}>
                                  <span className="hover:underline cursor-pointer">
                                    {application.task.title}
                                  </span>
                                </Link>
                              </CardTitle>
                              <CardDescription className="mt-2">
                                {application.task.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={statusConfig[application.status].variant}
                                data-testid={`status-${application.id}`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[application.status].label}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {application.task.skills?.map((skill, index) => (
                                <Badge key={index} variant="secondary" data-testid={`skill-${application.id}-${index}`}>
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">
                                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm font-semibold">
                                  Budget: {application.task.budget}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link href={`/tasks/${application.task.id}`}>
                                  <Button size="sm" variant="outline" data-testid={`button-view-${application.id}`}>
                                    View Task
                                  </Button>
                                </Link>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      data-testid={`button-cancel-${application.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Application?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel your application for "{application.task.title}"? 
                                        This action cannot be undone, but you can reapply later if the task is still available.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-testid="button-cancel-dialog-no">No, Keep It</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => cancelMutation.mutate(application.id)}
                                        data-testid="button-cancel-dialog-yes"
                                      >
                                        Yes, Cancel Application
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Processed Applications */}
            {processedApplications.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Past Applications ({processedApplications.length})</h2>
                <div className="grid gap-4">
                  {processedApplications.map((application) => {
                    const StatusIcon = statusConfig[application.status].icon;
                    return (
                      <Card key={application.id} data-testid={`card-application-${application.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {application.task.title}
                              </CardTitle>
                              <CardDescription className="mt-2">
                                {statusConfig[application.status].description}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={statusConfig[application.status].variant}
                              data-testid={`status-${application.id}`}
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[application.status].label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Applied {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-semibold">
                              Budget: {application.task.budget}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
