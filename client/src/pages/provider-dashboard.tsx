import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, CheckCircle, Clock, Users, Search, FileText, Inbox, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

type Project = {
  id: string;
  providerId: string;
  originalDemand: string;
  status: string;
  totalBudget?: string;
  createdAt: string;
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  status: string;
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState("");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", { keyword: searchKeyword || undefined }],
    enabled: user?.role === "provider",
  });

  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: user?.role === "provider",
  });

  const activeProjects = projects.filter(p => p.status === "active");
  const completedTasks = allTasks.filter(t => t.status === "completed");
  const matchedTasks = allTasks.filter(t => t.status === "matched");

  const filteredProjects = searchKeyword 
    ? projects.filter(p => 
        p.originalDemand.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : projects;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
            <p className="text-muted-foreground">发布需求、管理项目、查看匹配人才</p>
          </div>
          <div className="flex gap-2">
            <Link href="/drafts">
              <Button variant="outline" data-testid="button-drafts">
                <Inbox className="w-4 h-4 mr-2" />
                草稿箱
              </Button>
            </Link>
            <Link href="/create-demand">
              <Button data-testid="button-create-demand">
                <Plus className="w-4 h-4 mr-2" />
                创建需求
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-active-projects">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃项目</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">进行中的项目</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-tasks">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">完成任务</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground">已完成的任务</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-matched-talents">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">匹配人才</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchedTasks.length}</div>
              <p className="text-xs text-muted-foreground">已匹配的任务</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Projects */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索您的项目..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
              data-testid="input-search-projects"
            />
          </div>
        </div>
        
        {/* Projects List */}
        <Card data-testid="card-recent-projects">
          <CardHeader>
            <CardTitle>我的项目</CardTitle>
            <CardDescription>管理和查看您的项目</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchKeyword ? "没有找到匹配的项目" : "还没有项目"}
                </p>
                {!searchKeyword && (
                  <Link href="/create-demand">
                    <Button variant="outline" className="mt-4" data-testid="button-create-first-project">
                      创建第一个项目
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              filteredProjects.slice(0, 10).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="p-4 rounded-lg border hover-elevate" data-testid={`project-item-${project.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium line-clamp-2 flex-1">
                        {project.originalDemand.substring(0, 100)}
                        {project.originalDemand.length > 100 ? "..." : ""}
                      </p>
                      <Badge 
                        variant={project.status === "active" ? "default" : "secondary"}
                        data-testid={`project-status-${project.id}`}
                      >
                        {project.status === "active" ? "进行中" : project.status === "completed" ? "已完成" : "草稿"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(project.createdAt), "yyyy-MM-dd")}
                      </span>
                      {project.totalBudget && (
                        <span>预算: {project.totalBudget}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
