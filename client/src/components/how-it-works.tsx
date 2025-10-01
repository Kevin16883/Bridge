import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Cpu, Users, CheckCircle } from "lucide-react";
import { useLanguage } from "./language-provider";

const steps = [
  {
    icon: MessageSquare,
    titleKey: "howItWorks.step1.title",
    descKey: "howItWorks.step1.desc",
  },
  {
    icon: Cpu,
    titleKey: "howItWorks.step2.title",
    descKey: "howItWorks.step2.desc",
  },
  {
    icon: Users,
    titleKey: "howItWorks.step3.title",
    descKey: "howItWorks.step3.desc",
  },
  {
    icon: CheckCircle,
    titleKey: "howItWorks.step4.title",
    descKey: "howItWorks.step4.desc",
  },
];

export function HowItWorks() {
  const { t } = useLanguage();
  
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t("howItWorks.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
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
                    <h3 className="font-semibold text-lg">{t(step.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
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
