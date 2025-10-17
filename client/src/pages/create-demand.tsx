import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, AlertCircle, Plus, Trash2, Edit2, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Task {
  title: string;
  description: string;
  skills: string[];
  estimatedTime: string;
  difficulty: "easy" | "medium" | "hard";
  budget: number;
}

interface AITask {
  title: string;
  description: string;
  skills: string[];
  estimatedTime: string;
  difficulty: string;
  budget: string;
}

interface TaskBreakdown {
  tasks: AITask[];
  totalBudget: string;
  projectSummary: string;
}

export default function CreateDemand() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get draft ID from URL params
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const draftId = urlParams.get("draft");
  
  const [demand, setDemand] = useState("");
  const [step, setStep] = useState<"input" | "edit-tasks">("input");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(draftId);

  // Load draft if draftId exists
  const { data: draftData } = useQuery<{ originalDemand: string; id: string }>({
    queryKey: ["/api/projects", draftId],
    enabled: !!draftId,
  });

  useEffect(() => {
    if (draftData && draftId) {
      // Load draft data
      setDemand(draftData.originalDemand || "");
      setCurrentProjectId(draftId);
    }
  }, [draftData, draftId]);

  const analyzeMutation = useMutation({
    mutationFn: async (demandText: string) => {
      const response = await apiRequest("POST", "/api/projects/analyze", { demand: demandText });
      return await response.json() as TaskBreakdown;
    },
    onSuccess: (data) => {
      // Convert budget strings to numbers and difficulty values
      const difficultyMap: Record<string, "easy" | "medium" | "hard"> = {
        "beginner": "easy",
        "intermediate": "medium",
        "advanced": "hard",
      };
      
      const convertedTasks = data.tasks.map(task => ({
        ...task,
        budget: parseFloat(task.budget.replace(/[^0-9.]/g, '')) || 100,
        difficulty: difficultyMap[task.difficulty] || "medium",
      }));
      setTasks(convertedTasks);
      setStep("edit-tasks");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { demand: string; totalBudget: number; tasks: Task[] }) => {
      const response = await apiRequest("POST", "/api/projects/custom-create", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/provider-dashboard");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: { demand: string; status: "draft" }) => {
      if (currentProjectId) {
        // Update existing draft
        const response = await apiRequest("PATCH", `/api/projects/${currentProjectId}`, data);
        return await response.json();
      } else {
        // Create new draft
        const response = await apiRequest("POST", "/api/projects", data);
        const result = await response.json();
        setCurrentProjectId(result.id);
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "草稿已保存",
        description: "您的需求已保存为草稿",
      });
    },
    onError: () => {
      toast({
        title: "保存失败",
        description: "保存草稿失败，请重试",
        variant: "destructive",
      });
    },
  });

  // Auto-save draft when demand changes (debounced)
  useEffect(() => {
    if (demand.trim().length >= 10) {
      const timer = setTimeout(() => {
        saveDraftMutation.mutate({ demand, status: "draft" });
      }, 2000); // 2 seconds debounce
      return () => clearTimeout(timer);
    }
  }, [demand]);

  const handleAnalyzeWithAI = () => {
    if (demand.trim().length < 10) return;
    analyzeMutation.mutate(demand);
  };

  const handleSkipAI = () => {
    // Start with one empty task
    setTasks([{
      title: "",
      description: "",
      skills: [],
      estimatedTime: "1 hour",
      difficulty: "medium",
      budget: 100,
    }]);
    setStep("edit-tasks");
    setEditingIndex(0);
  };

  const handleAddTask = () => {
    setTasks([...tasks, {
      title: "",
      description: "",
      skills: [],
      estimatedTime: "1 hour",
      difficulty: "medium",
      budget: 100,
    }]);
    setEditingIndex(tasks.length);
  };

  const handleDeleteTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleUpdateTask = (index: number, field: keyof Task, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleAddSkill = (index: number) => {
    if (!skillInput.trim()) return;
    const updated = [...tasks];
    updated[index] = {
      ...updated[index],
      skills: [...updated[index].skills, skillInput.trim()],
    };
    setTasks(updated);
    setSkillInput("");
  };

  const handleRemoveSkill = (taskIndex: number, skillIndex: number) => {
    const updated = [...tasks];
    updated[taskIndex] = {
      ...updated[taskIndex],
      skills: updated[taskIndex].skills.filter((_, i) => i !== skillIndex),
    };
    setTasks(updated);
  };

  const handlePublish = () => {
    const totalBudget = tasks.reduce((sum, task) => sum + task.budget, 0);
    createMutation.mutate({ demand, totalBudget, tasks });
  };

  const totalBudget = tasks.reduce((sum, task) => sum + task.budget, 0);
  const isPublishDisabled = tasks.length === 0 || tasks.some(t => !t.title || !t.description) || !demand.trim();

  const skillColors: Record<string, string> = {
    logic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    creative: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    technical: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    communication: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  if (step === "edit-tasks") {
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
            Back to Edit Demand
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Tasks</CardTitle>
              <CardDescription>Review and modify tasks before publishing your project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="text-2xl font-bold">${totalBudget.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {editingIndex === index ? (
                            <Input
                              value={task.title}
                              onChange={(e) => handleUpdateTask(index, "title", e.target.value)}
                              placeholder="Task title"
                              className="mb-2"
                              data-testid={`input-task-title-${index}`}
                            />
                          ) : (
                            <CardTitle className="text-base">{task.title || "Untitled Task"}</CardTitle>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                            data-testid={`button-edit-${index}`}
                          >
                            {editingIndex === index ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTask(index)}
                            data-testid={`button-delete-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingIndex === index ? (
                        <>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={task.description}
                              onChange={(e) => handleUpdateTask(index, "description", e.target.value)}
                              placeholder="Task description"
                              className="mt-1"
                              data-testid={`input-task-description-${index}`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Estimated Time</Label>
                              <Input
                                value={task.estimatedTime}
                                onChange={(e) => handleUpdateTask(index, "estimatedTime", e.target.value)}
                                placeholder="e.g., 2 hours"
                                className="mt-1"
                                data-testid={`input-task-time-${index}`}
                              />
                            </div>
                            <div>
                              <Label>Budget ($)</Label>
                              <Input
                                type="number"
                                value={task.budget}
                                onChange={(e) => handleUpdateTask(index, "budget", parseFloat(e.target.value) || 0)}
                                placeholder="100"
                                className="mt-1"
                                data-testid={`input-task-budget-${index}`}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Difficulty</Label>
                            <Select
                              value={task.difficulty}
                              onValueChange={(value) => handleUpdateTask(index, "difficulty", value)}
                            >
                              <SelectTrigger className="mt-1" data-testid={`select-task-difficulty-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Skills</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                placeholder="Add a skill"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSkill(index);
                                  }
                                }}
                                data-testid={`input-add-skill-${index}`}
                              />
                              <Button
                                size="icon"
                                onClick={() => handleAddSkill(index)}
                                data-testid={`button-add-skill-${index}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {task.skills.map((skill, skillIndex) => (
                                <Badge
                                  key={skillIndex}
                                  variant="outline"
                                  className={`${skillColors[skill] || ""} cursor-pointer`}
                                  onClick={() => handleRemoveSkill(index, skillIndex)}
                                  data-testid={`badge-skill-${index}-${skillIndex}`}
                                >
                                  {skill} ×
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">{task.description || "No description"}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Estimated Time:</span>
                              <span className="ml-2 font-medium">{task.estimatedTime}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Budget:</span>
                              <span className="ml-2 font-medium">${task.budget}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{task.difficulty}</Badge>
                            {task.skills.map((skill, skillIndex) => (
                              <Badge
                                key={skillIndex}
                                variant="outline"
                                className={skillColors[skill] || ""}
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleAddTask}
                className="w-full mt-4"
                data-testid="button-add-task"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Task
              </Button>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handlePublish}
                  className="flex-1"
                  disabled={isPublishDisabled || createMutation.isPending}
                  data-testid="button-publish"
                >
                  {createMutation.isPending ? "Publishing..." : "Publish Project"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>

              {createMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to create project. Please try again.
                  </AlertDescription>
                </Alert>
              )}
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
              Describe your demand in natural language, then choose to use AI breakdown or create tasks manually
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Your Demand</label>
                {saveDraftMutation.isPending && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    自动保存中...
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Example: I need to launch a new eco-friendly coffee cup product on social media. I want engaging content that highlights sustainability features and appeals to environmentally conscious consumers aged 25-40..."
                className="min-h-[200px] resize-none"
                value={demand}
                onChange={(e) => setDemand(e.target.value)}
                data-testid="input-demand"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters • {demand.length} characters
                {currentProjectId && " • 草稿已保存"}
              </p>
            </div>

            {analyzeMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to analyze demand. Please try again or create tasks manually.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleAnalyzeWithAI}
                disabled={demand.trim().length < 10 || analyzeMutation.isPending}
                className="w-full"
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Breakdown
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipAI}
                disabled={demand.trim().length < 10}
                data-testid="button-skip-ai"
              >
                Manual Create
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Two Ways to Create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">AI Breakdown (Recommended)</h4>
                  <p className="text-sm text-muted-foreground">
                    Let AI analyze your demand and automatically break it down into optimized micro-tasks with budget estimates, skill requirements, and time estimates. You can edit all tasks before publishing.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Edit2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Manual Create</h4>
                  <p className="text-sm text-muted-foreground">
                    For small or simple tasks, skip AI and create your tasks manually with full control over every detail.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
