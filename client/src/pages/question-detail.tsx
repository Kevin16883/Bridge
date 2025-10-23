import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Tag, ThumbsUp, ThumbsDown, Bookmark, Sparkles, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Question {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  viewCount: number;
  createdAt: string;
  authorUsername: string;
  voteCount?: number;
}

interface Comment {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  createdAt: string;
  authorUsername: string;
  voteCount?: number;
}

interface SavedQuestion {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  viewCount: number;
  createdAt: string;
  authorUsername: string;
}

export default function QuestionDetail() {
  const { id: questionId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");
  
  const { data: question, isLoading } = useQuery<Question>({
    queryKey: [`/api/questions/${questionId}`],
    enabled: !!questionId,
  });
  
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/questions/${questionId}/comments`],
    enabled: !!questionId,
  });
  
  const { data: savedQuestions = [] } = useQuery<SavedQuestion[]>({
    queryKey: ["/api/saved-questions"],
  });
  
  const isSaved = savedQuestions.some(q => q.id === questionId);
  
  const postCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/questions/${questionId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/comments`] });
      setCommentContent("");
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });
  
  const voteQuestionMutation = useMutation({
    mutationFn: async (vote: number) => {
      return await apiRequest("POST", `/api/questions/${questionId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to vote",
        variant: "destructive",
      });
    },
  });
  
  const saveQuestionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/questions/${questionId}/save`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-questions"] });
      toast({
        title: "Success",
        description: "Question saved to your collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save question",
        variant: "destructive",
      });
    },
  });
  
  const unsaveQuestionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/questions/${questionId}/save`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-questions"] });
      toast({
        title: "Success",
        description: "Question removed from your collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unsave question",
        variant: "destructive",
      });
    },
  });
  
  const voteCommentMutation = useMutation({
    mutationFn: async ({ commentId, vote }: { commentId: string; vote: number }) => {
      return await apiRequest("POST", `/api/comments/${commentId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/comments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to vote on comment",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl py-8 px-4">
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Question not found</p>
              <Link href="/community">
                <Button className="mt-4" variant="outline">
                  Back to Community
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl py-8 px-4">
        <Link href="/community">
          <Button variant="ghost" className="mb-4">
            ← Back to Community
          </Button>
        </Link>
        
        <Card data-testid="question-detail-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{question.title}</CardTitle>
                <CardDescription>
                  Asked by <Link href={`/users/${question.userId}`} className="hover:underline text-primary">
                    {question.authorUsername}
                  </Link> • {new Date(question.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="outline">{question.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground whitespace-pre-wrap">{question.content}</p>
            
            <div className="flex flex-wrap gap-2">
              {question.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{question.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{comments.length} comments</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => voteQuestionMutation.mutate(1)}
                  disabled={voteQuestionMutation.isPending}
                  data-testid="button-upvote-question"
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-8 text-center">
                  {question.voteCount || 0}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => voteQuestionMutation.mutate(-1)}
                  disabled={voteQuestionMutation.isPending}
                  data-testid="button-downvote-question"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() => isSaved ? unsaveQuestionMutation.mutate() : saveQuestionMutation.mutate()}
                disabled={saveQuestionMutation.isPending || unsaveQuestionMutation.isPending}
                data-testid="button-save-question"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? "Unsave" : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                data-testid="button-ai-answer"
              >
                <Sparkles className="w-4 h-4" />
                AI Answer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Comments Section */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
          
          {/* Post Comment */}
          <Card>
            <CardContent className="pt-6">
              <Textarea
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="min-h-24 mb-3"
                data-testid="textarea-comment"
              />
              <Button
                onClick={() => postCommentMutation.mutate(commentContent)}
                disabled={!commentContent.trim() || postCommentMutation.isPending}
                data-testid="button-post-comment"
              >
                <Send className="w-4 h-4 mr-2" />
                {postCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Comments List */}
          {comments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No comments yet. Be the first to comment!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{comment.authorUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-foreground mb-3">{comment.content}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => voteCommentMutation.mutate({ commentId: comment.id, vote: 1 })}
                        disabled={voteCommentMutation.isPending}
                        data-testid={`button-upvote-comment-${comment.id}`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.voteCount || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => voteCommentMutation.mutate({ commentId: comment.id, vote: -1 })}
                        disabled={voteCommentMutation.isPending}
                        data-testid={`button-downvote-comment-${comment.id}`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
