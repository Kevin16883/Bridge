import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { Eye, ThumbsUp, ThumbsDown, Bookmark, MessageSquare, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Question {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  viewCount: number;
  createdAt: string;
  user?: {
    username: string;
  };
}

interface Comment {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

interface CommentVote {
  commentId: string;
  userId: string;
  voteType: "up" | "down";
}

interface QuestionAnswer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  sourceCommentIds: string[];
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  interview: "面试",
  learning_path: "学习路径",
  offer_choice: "Offer选择",
  study_plan: "学习规划",
  textbook: "教材"
};

export default function QuestionDetail() {
  const [, params] = useRoute("/community/:id");
  const questionId = params?.id;
  const [commentContent, setCommentContent] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string; avatarUrl?: string | null } | null>(null);
  const { toast } = useToast();

  const { data: question, isLoading: questionLoading } = useQuery<Question>({
    queryKey: ["/api/questions", questionId],
    queryFn: async () => {
      const response = await fetch(`/api/questions/${questionId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch question");
      return response.json();
    },
    enabled: !!questionId,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/questions", questionId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/questions/${questionId}/comments`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!questionId,
  });

  const { data: savedItems } = useQuery({
    queryKey: ["/api/my-saves"],
  });

  const { data: myAnswer } = useQuery<QuestionAnswer>({
    queryKey: ["/api/questions", questionId, "my-answer"],
    queryFn: async () => {
      const response = await fetch(`/api/questions/${questionId}/my-answer`, {
        credentials: "include",
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch answer");
      return response.json();
    },
    enabled: !!questionId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/questions/${questionId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", questionId, "comments"] });
      setCommentContent("");
      toast({
        title: "评论已发布",
        description: "您的评论已成功添加",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "评论失败",
        description: error.message,
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ commentId, voteType }: { commentId: string; voteType: "up" | "down" }) => {
      return apiRequest("POST", `/api/comments/${commentId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", questionId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-saves"] });
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/comments/${commentId}/vote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", questionId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-saves"] });
    },
  });

  const saveCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("POST", `/api/comments/${commentId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-saves"] });
      toast({
        title: "已收藏",
        description: "评论已添加到收藏",
      });
    },
  });

  const unsaveCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/comments/${commentId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-saves"] });
      toast({
        title: "已取消收藏",
        description: "评论已从收藏中移除",
      });
    },
  });

  const generateAnswerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/questions/${questionId}/generate-answer`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", questionId, "my-answer"] });
      toast({
        title: "AI答案已生成",
        description: "基于您收藏的评论生成了答案",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message,
      });
    },
  });

  const handleVote = (commentId: string, voteType: "up" | "down", currentVote?: "up" | "down") => {
    if (currentVote === voteType) {
      removeVoteMutation.mutate(commentId);
    } else {
      voteMutation.mutate({ commentId, voteType });
    }
  };

  const handleSaveComment = (commentId: string, isSaved: boolean) => {
    if (isSaved) {
      unsaveCommentMutation.mutate(commentId);
    } else {
      saveCommentMutation.mutate(commentId);
    }
  };

  const savedCommentIds = (savedItems as any)?.comments?.map((sc: any) => sc.commentId) || [];

  if (questionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">问题不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Link href="/community">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回社区
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" data-testid="category-badge">
                    {categoryLabels[question.category] || question.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span data-testid="view-count">{question.viewCount}</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-3" data-testid="question-title">{question.title}</h1>
                <p className="text-muted-foreground mb-4" data-testid="question-author">
                  提问者: {question.user?.username || "匿名用户"}
                </p>
              </div>
              
              <Button
                onClick={() => generateAnswerMutation.mutate()}
                disabled={generateAnswerMutation.isPending}
                data-testid="button-generate-answer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateAnswerMutation.isPending ? "生成中..." : "生成AI答案"}
              </Button>
            </div>

            <p className="text-base leading-relaxed whitespace-pre-wrap" data-testid="question-content">
              {question.content}
            </p>

            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" data-testid={`tag-${index}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
        </Card>

        {myAnswer && (
          <Card className="mb-6 border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">AI生成的答案</h3>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap" data-testid="ai-answer-content">
                {myAnswer.content}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                基于 {myAnswer.sourceCommentIds?.length || 0} 条收藏的评论生成
              </p>
            </CardHeader>
          </Card>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            评论 {comments?.length ? `(${comments.length})` : ""}
          </h2>

          <Card className="mb-4">
            <CardContent className="pt-6">
              <Textarea
                placeholder="分享您的想法..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="mb-3"
                data-testid="input-comment"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => addCommentMutation.mutate(commentContent)}
                  disabled={!commentContent.trim() || addCommentMutation.isPending}
                  data-testid="button-submit-comment"
                >
                  {addCommentMutation.isPending ? "发布中..." : "发布评论"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {commentsLoading ? (
            <p className="text-muted-foreground">加载评论中...</p>
          ) : !comments || comments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">暂无评论</h3>
                <p className="text-muted-foreground">成为第一个评论的人吧</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isSaved = savedCommentIds.includes(comment.id);
                const userVote = (savedItems as any)?.comments?.find((sc: any) => sc.commentId === comment.id)?.vote;
                
                return (
                  <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div 
                          className="cursor-pointer"
                          onClick={() => setSelectedUser({
                            id: comment.user?.id || comment.userId,
                            username: comment.user?.username || "匿名用户",
                            avatarUrl: comment.user?.avatarUrl
                          })}
                          data-testid={`avatar-${comment.id}`}
                        >
                          <UserAvatar
                            avatarUrl={comment.user?.avatarUrl}
                            username={comment.user?.username || "匿名用户"}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium" data-testid={`comment-author-${comment.id}`}>
                              {comment.user?.username || "匿名用户"}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveComment(comment.id, isSaved)}
                              className={isSaved ? "text-primary" : ""}
                              data-testid={`button-save-comment-${comment.id}`}
                            >
                              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                            </Button>
                          </div>
                          
                          <p className="text-base mb-3 whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
                            {comment.content}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVote(comment.id, "up", userVote)}
                              className={userVote === "up" ? "text-primary" : ""}
                              data-testid={`button-upvote-${comment.id}`}
                            >
                              <ThumbsUp className={`w-4 h-4 mr-1 ${userVote === "up" ? "fill-current" : ""}`} />
                              <span data-testid={`upvotes-${comment.id}`}>{comment.upvotes}</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVote(comment.id, "down", userVote)}
                              className={userVote === "down" ? "text-destructive" : ""}
                              data-testid={`button-downvote-${comment.id}`}
                            >
                              <ThumbsDown className={`w-4 h-4 mr-1 ${userVote === "down" ? "fill-current" : ""}`} />
                              <span data-testid={`downvotes-${comment.id}`}>{comment.downvotes}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserProfileDialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          userId={selectedUser.id}
          username={selectedUser.username}
          avatarUrl={selectedUser.avatarUrl}
        />
      )}
    </div>
  );
}
