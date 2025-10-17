import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { FileText, Calendar, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Project = {
  id: string;
  providerId: string;
  originalDemand: string;
  status: "draft" | "active" | "completed";
  totalBudget?: string;
  createdAt: string;
};

export default function Drafts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: drafts = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { status: "draft" }],
    enabled: user?.role === "provider",
  });

  const publishMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return await apiRequest("PATCH", `/api/projects/${projectId}`, { status: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "成功",
        description: "项目已发布",
      });
    },
    onError: () => {
      toast({
        title: "错误",
        description: "发布失败",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "成功",
        description: "草稿已删除",
      });
    },
    onError: () => {
      toast({
        title: "错误",
        description: "删除失败",
        variant: "destructive",
      });
    },
  });

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">草稿箱</h1>
          <p className="text-muted-foreground">
            管理您未发布的需求草稿
          </p>
        </div>
        <Link href="/create-demand">
          <Button data-testid="button-create-new">
            <FileText className="w-4 h-4 mr-2" />
            新建需求
          </Button>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">暂无草稿</h3>
            <p className="text-muted-foreground mb-4">
              您还没有保存任何草稿
            </p>
            <Link href="/create-demand">
              <a className="text-primary hover:underline" data-testid="link-create-demand">
                创建新需求
              </a>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover-elevate" data-testid={`card-draft-${draft.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground mb-1">
                      {format(new Date(draft.createdAt), "yyyy-MM-dd HH:mm")}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-sm">
                      {draft.originalDemand.substring(0, 150)}
                      {draft.originalDemand.length > 150 ? "..." : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/create-demand?draft=${draft.id}`)}
                      data-testid={`button-edit-${draft.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      继续编辑
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => publishMutation.mutate(draft.id)}
                      disabled={publishMutation.isPending}
                      data-testid={`button-publish-${draft.id}`}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      发布
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (confirm("确定要删除这个草稿吗？")) {
                        deleteMutation.mutate(draft.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${draft.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除草稿
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
