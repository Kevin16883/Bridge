import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Cpu, Users, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "自然语言描述需求",
    description: "用一句话描述你的问题或目标，无需复杂的职位描述",
  },
  {
    icon: Cpu,
    title: "AI智能解析",
    description: "AI代理自动将需求拆解为具体的微任务，并估算技能要求",
  },
  {
    icon: Users,
    title: "精准智能匹配",
    description: "基于潜力图谱，系统自动匹配最合适的人才完成任务",
  },
  {
    icon: CheckCircle,
    title: "完成与认证",
    description: "任务完成后获得经验凭证，持续构建你的能力证明",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">工作原理</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            四步实现从需求到价值的转化
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative hover-elevate transition-transform hover:-translate-y-1" data-testid={`card-step-${index}`}>
                <CardContent className="pt-6">
                  <div className="absolute -top-4 left-6 w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
