import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Cpu, Users, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Natural Language Description",
    description: "Describe your problem or goal in one sentence, no complex job descriptions needed",
  },
  {
    icon: Cpu,
    title: "AI Smart Analysis",
    description: "AI agent automatically breaks down demands into specific micro-tasks and estimates skill requirements",
  },
  {
    icon: Users,
    title: "Precise Smart Matching",
    description: "Based on potential profiles, the system automatically matches the most suitable talent",
  },
  {
    icon: CheckCircle,
    title: "Completion & Certification",
    description: "Receive experience credentials after task completion, continuously building your capability proof",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four steps to transform demands into value
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative hover-elevate transition-transform hover:-translate-y-1" data-testid={`card-step-${index}`}>
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="absolute -top-4 left-6 w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="mt-6 space-y-4 flex-1 flex flex-col">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1">{step.description}</p>
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
