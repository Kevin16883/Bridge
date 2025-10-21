import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Briefcase, Clock, CheckCircle2, XCircle, BarChart3, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";

interface Project {
  id: string;
  originalDemand: string;
  status: "draft" | "open" | "active" | "completed" | "cancelled";
  totalBudget: string;
  createdAt: string;
}

export default function ProviderDashboard() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: pendingApplicationsData } = useQuery<{ count: number }>({
    queryKey: ["/api/provider/pending-applications-count"],
  });

  const statusIcons: Record<string, any> = {
    draft: Clock,
    open: Clock,
    active: Clock,
    completed: CheckCircle2,
    cancelled: XCircle,
  };

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    active: "bg-primary/10 text-primary border-primary/30",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const activeProjects = projects?.filter(p => p.status === "active").length || 0;
  const completedProjects = projects?.filter(p => p.status === "completed").length || 0;
  const pendingApplications = pendingApplicationsData?.count || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Provider Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your demands and track task progress
            </p>
          </div>
          <Link href="/create-demand">
            <Button data-testid="button-create-demand">
              <Plus className="w-4 h-4 mr-2" />
              Create New Demand
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <Card data-testid="stat-pending-applications" className={pendingApplications > 0 ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                  <UserCheck className={`h-4 w-4 ${pendingApplications > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${pendingApplications > 0 ? 'text-primary' : ''}`}>
                    {pendingApplications}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card data-testid="stat-active-projects">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeProjects}</div>
                  <p className="text-xs text-muted-foreground">Currently in progress</p>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-completed-projects">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedProjects}</div>
                  <p className="text-xs text-muted-foreground">Successfully finished</p>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-total-projects">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>

            {!projects || projects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first demand to get started with AI-powered task matching
                  </p>
                  <Link href="/create-demand">
                    <Button data-testid="button-create-first-demand">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Demand
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Projects</h2>
                <div className="grid gap-4">
                  {projects.map((project) => {
                    const StatusIcon = statusIcons[project.status];
                    return (
                      <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{project.originalDemand}</CardTitle>
                              <CardDescription className="mt-1">
                                Created {new Date(project.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className={statusColors[project.status]} data-testid={`status-${project.id}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              <span className="capitalize">{project.status}</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Total Budget: <span className="font-semibold text-foreground">{project.totalBudget}</span>
                            </div>
                            <Link href={`/projects/${project.id}`}>
                              <Button variant="outline" size="sm" data-testid={`button-view-${project.id}`}>
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
