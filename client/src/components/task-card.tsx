import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { SkillBadge } from "./skill-badge";

interface TaskCardProps {
  title: string;
  description: string;
  skills: Array<"logic" | "creative" | "technical" | "communication">;
  estimatedTime: string;
  budget: string;
  matchScore?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const difficultyLabels = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

export function TaskCard({
  title,
  description,
  skills,
  estimatedTime,
  budget,
  matchScore,
  difficulty = "intermediate",
}: TaskCardProps) {
  return (
    <Card className="hover-elevate transition-transform hover:-translate-y-1" data-testid="card-task">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight">{title}</h3>
          {matchScore !== undefined && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 shrink-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              {matchScore}% 匹配
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <SkillBadge key={skill} type={skill} />
          ))}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span>{budget}</span>
          </div>
          <Badge variant="outline" className={difficultyColors[difficulty]}>
            {difficultyLabels[difficulty]}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full" data-testid="button-view-task">查看详情</Button>
      </CardFooter>
    </Card>
  );
}
