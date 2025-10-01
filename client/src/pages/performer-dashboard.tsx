import { Header } from "@/components/header";
import { PotentialRadar } from "@/components/potential-radar";
import { TaskCard } from "@/components/task-card";
import { ChallengeCard } from "@/components/challenge-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp } from "lucide-react";

export default function PerformerDashboard() {
  const potentialData = [
    { skill: "Logical Reasoning", score: 85 },
    { skill: "Creative Thinking", score: 92 },
    { skill: "Technical Skills", score: 78 },
    { skill: "Communication", score: 88 },
    { skill: "Data Analysis", score: 82 },
    { skill: "Problem Solving", score: 90 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Performer Dashboard</h1>
          <p className="text-muted-foreground">Complete challenges, receive tasks, improve skills</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-total-points">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">+320 this month</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-challenges">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Challenges</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Avg score 87</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Earnings $700</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <PotentialRadar data={potentialData} overall={86} />
            
            <Card className="mt-6" data-testid="card-achievements">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {["Logic Master", "Creative Star", "Fast Responder", "Perfect Match", "Quality Assured", "Continuous Learner"].map((achievement) => (
                    <div key={achievement} className="aspect-square rounded-lg bg-primary/10 flex items-center justify-center p-2 text-center">
                      <span className="text-xs font-medium text-primary">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recommended Tasks</h2>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Based on your potential
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TaskCard
                  title="Social Media Copywriting"
                  description="Write engaging social media copy for eco-friendly coffee cup"
                  skills={["creative", "communication"]}
                  estimatedTime="2-3 hours"
                  budget="$50-80"
                  matchScore={92}
                  difficulty="intermediate"
                />
                <TaskCard
                  title="Data Analysis Report"
                  description="Analyze e-commerce user behavior data and generate insights"
                  skills={["logic", "technical"]}
                  estimatedTime="4-5 hours"
                  budget="$100-130"
                  matchScore={88}
                  difficulty="advanced"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Capability Challenges</h2>
                <Badge variant="outline">Improve your potential score</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <ChallengeCard
                  title="Logical Reasoning Challenge"
                  description="Test your analytical and reasoning abilities through logic problems"
                  skillType="logic"
                  duration="10 minutes"
                  difficulty="medium"
                  points={50}
                />
                <ChallengeCard
                  title="Creative Writing Challenge"
                  description="Create engaging marketing copy based on given theme"
                  skillType="creative"
                  duration="15 minutes"
                  difficulty="hard"
                  points={80}
                  completed={true}
                  score={92}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
