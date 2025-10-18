import { Header } from "@/components/header";
import { DemandInput } from "@/components/demand-input";
import { TaskBreakdown } from "@/components/task-breakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle, Clock, Users } from "lucide-react";

export default function ProviderDashboard() {
  const mockTasks = [
    {
      id: "1",
      title: "Content Planning",
      skills: ["Creative Thinking", "Market Insight"],
      estimatedTime: "2-3 hours",
      budget: "$50-70",
      status: "completed" as const,
    },
    {
      id: "2",
      title: "Copywriting",
      skills: ["Creative Writing", "Communication"],
      estimatedTime: "3-4 hours",
      budget: "$70-100",
      status: "matched" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Post demands, manage projects, view matched talents</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-active-projects">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 in progress</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">95% success rate</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-matched-talents">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matched Talents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">89% avg match</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <DemandInput />
            
            <Card data-testid="card-recent-projects">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border hover-elevate" data-testid={`project-item-${i}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Social Media Promotion Project</h4>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        In Progress
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        2 days ago
                      </span>
                      <span>4 micro-tasks</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <TaskBreakdown
            originalDemand="I want to promote my new eco-friendly coffee cup on social media"
            tasks={mockTasks}
          />
        </div>
      </div>
    </div>
  );
}
