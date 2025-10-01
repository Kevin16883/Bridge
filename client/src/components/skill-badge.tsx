import { Badge } from "@/components/ui/badge";
import { Brain, Palette, Code, MessageCircle } from "lucide-react";
import { useLanguage } from "./language-provider";

type SkillType = "logic" | "creative" | "technical" | "communication";

const skillConfig = {
  logic: { icon: Brain, key: "skill.logic", color: "bg-[hsl(245_70%_55%)] text-white" },
  creative: { icon: Palette, key: "skill.creative", color: "bg-[hsl(280_60%_55%)] text-white" },
  technical: { icon: Code, key: "skill.technical", color: "bg-[hsl(155_65%_45%)] text-white" },
  communication: { icon: MessageCircle, key: "skill.communication", color: "bg-[hsl(35_80%_55%)] text-white" },
};

interface SkillBadgeProps {
  type: SkillType;
  score?: number;
}

export function SkillBadge({ type, score }: SkillBadgeProps) {
  const { t } = useLanguage();
  const config = skillConfig[type];
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.color} gap-1.5`} data-testid={`badge-skill-${type}`}>
      <Icon className="h-3 w-3" />
      <span>{t(config.key)}</span>
      {score !== undefined && (
        <span className="ml-1 font-mono text-xs">{score}</span>
      )}
    </Badge>
  );
}
