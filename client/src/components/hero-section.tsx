import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/image_1761289155772.png";

export function HeroSection() {
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
            <span className="text-sm font-medium text-primary">AI-Driven Smart Matching</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Transform Demands into Opportunities
            <br />
            Transform Potential into Value
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Bridge is not a recruitment website, but a dynamic, intelligent demand-potential real-time matching protocol. Describe demands in natural language, AI automatically breaks down tasks, and precisely matches the most suitable talent.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/create-demand">
              <Button size="lg" className="text-base w-full sm:w-auto" data-testid="button-post-demand">
                <Target className="mr-2 h-5 w-5" />
                Post Demand
              </Button>
            </Link>
            <Link href="/tasks">
              <Button size="lg" variant="outline" className="text-base bg-background/50 backdrop-blur w-full sm:w-auto" data-testid="button-build-potential">
                Build Potential
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
