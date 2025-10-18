import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Clock, DollarSign, CheckCircle2, AlertCircle, FileText, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Task {
  id: string;
  title: string;
  description: string;
  skills: string[];
  estimatedTime: string;
  budget: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "pending" | "matched" | "in_progress" | "completed";
  performerId?: string;
  matchedPerformerId?: string;
}

interface Project {
  id: string;
  originalDemand: string;
  status: "active" | "completed" | "cancelled";
  totalBudget: string;
  createdAt: string;
  providerId: string;
}

interface ProjectDetailResponse {
  project: Project;
  tasks: Task[];
}

interface TaskApplication {
  id: string;
  taskId: string;
  performerId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

function TaskApplications({ taskId, projectId }: { taskId: string; projectId: string }) {
  const { toast } = useToast();
  
  const { data: applications, isLoading } = useQuery<TaskApplication[]>({
    queryKey: ["/api/tasks", taskId, "applications"],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/applications`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) return [];
        throw new Error("Failed to fetch applications");
      }
      return response.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return apiRequest("POST", `/api/tasks/${taskId}/applications/${applicationId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pending-applications-count"] });
      toast({
        title: "Application Accepted",
        description: "The performer has been assigned to this task.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept application. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">Loading applications...</p>
      </div>
    );
  }

  const pendingApplications = applications?.filter(app => app.status === "pending") || [];

  if (pendingApplications.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <UserCheck className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">
          {pendingApplications.length} Application{pendingApplications.length !== 1 ? 's' : ''} Pending
        </h4>
      </div>
      <div className="space-y-2">
        {pendingApplications.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between p-3 rounded-md bg-background"
            data-testid={`application-${app.id}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Performer Application</p>
                <p className="text-xs text-muted-foreground">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => acceptMutation.mutate(app.id)}
              disabled={acceptMutation.isPending}
              data-testid={`button-accept-${app.id}`}
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const [location, setLocation] = useLocation();
  const projectId = location.split("/")[2]; // Extract ID from /projects/:projectId
  
  const { data, isLoading, error} = useQuery<ProjectDetailResponse>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
  });

  const taskStatusConfig = {
    pending: {
      label: "Pending",
      variant: "secondary" as const,
      icon: Clock,
    },
    matched: {
      label: "Matched",
      variant: "default" as const,
      icon: AlertCircle,
    },
    in_progress: {
      label: "In Progress",
      variant: "default" as const,
      icon: AlertCircle,
    },
    completed: {
      label: "Completed",
      variant: "secondary" as const,
      icon: CheckCircle2,
    },
  };

  const skillColors: Record<string, string> = {
    logic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    creative: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    technical: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    communication: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Failed to load project</h3>
              <p className="text-muted-foreground mb-4">
                This project doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => setLocation("/provider-dashboard")} data-testid="button-back">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { project, tasks } = data;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/provider-dashboard")}
          className="mb-6"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{project.originalDemand}</CardTitle>
                  <CardDescription className="mt-2">
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="default" data-testid="status-badge">
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-lg font-semibold">{project.totalBudget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Clock className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks Progress</p>
                    <p className="text-lg font-semibold">{completedTasks} / {tasks.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-lg font-semibold">{progressPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Tasks ({tasks.length})</h2>
            <div className="space-y-4">
              {tasks.map((task) => {
                const StatusIcon = taskStatusConfig[task.status].icon;
                return (
                  <Card key={task.id} data-testid={`card-task-${task.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription className="mt-1">{task.description}</CardDescription>
                        </div>
                        <Badge variant={taskStatusConfig[task.status].variant} data-testid={`status-task-${task.id}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {taskStatusConfig[task.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="ml-2 font-medium capitalize">{task.difficulty}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <span className="ml-2 font-medium">{task.estimatedTime}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="ml-2 font-medium">{task.budget}</span>
                        </div>
                      </div>
                      
                      {/* Task Applications - show for pending tasks */}
                      {task.status === "pending" && !task.matchedPerformerId && (
                        <TaskApplications taskId={task.id} projectId={projectId} />
                      )}
                      
                      {/* Task Progress Info */}
                      {task.matchedPerformerId && (
                        <div className="p-3 rounded-lg bg-muted/50 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Assigned Performer</p>
                                <p className="text-sm font-medium">Task Assigned</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {task.status === "matched" && "Ready to Start"}
                              {task.status === "in_progress" && "Working"}
                              {task.status === "completed" && "Completed"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {task.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className={skillColors[skill] || ""}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      {(task.status === "in_progress" || task.status === "completed") && (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          asChild
                          data-testid={`button-view-submissions-${task.id}`}
                        >
                          <Link href={`/projects/${projectId}/tasks/${task.id}/submissions`}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Submissions
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
