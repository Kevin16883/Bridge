import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, DollarSign, Clock, Target } from "lucide-react";

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
}

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const availableTasks = tasks?.filter(t => t.status === "pending" && !t.matchedPerformerId);

  const difficultyColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Available Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Browse and apply for tasks that match your skills
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : !availableTasks || availableTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Available Tasks</h3>
              <p className="text-muted-foreground mb-4">
                Check back later for new opportunities
              </p>
              <Link href="/performer-dashboard">
                <Button variant="outline" data-testid="button-back-to-dashboard">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {availableTasks.map((task) => (
              <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
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
      </div>
    </div>
  );
}
