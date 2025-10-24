import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <HowItWorks />
      
      <section className="py-24">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Role</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're a demand provider or task performer, Bridge creates value for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="hover-elevate transition-transform hover:-translate-y-1 flex flex-col" data-testid="card-for-providers">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Demand Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                  <p className="text-muted-foreground">
                    Describe your demand in one sentence, AI helps break down tasks and precisely match the most suitable talent
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Natural language demand description</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>AI smart task breakdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Precise talent matching</span>
                    </li>
                  </ul>
                </div>
                <Link href="/create-demand" className="block">
                  <Button className="w-full" data-testid="button-start-as-provider">
                    Post Demand
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate transition-transform hover:-translate-y-1 flex flex-col" data-testid="card-for-performers">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Task Performer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                  <p className="text-muted-foreground">
                    Complete capability challenges, build potential profile, receive precisely matched task opportunities
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Complete capability challenges</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Build potential profile</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Receive matched tasks</span>
                    </li>
                  </ul>
                </div>
                <Link href="/tasks" className="block">
                  <Button className="w-full" data-testid="button-start-as-performer">
                    Start Challenge
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                B
              </div>
              <span className="font-bold">Bridge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Bridge. Transform demands into opportunities, transform potential into value
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
