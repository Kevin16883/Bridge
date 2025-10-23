import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sparkles, Calendar, Clock, TrendingUp, Lightbulb, Award } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  activitiesCount: number;
  totalDuration: number;
  achievements: string[];
  evaluation: string;
  suggestions: string;
  createdAt: string;
}

export function WeeklyReportViewer() {
  const { toast } = useToast();
  const [showLatest, setShowLatest] = useState(true);
  
  const { data: latestReport, isLoading: latestLoading } = useQuery<WeeklyReport | null>({
    queryKey: ["/api/weekly-reports/latest"],
  });
  
  const { data: allReports, isLoading: allLoading } = useQuery<WeeklyReport[]>({
    queryKey: ["/api/weekly-reports"],
    enabled: !showLatest,
  });
  
  const generateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/weekly-reports/generate", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-reports/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-reports"] });
      toast({
        title: "Weekly Report Generated",
        description: "Your AI-powered weekly report has been created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate weekly report",
        variant: "destructive",
      });
    },
  });
  
  const isLoading = showLatest ? latestLoading : allLoading;
  const reports = showLatest ? (latestReport ? [latestReport] : []) : (allReports || []);
  
  if (isLoading) {
    return (
      <Card data-testid="card-weekly-report">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Weekly Report
          </CardTitle>
          <CardDescription>Loading your performance insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 bg-muted/30 animate-pulse rounded" />
            <div className="h-24 bg-muted/30 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card data-testid="card-weekly-report">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Weekly Report
            </CardTitle>
            <CardDescription>
              Personalized insights and recommendations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {reports.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLatest(!showLatest)}
                data-testid="button-toggle-reports"
              >
                {showLatest ? "View All" : "Latest Only"}
              </Button>
            )}
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              size="sm"
              data-testid="button-generate-report"
            >
              {generateMutation.isPending ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No weekly reports yet. Generate your first AI-powered report!
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate-first-report"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Weekly Report
            </Button>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="space-y-4 border-b pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(report.weekStart), 'MMM d')} - {format(new Date(report.weekEnd), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{report.activitiesCount} activities</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(report.totalDuration / 60)}h</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-muted-foreground">{report.summary}</p>
                </div>
                
                {report.achievements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Achievements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {report.achievements.map((achievement, idx) => (
                        <Badge key={idx} variant="secondary" data-testid={`badge-achievement-${idx}`}>
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Evaluation
                  </h4>
                  <p className="text-muted-foreground">{report.evaluation}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Suggestions
                  </h4>
                  <p className="text-muted-foreground">{report.suggestions}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
