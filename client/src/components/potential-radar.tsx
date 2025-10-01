import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface PotentialRadarProps {
  data: {
    skill: string;
    score: number;
  }[];
  overall?: number;
}

export function PotentialRadar({ data, overall }: PotentialRadarProps) {
  return (
    <Card data-testid="card-potential-radar">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Potential Profile</span>
          {overall !== undefined && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <div className="text-3xl font-bold text-primary font-mono">{overall}</div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar 
              name="Score" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
