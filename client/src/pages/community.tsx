import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageSquare, Eye, Bookmark, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Question {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  category: "interview" | "learning_path" | "offer_choice" | "study_plan" | "textbook";
  viewCount: number;
  createdAt: string;
  user?: {
    username: string;
  };
  commentCount?: number;
  isSaved?: boolean;
}

const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.enum(["interview", "learning_path", "offer_choice", "study_plan", "textbook"]),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const categoryLabels = {
  interview: "面试",
  learning_path: "学习路径",
  offer_choice: "Offer选择",
  study_plan: "学习规划",
  textbook: "教材"
};

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", selectedCategory === "all" ? undefined : selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/questions" 
        : `/api/questions?category=${selectedCategory}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
  });

  const { data: savedItems } = useQuery({
    queryKey: ["/api/my-saves"],
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "interview",
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      return apiRequest("/api/questions", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "问题已发布",
        description: "您的问题已成功发布到社区",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "发布失败",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    createQuestionMutation.mutate(data);
  };

  const savedQuestionIds = (savedItems as any)?.questions?.map((sq: any) => sq.questionId) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">问答社区</h1>
            <p className="text-muted-foreground mt-1">
              分享经验，获取建议，共同成长
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-ask-question">
                <Plus className="w-4 h-4 mr-2" />
                提问
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">发布问题</DialogTitle>
                <DialogDescription>
                  描述您的问题，AI将自动生成相关标签
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标题</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="简短描述您的问题" 
                            {...field} 
                            data-testid="input-question-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>内容</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="详细描述您的问题..." 
                            className="min-h-32"
                            {...field} 
                            data-testid="input-question-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>分类</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-question-category">
                              <SelectValue placeholder="选择问题分类" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="interview">面试</SelectItem>
                            <SelectItem value="learning_path">学习路径</SelectItem>
                            <SelectItem value="offer_choice">Offer选择</SelectItem>
                            <SelectItem value="study_plan">学习规划</SelectItem>
                            <SelectItem value="textbook">教材</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-question"
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createQuestionMutation.isPending}
                      data-testid="button-submit-question"
                    >
                      {createQuestionMutation.isPending ? "发布中..." : "发布"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            data-testid="filter-all"
          >
            全部
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              onClick={() => setSelectedCategory(key)}
              data-testid={`filter-${key}`}
            >
              {label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : !questions || questions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">暂无问题</h3>
              <p className="text-muted-foreground mb-4">
                成为第一个提问的人吧
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {questions.map((question) => {
              const isSaved = savedQuestionIds.includes(question.id);
              
              return (
                <Card key={question.id} className="hover-elevate" data-testid={`card-question-${question.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" data-testid={`category-${question.id}`}>
                            {categoryLabels[question.category]}
                          </Badge>
                        </div>
                        <Link href={`/community/${question.id}`}>
                          <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer" data-testid={`title-${question.id}`}>
                            {question.title}
                          </CardTitle>
                        </Link>
                        <CardDescription className="mt-2 line-clamp-2" data-testid={`content-${question.id}`}>
                          {question.content}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isSaved ? "text-primary" : ""}
                        data-testid={`button-save-question-${question.id}`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {question.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" data-testid={`tag-${question.id}-${index}`}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span data-testid={`author-${question.id}`}>
                            {question.user?.username || "匿名用户"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span data-testid={`views-${question.id}`}>{question.viewCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span data-testid={`comments-${question.id}`}>{question.commentCount || 0}</span>
                          </div>
                        </div>
                        <Link href={`/community/${question.id}`}>
                          <Button size="sm" variant="outline" data-testid={`button-view-${question.id}`}>
                            查看详情
                          </Button>
                        </Link>
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
  );
}
