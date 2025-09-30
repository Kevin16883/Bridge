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
      title: "内容策划",
      skills: ["创意思维", "市场洞察"],
      estimatedTime: "2-3小时",
      budget: "¥300-400",
      status: "completed" as const,
    },
    {
      id: "2",
      title: "文案撰写",
      skills: ["创意写作", "沟通表达"],
      estimatedTime: "3-4小时",
      budget: "¥400-600",
      status: "matched" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">需求方控制台</h1>
          <p className="text-muted-foreground">发布需求，管理项目，查看匹配人才</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-active-projects">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃项目</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2个进行中</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成任务</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">成功率 95%</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-matched-talents">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">匹配人才</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">平均匹配度 89%</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <DemandInput />
            
            <Card data-testid="card-recent-projects">
              <CardHeader>
                <CardTitle>最近项目</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border hover-elevate" data-testid={`project-item-${i}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">小红书推广项目</h4>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        进行中
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        2天前
                      </span>
                      <span>4个微任务</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <TaskBreakdown
            originalDemand="我想为我的新款环保咖啡杯做一波小红书推广"
            tasks={mockTasks}
          />
        </div>
      </div>
    </div>
  );
}
