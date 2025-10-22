import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Plus, Briefcase, Clock, CheckCircle2, XCircle, BarChart3, UserCheck, Search, User, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Project {
  id: string;
  originalDemand: string;
  status: "draft" | "open" | "active" | "completed" | "cancelled";
  totalBudget: string;
  createdAt: string;
}

interface TaskApplication {
  id: string;
  taskId: string;
  performerId: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  task: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    budget: string;
    difficulty: string;
  };
  performer: {
    id: string;
    username: string;
    rating: number;
  };
}

export default function ProviderDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: pendingApplicationsData } = useQuery<{ count: number }>({
    queryKey: ["/api/provider/pending-applications-count"],
  });

  const { data: applications = [] } = useQuery<TaskApplication[]>({
    queryKey: ["/api/provider/applications"],
  });

  const handleApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      return await apiRequest("PATCH", `/api/applications/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pending-applications-count"] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const pendingApplications = applications.filter(app => app.status === "pending");
  const processedApplications = applications.filter(app => app.status !== "pending");

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      // Search by demand text
      const matchesSearch = searchQuery === "" || 
        project.originalDemand.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by status
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

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

  const activeProjects = filteredProjects?.filter(p => p.status === "active").length || 0;
  const completedProjects = filteredProjects?.filter(p => p.status === "completed").length || 0;
  const pendingApplicationsCount = pendingApplicationsData?.count || 0;

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
              <Card data-testid="stat-pending-applications" className={pendingApplicationsCount > 0 ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                  <UserCheck className={`h-4 w-4 ${pendingApplicationsCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${pendingApplicationsCount > 0 ? 'text-primary' : ''}`}>
                    {pendingApplicationsCount}
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
                  <div className="text-2xl font-bold">{filteredProjects?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {(searchQuery || statusFilter !== "all") ? "Filtered" : "All time"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="projects" data-testid="tab-projects">
                  My Projects ({projects?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="applications" data-testid="tab-applications">
                  Task Applications ({pendingApplications.length} pending)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects">
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
                
                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search projects by demand description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex gap-4 flex-wrap items-center">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="select-status">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {(searchQuery || statusFilter !== "all") && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear Filters
                      </Button>
                    )}
                    <p className="text-sm text-muted-foreground ml-auto">
                      Showing {filteredProjects?.length || 0} of {projects?.length || 0} projects
                    </p>
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Matching Projects</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filters
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                        data-testid="button-clear-filters-empty"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredProjects.map((project) => {
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
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications">
            {pendingApplications.length === 0 && processedApplications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground">
                    Applications from performers will appear here once they apply for your tasks
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingApplications.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Pending Applications ({pendingApplications.length})</h3>
                    <div className="grid gap-4">
                      {pendingApplications.map((application) => (
                        <Card key={application.id} className="hover-elevate" data-testid={`card-application-${application.id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4" />
                                  <Link href={`/users/${application.performer.id}`}>
                                    <span className="font-semibold hover:underline" data-testid={`performer-${application.performer.id}`}>
                                      {application.performer.username}
                                    </span>
                                  </Link>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-muted-foreground">{application.performer.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                                <CardTitle className="text-base">Task: {application.task.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <Badge variant="outline">{application.task.difficulty}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {application.task.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {application.task.skills.map(skill => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-medium">Budget: {application.task.budget}</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApplicationMutation.mutate({ id: application.id, status: "rejected" })}
                                    disabled={handleApplicationMutation.isPending}
                                    data-testid={`button-reject-${application.id}`}
                                  >
                                    <ThumbsDown className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApplicationMutation.mutate({ id: application.id, status: "accepted" })}
                                    disabled={handleApplicationMutation.isPending}
                                    data-testid={`button-accept-${application.id}`}
                                  >
                                    <ThumbsUp className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {processedApplications.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Past Applications ({processedApplications.length})</h3>
                    <div className="grid gap-4">
                      {processedApplications.map((application) => (
                        <Card key={application.id} data-testid={`card-processed-${application.id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4" />
                                  <Link href={`/users/${application.performer.id}`}>
                                    <span className="font-semibold hover:underline">
                                      {application.performer.username}
                                    </span>
                                  </Link>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-muted-foreground">{application.performer.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                                <CardTitle className="text-base">Task: {application.task.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <Badge variant={application.status === "accepted" ? "default" : "destructive"}>
                                {application.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {application.task.skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
