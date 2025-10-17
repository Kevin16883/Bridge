import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type Application = {
  id: string;
  taskId: string;
  performerId: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  task?: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    budget: string;
    difficulty: string;
    status: string;
  };
};

export default function ApplicationHistory() {
  const { user } = useAuth();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/performer/applications"],
    enabled: user?.role === "performer",
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">申请记录</h1>
        <p className="text-muted-foreground">
          查看您申请的所有任务及其状态
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">暂无申请记录</h3>
            <p className="text-muted-foreground mb-4">
              您还没有申请任何任务
            </p>
            <Link href="/tasks">
              <a className="text-primary hover:underline" data-testid="link-browse-tasks">
                浏览可用任务
              </a>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="hover-elevate" data-testid={`card-application-${application.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Link href={`/tasks/${application.taskId}`}>
                        <a className="hover:underline" data-testid={`link-task-${application.taskId}`}>
                          {application.task?.title || "任务已删除"}
                        </a>
                      </Link>
                    </CardTitle>
                    {application.task && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {application.task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(application.status)}
                    <Badge variant={getStatusBadgeVariant(application.status)} data-testid={`badge-status-${application.status}`}>
                      {application.status === "pending" && "待审核"}
                      {application.status === "accepted" && "已接受"}
                      {application.status === "rejected" && "已拒绝"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      申请时间: {format(new Date(application.appliedAt), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                  {application.task && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">预算:</span>
                        <span className="font-medium">{application.task.budget}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">难度:</span>
                        <Badge variant="outline">
                          {application.task.difficulty === "beginner" && "初级"}
                          {application.task.difficulty === "intermediate" && "中级"}
                          {application.task.difficulty === "advanced" && "高级"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {application.task.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
