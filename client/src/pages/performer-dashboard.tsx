import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Header } from "@/components/header";
import type { Task, TaskSubmission, Badge as BadgeType, UserBadge } from "@shared/schema";

interface PerformerStats {
  completedTasks: number;
  totalEarnings: number;
  totalBadges: number;
}

interface TaskWithSubmission extends Task {
  latestSubmission?: TaskSubmission;
}

export default function PerformerDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<PerformerStats>({
    queryKey: ["/api/performer/stats"],
  });

  const { data: myTasks, isLoading: tasksLoading } = useQuery<TaskWithSubmission[]>({
    queryKey: ["/api/performer/my-tasks"],
  });

  const { data: userBadges, isLoading: badgesLoading } = useQuery<Array<UserBadge & { badge: BadgeType }>>({
    queryKey: ["/api/performer/badges"],
  });

  if (statsLoading || tasksLoading || badgesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const activeTasks = myTasks?.filter(t => t.status === "matched" || t.status === "in_progress") || [];
  const completedTasks = myTasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Performer Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your tasks and achievements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed-tasks">
                {stats?.completedTasks || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="text-total-earnings">
                ${stats?.totalEarnings || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-badges">
                {stats?.totalBadges || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Section */}
        {userBadges && userBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Badges</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {userBadges.map((userBadge) => (
                <Card
                  key={userBadge.id}
                  className="hover-elevate transition-transform hover:-translate-y-1"
                  data-testid={`card-badge-${userBadge.badgeId}`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{userBadge.badge.icon}</div>
                    <div className="font-semibold text-sm mb-1">{userBadge.badge.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {userBadge.badge.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Active Tasks</h2>
              <Badge variant="outline">
                {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeTasks.map((task) => (
                <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimatedTime}
                      </Badge>
                      <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">
                        ${task.budget}
                      </Badge>
                      {task.latestSubmission && (
                        <Badge
                          variant="outline"
                          className={
                            task.latestSubmission.status === "approved"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                              : task.latestSubmission.status === "rejected"
                              ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                          }
                        >
                          {task.latestSubmission.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild data-testid={`button-view-task-${task.id}`}>
                      <Link href={`/tasks/${task.id}`}>
                        {task.latestSubmission?.status === "revision_requested" ? "Revise Submission" : "View Task"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed Tasks</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {completedTasks.slice(0, 4).map((task) => (
                <Card key={task.id} className="border-primary/50" data-testid={`card-completed-task-${task.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">
                        ${task.budget}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
              <p className="text-muted-foreground mb-4">
                Browse available tasks and start applying
              </p>
              <Button variant="default" asChild data-testid="button-browse-tasks">
                <Link href="/tasks">Browse Tasks</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
