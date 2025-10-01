import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Clock, Trophy, Target, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkillBadge } from "@/components/skill-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Challenge, ChallengeResult } from "@shared/schema";

const difficultyConfig = {
  easy: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Easy" },
  medium: { color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", label: "Medium" },
  hard: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Hard" },
};

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch challenge details
  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const challenge = challenges?.find(c => c.id === id);

  // Fetch challenge results to check if already completed
  const { data: challengeResults, isLoading: resultsLoading } = useQuery<ChallengeResult[]>({
    queryKey: ["/api/performer/challenge-results"],
  });

  const existingResult = challengeResults?.find(r => r.challengeId === id);
  const isCompleted = !!existingResult;

  // Submit challenge mutation
  const submitMutation = useMutation({
    mutationFn: async (response: string) => {
      return await apiRequest(`/api/challenges/${id}/submit`, "POST", {
        response,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performer/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performer/challenge-results"] });
      toast({
        title: "Challenge Completed!",
        description: "Your answer has been submitted and evaluated.",
      });
      setIsSubmitting(false);
      // Refresh to show results
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide your answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate(answer);
  };

  if (challengesLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Challenge Not Found</h2>
          <p className="text-muted-foreground mb-6">The challenge you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/challenges")} data-testid="button-back-to-challenges">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const diffConfig = difficultyConfig[challenge.difficulty];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/challenges")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenges
          </Button>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-challenge-title">
                {challenge.title}
              </h1>
              <p className="text-muted-foreground text-lg" data-testid="text-challenge-description">
                {challenge.description}
              </p>
            </div>
            {isCompleted && (
              <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SkillBadge type={challenge.skillType} />
            <Badge variant="outline" className={diffConfig.color}>
              {diffConfig.label}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Clock className="h-3 w-3" />
              {challenge.duration}
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-primary border-primary/20 bg-primary/10">
              <Trophy className="h-3 w-3" />
              {challenge.points} Points
            </Badge>
          </div>
        </div>

        {/* Challenge Content */}
        <div className="space-y-6">
          {/* Challenge Prompt */}
          {challenge.content && typeof challenge.content === 'object' && (challenge.content as any).prompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Challenge Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {(challenge.content as any).prompt}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already Completed - Show Results */}
          {isCompleted && existingResult ? (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  Challenge Completed
                </CardTitle>
                <CardDescription>
                  You completed this challenge on {new Date(existingResult.completedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Score</span>
                    <span className="text-2xl font-bold text-primary font-mono">{existingResult.score}/100</span>
                  </div>
                  <Progress value={existingResult.score} className="h-2" />
                </div>

                {/* Your Answer */}
                <div>
                  <h3 className="font-semibold mb-2">Your Answer</h3>
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="whitespace-pre-wrap text-sm">{existingResult.response}</p>
                  </div>
                </div>

                {/* Feedback */}
                {existingResult.feedback && (
                  <div>
                    <h3 className="font-semibold mb-2">Feedback</h3>
                    <Alert>
                      <AlertDescription className="text-sm whitespace-pre-wrap">
                        {existingResult.feedback}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <Button
                  onClick={() => setLocation("/challenges")}
                  className="w-full"
                  data-testid="button-browse-more"
                >
                  Browse More Challenges
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Answer Form */
            <Card>
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
                <CardDescription>
                  Provide your best answer to complete this challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={12}
                  className="resize-none text-base"
                  disabled={isSubmitting}
                  data-testid="input-answer"
                />

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !answer.trim()}
                    className="flex-1"
                    data-testid="button-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/challenges")}
                    disabled={isSubmitting}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
