import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Award, 
  Briefcase, 
  CheckCircle, 
  Star,
  MessageSquare,
  UserPlus,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "stats"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, totalProjectsPublished, totalTasksPublished, totalTasksCompleted, badges, recentProjects, recentTasks } = stats;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link href="/" data-testid="link-back">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24" data-testid="img-user-avatar">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <CardTitle data-testid="text-username">{user.username}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-2" data-testid="badge-user-role">
                    {user.role === "provider" ? "Provider" : "Performer"}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="default" className="w-full" data-testid="button-send-message">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-follow">
                <UserPlus className="h-4 w-4 mr-2" />
                Follow
              </Button>
            </div>

            {/* Statistics */}
            <div className="pt-4 border-t space-y-3">
              {user.role === "provider" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Projects Published
                    </span>
                    <span className="font-semibold" data-testid="text-projects-count">
                      {totalProjectsPublished || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tasks Published
                    </span>
                    <span className="font-semibold" data-testid="text-tasks-published-count">
                      {totalTasksPublished || 0}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tasks Completed
                  </span>
                  <span className="font-semibold" data-testid="text-tasks-completed-count">
                    {totalTasksCompleted || 0}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Badges & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges && badges.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {badges.map((userBadge: any) => (
                    <div
                      key={userBadge.id}
                      className="flex flex-col items-center space-y-1 p-3 border rounded-lg"
                      data-testid={`badge-item-${userBadge.badgeId}`}
                    >
                      <span className="text-2xl">{userBadge.badge.icon}</span>
                      <span className="text-xs font-medium text-center">
                        {userBadge.badge.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No badges earned yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {user.role === "provider" && recentProjects && recentProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Latest published projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentProjects.map((project: any) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      data-testid={`link-project-${project.id}`}
                    >
                      <div className="p-3 border rounded-lg hover-elevate">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm line-clamp-2">{project.originalDemand}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" size="sm">
                                {project.status}
                              </Badge>
                              {project.totalBudget && (
                                <span className="text-xs text-muted-foreground">
                                  ${project.totalBudget}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "performer" && recentTasks && recentTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTasks.map((task: any) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      data-testid={`link-task-${task.id}`}
                    >
                      <div className="p-3 border rounded-lg hover-elevate">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" size="sm">
                            {task.status}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {task.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ${task.budget}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
