import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { useLanguage } from "./language-provider";
import heroImage from "@assets/generated_images/Hero_network_connection_visual_0af33954.png";

export function HeroSection() {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="AI matching network" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>
      
      <div className="container relative z-10 px-4 py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("hero.aiDriven")}</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("hero.title1")}
            <br />
            {t("hero.title2")}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            {t("hero.description")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-base" data-testid="button-post-demand">
              <Target className="mr-2 h-5 w-5" />
              {t("hero.postDemand")}
            </Button>
            <Button size="lg" variant="outline" className="text-base bg-background/50 backdrop-blur" data-testid="button-build-potential">
              {t("hero.buildPotential")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-8 mt-12 text-sm text-muted-foreground">
            <div>
              <div className="text-2xl font-bold text-foreground">10,000+</div>
              <div>{t("hero.stats.tasksCompleted")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">5,000+</div>
              <div>{t("hero.stats.matches")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">50+</div>
              <div>{t("hero.stats.skills")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
