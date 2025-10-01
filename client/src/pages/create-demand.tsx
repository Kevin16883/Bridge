import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TaskBreakdown {
  tasks: {
    title: string;
    description: string;
    skills: string[];
    estimatedTime: string;
    difficulty: string;
    budget: string;
  }[];
  totalBudget: string;
  projectSummary: string;
}

export default function CreateDemand() {
  const [, setLocation] = useLocation();
  const [demand, setDemand] = useState("");
  const [analysis, setAnalysis] = useState<TaskBreakdown | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  const analyzeMutation = useMutation({
    mutationFn: async (demandText: string) => {
      const response = await apiRequest("POST", "/api/projects/analyze", { demand: demandText });
      return await response.json() as TaskBreakdown;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setStep("review");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (demandText: string) => {
      const response = await apiRequest("POST", "/api/projects/ai-create", { demand: demandText });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/provider-dashboard");
    },
  });

  const handleAnalyze = () => {
    if (demand.trim().length < 10) {
      return;
    }
    analyzeMutation.mutate(demand);
  };

  const handleCreate = () => {
    createMutation.mutate(demand);
  };

  const skillColors: Record<string, string> = {
    logic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    creative: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    technical: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    communication: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  if (step === "review" && analysis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setStep("input")}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Result</CardTitle>
              <CardDescription>{analysis.projectSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget Estimate</span>
                  <span className="text-2xl font-bold">{analysis.totalBudget}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Task Breakdown ({analysis.tasks.length} tasks)</h3>
                {analysis.tasks.map((task, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <CardDescription className="mt-1">{task.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{task.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Estimated Time:</span>
                          <span className="ml-2 font-medium">{task.estimatedTime}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="ml-2 font-medium">{task.budget}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className={skillColors[skill] || ""}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreate}
                  className="flex-1"
                  disabled={createMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createMutation.isPending ? "Creating Project..." : "Create Project"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  data-testid="button-modify"
                >
                  Modify Demand
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/provider-dashboard")}
          className="mb-6"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Create New Demand</CardTitle>
            </div>
            <CardDescription>
              Describe your demand in natural language, and let AI break it down into manageable tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Be as specific as possible. Include what you want to achieve,
                your target audience, and any specific requirements.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Demand</label>
              <Textarea
                placeholder="Example: I need to launch a new eco-friendly coffee cup product on social media. I want engaging content that highlights sustainability features and appeals to environmentally conscious consumers aged 25-40..."
                className="min-h-[200px] resize-none"
                value={demand}
                onChange={(e) => setDemand(e.target.value)}
                data-testid="input-demand"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters • {demand.length} characters
              </p>
            </div>

            {analyzeMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to analyze demand. Please try again or contact support if the issue persists.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={demand.trim().length < 10 || analyzeMutation.isPending}
              className="w-full"
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                1
              </div>
              <p>Describe your demand in natural language</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                2
              </div>
              <p>AI analyzes and breaks down into micro-tasks with required skills</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                3
              </div>
              <p>Tasks are matched with performers based on their potential profiles</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                4
              </div>
              <p>Track progress and manage your project</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
