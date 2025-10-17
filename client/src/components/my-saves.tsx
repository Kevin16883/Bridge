import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bookmark, MessageSquare, ChevronRight } from "lucide-react";

type SavedQuestion = {
  id: string;
  userId: string;
  questionId: string;
  createdAt: string;
  question: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    viewCount: number;
  };
};

type SavedComment = {
  id: string;
  userId: string;
  questionId: string;
  commentId: string;
  createdAt: string;
  comment: {
    id: string;
    questionId: string;
    content: string;
    upvotes: number;
    downvotes: number;
  };
};

type MySavesResponse = {
  questions: SavedQuestion[];
  comments: SavedComment[];
};

export function MySaves() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<MySavesResponse>({
    queryKey: ["/api/my-saves"],
    enabled: open,
  });

  const handleQuestionClick = (questionId: string) => {
    setOpen(false);
    setLocation(`/community/${questionId}`);
  };

  const handleCommentClick = (questionId: string) => {
    setOpen(false);
    setLocation(`/community/${questionId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-my-saves">
          <Bookmark className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>我的收藏</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Saved Questions */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  收藏的问题 ({data?.questions?.length || 0})
                </h3>
                {data?.questions && data.questions.length > 0 ? (
                  <div className="space-y-2">
                    {data.questions.map((saved) => (
                      <Card
                        key={saved.id}
                        className="p-3 hover-elevate cursor-pointer"
                        onClick={() => handleQuestionClick(saved.question.id)}
                        data-testid={`card-saved-question-${saved.question.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-1">
                              {saved.question.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {saved.question.content}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {saved.question.tags?.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无收藏的问题</p>
                )}
              </div>

              <Separator />

              {/* Saved Comments */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  收藏的评论 ({data?.comments?.length || 0})
                </h3>
                {data?.comments && data.comments.length > 0 ? (
                  <div className="space-y-2">
                    {data.comments.map((saved) => (
                      <Card
                        key={saved.id}
                        className="p-3 hover-elevate cursor-pointer"
                        onClick={() => handleCommentClick(saved.questionId)}
                        data-testid={`card-saved-comment-${saved.comment.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-3 mb-2">
                              {saved.comment.content}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>👍 {saved.comment.upvotes}</span>
                              <span>👎 {saved.comment.downvotes}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无收藏的评论</p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
