import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, CheckCircle2 } from "lucide-react";
import { SkillBadge } from "./skill-badge";

interface ChallengeCardProps {
  title: string;
  description: string;
  skillType: "logic" | "creative" | "technical" | "communication";
  duration: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  completed?: boolean;
  score?: number;
}

const difficultyConfig = {
  easy: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Easy" },
  medium: { color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", label: "Medium" },
  hard: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Hard" },
};

export function ChallengeCard({
  title,
  description,
  skillType,
  duration,
  difficulty,
  points,
  completed = false,
  score,
}: ChallengeCardProps) {
  const diffConfig = difficultyConfig[difficulty];
  
  return (
    <Card className={`hover-elevate transition-transform hover:-translate-y-1 ${completed ? 'border-primary/50' : ''}`} data-testid="card-challenge">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight">{title}</h3>
              {completed && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <SkillBadge type={skillType} />
          <Badge variant="outline" className={diffConfig.color}>
            {diffConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <Trophy className="h-4 w-4" />
            <span>{points} Points</span>
          </div>
        </div>
        
        {completed && score !== undefined && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-sm text-muted-foreground">Your Score</div>
            <div className="text-2xl font-bold text-primary font-mono">{score}</div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={completed ? "outline" : "default"}
          data-testid={completed ? "button-review-challenge" : "button-start-challenge"}
        >
          {completed ? "Review" : "Start Challenge"}
        </Button>
      </CardFooter>
    </Card>
  );
}
