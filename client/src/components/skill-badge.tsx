import { Badge } from "@/components/ui/badge";
import { Brain, Palette, Code, MessageCircle } from "lucide-react";

type SkillType = "logic" | "creative" | "technical" | "communication";

const skillConfig = {
  logic: { icon: Brain, label: "逻辑", color: "bg-[hsl(245_70%_55%)] text-white" },
  creative: { icon: Palette, label: "创意", color: "bg-[hsl(280_60%_55%)] text-white" },
  technical: { icon: Code, label: "技术", color: "bg-[hsl(155_65%_45%)] text-white" },
  communication: { icon: MessageCircle, label: "沟通", color: "bg-[hsl(35_80%_55%)] text-white" },
};

interface SkillBadgeProps {
  type: SkillType;
  score?: number;
}

export function SkillBadge({ type, score }: SkillBadgeProps) {
  const config = skillConfig[type];
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.color} gap-1.5`} data-testid={`badge-skill-${type}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="ml-1 font-mono text-xs">{score}</span>
      )}
    </Badge>
  );
}
