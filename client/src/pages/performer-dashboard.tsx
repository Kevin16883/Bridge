import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PotentialRadar } from "@/components/potential-radar";
import { ChallengeCard } from "@/components/challenge-card";
import type { Challenge, SkillScore, ChallengeResult } from "@shared/schema";
import { Link } from "wouter";

interface PerformerStats {
  totalPoints: number;
  completedChallenges: number;
  avgScore: number;
  overallScore: number;
  completedTasks: number;
  totalEarnings: number;
}

export default function PerformerDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<PerformerStats>({
    queryKey: ["/api/performer/stats"],
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: skillScores, isLoading: scoresLoading } = useQuery<SkillScore[]>({
    queryKey: ["/api/skills"],
  });

  const { data: challengeResults, isLoading: resultsLoading } = useQuery<ChallengeResult[]>({
    queryKey: ["/api/performer/challenge-results"],
  });

  // Transform skill scores for radar chart
  const radarData = skillScores?.map(score => ({
    skill: score.skillType.charAt(0).toUpperCase() + score.skillType.slice(1),
    score: score.score,
  })) || [];

  // Get completed challenge IDs
  const completedChallengeIds = new Set(challengeResults?.map(r => r.challengeId) || []);

  // Filter available challenges (not completed yet) - show up to 4
  const availableChallenges = challenges
    ?.filter(c => !completedChallengeIds.has(c.id))
    .slice(0, 4) || [];

  if (statsLoading || challengesLoading || scoresLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-dashboard">Performer Dashboard</h1>
          <p className="text-muted-foreground">Complete challenges to build your potential profile and unlock task opportunities</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-total-points">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-total-points">{stats?.totalPoints || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.completedChallenges || 0} challenges completed
              </p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-avg-score">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-avg-score">{stats?.avgScore || 0}</div>
              <p className="text-xs text-muted-foreground">
                Out of 100 points
              </p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-overall-score">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Potential</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-overall-score">{stats?.overallScore || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all skills
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            {radarData.length > 0 ? (
              <PotentialRadar data={radarData} overall={stats?.overallScore || 0} />
            ) : (
              <Card data-testid="card-empty-radar">
                <CardHeader>
                  <CardTitle>Your Potential Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete challenges to build your skill profile
                    </p>
                    <Button asChild data-testid="button-start-challenges">
                      <Link href="/challenges">Start Challenges</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Available Challenges</h2>
                <Badge variant="outline">Build your potential</Badge>
              </div>
              
              {availableChallenges.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {availableChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      id={challenge.id}
                      title={challenge.title}
                      description={challenge.description}
                      skillType={challenge.skillType}
                      duration={challenge.duration}
                      difficulty={challenge.difficulty}
                      points={challenge.points}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No challenges available yet. Check back soon!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {availableChallenges.length > 0 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild data-testid="button-view-all-challenges">
                    <Link href="/challenges">View All Challenges</Link>
                  </Button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Skill Breakdown</h2>
              </div>
              
              {skillScores && skillScores.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {skillScores.map((skill) => {
                    const skillColors: Record<string, string> = {
                      logic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                      creative: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
                      technical: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
                      communication: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
                    };
                    
                    return (
                      <Card key={skill.id} className={`border-2 ${skillColors[skill.skillType] || ""}`} data-testid={`skill-card-${skill.skillType}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            {skill.skillType.charAt(0).toUpperCase() + skill.skillType.slice(1)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold" data-testid={`skill-score-${skill.skillType}`}>{skill.score}</span>
                            <span className="text-sm text-muted-foreground mb-1">/100</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        Complete challenges to unlock skill scores
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
