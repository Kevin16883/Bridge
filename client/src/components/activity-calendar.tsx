import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TimeTracking, Task, WeeklyReport } from "@shared/schema";

interface TimeTrackingWithTask extends TimeTracking {
  task: Task;
}

interface DayData {
  date: string;
  totalMinutes: number;
}

export function ActivityCalendar() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get last 90 days of time tracking data
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: timeData } = useQuery<TimeTracking[]>({
    queryKey: ["/api/performer/time-tracking", { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/performer/time-tracking?${params}`);
      if (!response.ok) throw new Error("Failed to fetch time tracking");
      return response.json();
    },
    enabled: open,
  });

  const { data: dailyTasks } = useQuery<TimeTrackingWithTask[]>({
    queryKey: ["/api/performer/daily-time", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const response = await fetch(`/api/performer/daily-time/${selectedDate}`);
      if (!response.ok) throw new Error("Failed to fetch daily time");
      return response.json();
    },
    enabled: !!selectedDate,
  });

  const { data: weeklyReports } = useQuery<WeeklyReport[]>({
    queryKey: ["/api/performer/weekly-reports"],
    enabled: open,
  });

  // Process time data into daily totals
  const dailyData = timeData?.reduce((acc, entry) => {
    const existing = acc.find(d => d.date === entry.date);
    if (existing) {
      existing.totalMinutes += entry.duration;
    } else {
      acc.push({ date: entry.date, totalMinutes: entry.duration });
    }
    return acc;
  }, [] as DayData[]) || [];

  // Get intensity level for heatmap (0-4)
  const getIntensity = (minutes: number) => {
    if (minutes === 0) return 0;
    if (minutes < 60) return 1;
    if (minutes < 120) return 2;
    if (minutes < 240) return 3;
    return 4;
  };

  // Generate GitHub-style calendar grid (7 rows, weeks as columns)
  const generateCalendarGrid = () => {
    const grid: (DayData | null)[][] = [[], [], [], [], [], [], []]; // 7 rows for days of week
    const today = new Date();
    const endDate = new Date(today);
    
    // Go back 12 weeks (84 days) to show ~3 months
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);
    
    // Adjust start to previous Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData.find(d => d.date === dateStr);
      const row = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      grid[row].push({
        date: dateStr,
        totalMinutes: dayData?.totalMinutes || 0,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  // Prepare pie chart data
  const pieData = dailyTasks?.map(t => ({
    name: t.task.title,
    value: t.duration,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  })) || [];

  const totalMinutes = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-activity-calendar">
          <CalendarIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Calendar</DialogTitle>
          <DialogDescription>
            Track your daily work hours and view weekly reports
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="calendar" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="reports">Weekly Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            {/* Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last 90 Days Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {/* GitHub-style contribution graph: 7 rows (days), columns (weeks) */}
                <div className="overflow-x-auto">
                  <div className="flex gap-1">
                    {calendarGrid[0].map((_, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {calendarGrid.map((row, dayIndex) => {
                          const day = row[weekIndex];
                          if (!day) return <div key={dayIndex} className="h-3 w-3" />;
                          
                          const intensity = getIntensity(day.totalMinutes);
                          
                          return (
                            <button
                              key={day.date}
                              onClick={() => setSelectedDate(day.date)}
                              className={`
                                h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-primary
                                ${intensity === 0 ? 'bg-muted' : ''}
                                ${intensity === 1 ? 'bg-green-200 dark:bg-green-900' : ''}
                                ${intensity === 2 ? 'bg-green-400 dark:bg-green-700' : ''}
                                ${intensity === 3 ? 'bg-green-600 dark:bg-green-600' : ''}
                                ${intensity === 4 ? 'bg-green-800 dark:bg-green-400' : ''}
                              `}
                              title={`${day.date}: ${Math.floor(day.totalMinutes / 60)}h ${day.totalMinutes % 60}m`}
                              data-testid={`calendar-day-${day.date}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="h-3 w-3 bg-muted rounded-sm" />
                    <div className="h-3 w-3 bg-green-200 dark:bg-green-900 rounded-sm" />
                    <div className="h-3 w-3 bg-green-400 dark:bg-green-700 rounded-sm" />
                    <div className="h-3 w-3 bg-green-600 dark:bg-green-600 rounded-sm" />
                    <div className="h-3 w-3 bg-green-800 dark:bg-green-400 rounded-sm" />
                  </div>
                  <span>More</span>
                </div>
              </CardContent>
            </Card>

            {/* Daily Breakdown */}
            {selectedDate && dailyTasks && dailyTasks.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedDate(null)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Pie Chart */}
                    <div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `${Math.floor(value / 60)}h ${value % 60}m`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Total: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                      </p>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2">
                      {dailyTasks.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                          <span className="text-sm font-medium truncate flex-1">{item.task.title}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {Math.floor(item.duration / 60)}h {item.duration % 60}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {weeklyReports && weeklyReports.length > 0 ? (
              weeklyReports.map((report) => (
                <Card key={report.id} data-testid={`weekly-report-${report.id}`}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Week of {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tasks Completed:</span>
                        <p className="font-semibold">{report.tasksCompleted}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Hours:</span>
                        <p className="font-semibold">{Math.floor(report.totalHours / 60)}h {report.totalHours % 60}m</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Summary</p>
                      <p className="text-sm text-muted-foreground">{report.summary}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Evaluation</p>
                      <p className="text-sm text-muted-foreground">{report.evaluation}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Suggestions & Learning</p>
                      <p className="text-sm text-muted-foreground">{report.suggestions}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No weekly reports available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Reports are automatically generated each week based on your activity
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
