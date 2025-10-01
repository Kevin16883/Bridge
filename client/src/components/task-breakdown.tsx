import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, DollarSign, ChevronRight } from "lucide-react";

interface MicroTask {
  id: string;
  title: string;
  skills: string[];
  estimatedTime: string;
  budget: string;
  status?: "pending" | "matched" | "completed";
}

interface TaskBreakdownProps {
  originalDemand: string;
  tasks: MicroTask[];
}

const statusConfig = {
  pending: { color: "bg-muted text-muted-foreground", label: "Pending" },
  matched: { color: "bg-primary/10 text-primary border-primary/30", label: "Matched" },
  completed: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Completed" },
};

export function TaskBreakdown({ originalDemand, tasks }: TaskBreakdownProps) {
  return (
    <Card data-testid="card-task-breakdown">
      <CardHeader>
        <CardTitle>AI Analysis Result</CardTitle>
        <div className="p-3 rounded-lg bg-muted/50 border mt-2">
          <p className="text-sm text-muted-foreground mb-1">Original Demand</p>
          <p className="text-sm">{originalDemand}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Decomposed into {tasks.length} micro-tasks
        </div>
        
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="p-4 rounded-lg border bg-card hover-elevate transition-all"
              data-testid={`task-item-${index}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{task.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {task.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {task.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {task.budget}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {task.status && (
                    <Badge variant="outline" className={statusConfig[task.status].color}>
                      {task.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {statusConfig[task.status].label}
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" data-testid={`button-task-detail-${index}`}>
                    Detail
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Estimated Total Budget</div>
              <div className="text-2xl font-bold">$200 - 330</div>
            </div>
            <Button size="lg" data-testid="button-publish-project">
              Publish Project
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
