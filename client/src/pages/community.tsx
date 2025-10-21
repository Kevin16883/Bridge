import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, MessageSquare, Eye, Tag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { useState } from "react";
import type { Question } from "@shared/schema";

interface QuestionWithAuthor extends Question {
  authorUsername: string;
  answerCount: number;
  commentCount: number;
}

export default function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: questions, isLoading } = useQuery<QuestionWithAuthor[]>({
    queryKey: ["/api/questions"],
  });

  const filteredQuestions = questions?.filter(q => {
    const matchesSearch = !searchQuery || 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(questions?.map(q => q.category) || []));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Q&A Community</h1>
            <p className="text-muted-foreground mt-1">
              Ask questions and share knowledge with the community
            </p>
          </div>
          <Link href="/community/ask">
            <Button data-testid="button-ask-question">
              <Plus className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-questions"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-all"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              data-testid={`filter-${category}`}
            >
              {category}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        ) : !filteredQuestions || filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to ask a question in the community
              </p>
              <Link href="/community/ask">
                <Button data-testid="button-ask-first-question">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask First Question
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="hover-elevate" data-testid={`card-question-${question.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/community/questions/${question.id}`}>
                        <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                          {question.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-2 line-clamp-2">
                        {question.content}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" data-testid={`category-${question.id}`}>
                      {question.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1" data-testid={`views-${question.id}`}>
                        <Eye className="w-4 h-4" />
                        <span>{question.viewCount} views</span>
                      </div>
                      <div className="flex items-center gap-1" data-testid={`answers-${question.id}`}>
                        <MessageSquare className="w-4 h-4" />
                        <span>{question.answerCount || 0} answers</span>
                      </div>
                      <div className="flex items-center gap-1" data-testid={`comments-${question.id}`}>
                        <MessageSquare className="w-4 h-4" />
                        <span>{question.commentCount || 0} comments</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {question.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Asked by <span className="font-medium">{question.authorUsername}</span> • {new Date(question.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
