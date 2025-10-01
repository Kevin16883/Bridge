import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Filter, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChallengeCard } from "@/components/challenge-card";
import type { Challenge, ChallengeResult } from "@shared/schema";

type SkillType = "logic" | "creative" | "technical" | "communication" | "all";
type Difficulty = "easy" | "medium" | "hard" | "all";

export default function Challenges() {
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<SkillType>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>("all");

  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: challengeResults, isLoading: resultsLoading } = useQuery<ChallengeResult[]>({
    queryKey: ["/api/performer/challenge-results"],
  });

  // Get completed challenge IDs
  const completedChallengeIds = new Set(challengeResults?.map(r => r.challengeId) || []);

  // Create a map of challenge results for scores
  const resultsMap = new Map(
    challengeResults?.map(r => [r.challengeId, r.score]) || []
  );

  // Filter and search challenges
  const filteredChallenges = challenges?.filter(challenge => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!challenge.title.toLowerCase().includes(query) && 
          !challenge.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Skill filter
    if (skillFilter !== "all" && challenge.skillType !== skillFilter) {
      return false;
    }

    // Difficulty filter
    if (difficultyFilter !== "all" && challenge.difficulty !== difficultyFilter) {
      return false;
    }

    return true;
  }) || [];

  // Separate completed and available challenges
  const availableChallenges = filteredChallenges.filter(c => !completedChallengeIds.has(c.id));
  const completedChallenges = filteredChallenges.filter(c => completedChallengeIds.has(c.id));

  const isLoading = challengesLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Skill Challenges
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete challenges to build your skill profile and unlock task opportunities
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Skill Filter */}
              <div className="w-full lg:w-48">
                <Select
                  value={skillFilter}
                  onValueChange={(value) => setSkillFilter(value as SkillType)}
                >
                  <SelectTrigger data-testid="select-skill-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    <SelectItem value="logic">Logic</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div className="w-full lg:w-48">
                <Select
                  value={difficultyFilter}
                  onValueChange={(value) => setDifficultyFilter(value as Difficulty)}
                >
                  <SelectTrigger data-testid="select-difficulty-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters */}
              {(searchQuery || skillFilter !== "all" || difficultyFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSkillFilter("all");
                    setDifficultyFilter("all");
                  }}
                  data-testid="button-reset-filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Badge variant="outline" className="text-sm">
            <span className="font-semibold mr-1">{availableChallenges.length}</span>
            Available
          </Badge>
          <Badge variant="outline" className="text-sm bg-primary/10 border-primary/20">
            <span className="font-semibold mr-1">{completedChallenges.length}</span>
            Completed
          </Badge>
        </div>

        {/* Available Challenges */}
        {availableChallenges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" data-testid="text-section-available">
              Available Challenges
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        )}

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6" data-testid="text-section-completed">
              Completed Challenges
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  skillType={challenge.skillType}
                  duration={challenge.duration}
                  difficulty={challenge.difficulty}
                  points={challenge.points}
                  completed
                  score={resultsMap.get(challenge.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredChallenges.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Challenges Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSkillFilter("all");
                  setDifficultyFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
