import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Briefcase, DollarSign, Clock, Target, Search, Trash2, CheckCircle2, XCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Task {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  estimatedTime: string;
  difficulty: string;
  status: string;
  matchedPerformerId: string | null;
  providerUsername?: string;
  providerId?: string;
}

interface Application {
  id: string;
  taskId: string;
  performerId: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  task: Task;
}

export default function Tasks() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
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

  const availableTasks = tasks?.filter(t => t.status === "pending" && !t.matchedPerformerId);

  // Extract all unique skills from tasks
  const allSkills = useMemo(() => {
    if (!availableTasks) return [];
    const skillsSet = new Set<string>();
    availableTasks.forEach(task => {
      task.skills?.forEach(skill => skillsSet.add(skill));
    });
    return Array.from(skillsSet).sort();
  }, [availableTasks]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    if (!availableTasks) return [];
    
    return availableTasks.filter(task => {
      const matchesSearch = searchQuery === "" || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDifficulty = difficultyFilter === "all" || task.difficulty === difficultyFilter;
      const matchesSkill = skillFilter === "all" || task.skills?.includes(skillFilter);
      
      return matchesSearch && matchesDifficulty && matchesSkill;
    });
  }, [availableTasks, searchQuery, difficultyFilter, skillFilter]);

  const difficultyColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

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
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Browse available tasks and manage your applications
          </p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList data-testid="tabs-task-list">
            <TabsTrigger value="browse" data-testid="tab-browse">Browse Tasks</TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              My Applications
              {pendingApplications.length > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingApplications.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-4 flex-wrap">
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-difficulty">
                    <SelectValue placeholder="Filter by difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-skill">
                    <SelectValue placeholder="Filter by skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    {allSkills.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchQuery || difficultyFilter !== "all" || skillFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setDifficultyFilter("all");
                      setSkillFilter("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Showing {filteredTasks?.length || 0} of {availableTasks?.length || 0} available tasks
              </p>
            </div>

            {tasksLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : !filteredTasks || filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {!availableTasks || availableTasks.length === 0 ? "No Available Tasks" : "No Matching Tasks"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {!availableTasks || availableTasks.length === 0 
                      ? "Check back later for new opportunities"
                      : "Try adjusting your search or filters"}
                  </p>
                  {(searchQuery || difficultyFilter !== "all" || skillFilter !== "all") && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setDifficultyFilter("all");
                        setSkillFilter("all");
                      }}
                      className="mb-4"
                      data-testid="button-clear-filters-empty"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Link href="/performer-dashboard">
                    <Button variant="outline" data-testid="button-back-to-dashboard">
                      Back to Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          {task.providerUsername && task.providerId && (
                            <div className="mt-1">
                              <Link href={`/users/${task.providerId}`}>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover-elevate" data-testid={`link-provider-${task.id}`}>
                                  <User className="w-3 h-3 mr-1" />
                                  {task.providerUsername}
                                </Button>
                              </Link>
                            </div>
                          )}
                          <CardDescription className="mt-2 line-clamp-2">
                            {task.description}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={difficultyColors[task.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner}
                          data-testid={`difficulty-${task.id}`}
                        >
                          {task.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {task.skills?.map((skill, index) => (
                            <Badge key={index} variant="secondary" data-testid={`skill-${task.id}-${index}`}>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold text-foreground">{task.budget}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{task.estimatedTime}</span>
                            </div>
                          </div>
                          <Link href={`/tasks/${task.id}`}>
                            <Button size="sm" data-testid={`button-view-task-${task.id}`}>
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            {applicationsLoading ? (
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
                  <Button onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="tab-browse"]')?.click()} data-testid="button-browse-tasks">
                    Browse Available Tasks
                  </Button>
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
                                  
                                  <div className="flex gap-2">
                                    <Link href={`/tasks/${application.task.id}`}>
                                      <Button variant="outline" size="sm" data-testid={`button-view-${application.id}`}>
                                        View Task
                                      </Button>
                                    </Link>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="destructive" 
                                          size="sm" 
                                          data-testid={`button-cancel-${application.id}`}
                                        >
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to cancel your application for "{application.task.title}"?
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel data-testid={`button-cancel-no-${application.id}`}>No, Keep It</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => cancelMutation.mutate(application.id)}
                                            data-testid={`button-cancel-yes-${application.id}`}
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

                {/* Past Applications */}
                {processedApplications.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Past Applications ({processedApplications.length})</h2>
                    <div className="grid gap-4">
                      {processedApplications.map((application) => {
                        const StatusIcon = statusConfig[application.status].icon;
                        return (
                          <Card key={application.id} className="opacity-75" data-testid={`card-application-${application.id}`}>
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
                                  
                                  <Link href={`/tasks/${application.task.id}`}>
                                    <Button variant="outline" size="sm" data-testid={`button-view-${application.id}`}>
                                      View Task
                                    </Button>
                                  </Link>
                                </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
