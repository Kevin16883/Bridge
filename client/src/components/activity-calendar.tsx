import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";
import { useMemo } from "react";

interface ActivityCalendarProps {
  activities: Array<{
    activityDate: string;
    count: number;
    duration: number;
  }>;
  days?: number;
}

export function ActivityCalendar({ activities, days = 90 }: ActivityCalendarProps) {
  const calendarData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    const activityMap = new Map(
      activities.map(a => [a.activityDate, { count: a.count, duration: a.duration }])
    );
    
    const weeks: Array<Array<{
      date: Date;
      dateStr: string;
      count: number;
      duration: number;
      level: number;
    }>> = [];
    
    let currentWeek: typeof weeks[0] = [];
    let currentDate = startDate;
    
    const maxCount = Math.max(...activities.map(a => a.count), 1);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const activityData = activityMap.get(dateStr);
      const count = activityData?.count || 0;
      const duration = activityData?.duration || 0;
      
      const level = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
      
      currentWeek.push({
        date: new Date(currentDate),
        dateStr,
        count,
        duration,
        level,
      });
      
      if (currentWeek.length === 7 || currentDate >= endDate) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    return weeks;
  }, [activities, days]);
  
  const getLevelColor = (level: number) => {
    const colors = [
      'bg-muted/30',
      'bg-primary/20',
      'bg-primary/40',
      'bg-primary/60',
      'bg-primary/80',
    ];
    return colors[level] || colors[0];
  };
  
  const totalActivities = activities.reduce((sum, a) => sum + a.count, 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const activeDays = activities.filter(a => a.count > 0).length;
  
  return (
    <Card data-testid="card-activity-calendar">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>
          Your platform usage over the last {days} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold" data-testid="text-total-activities">{totalActivities}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Days</p>
              <p className="text-2xl font-bold" data-testid="text-active-days">{activeDays}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold" data-testid="text-total-time">
                {Math.round(totalDuration / 60)}h
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1">
              <div className="flex gap-1">
                <div className="w-8" />
                {calendarData.length > 0 && calendarData[0].map((_, idx) => (
                  <div key={idx} className="w-8 text-[10px] text-muted-foreground text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}
                  </div>
                ))}
              </div>
              
              {calendarData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex gap-1 items-center">
                  <div className="w-8 text-[10px] text-muted-foreground text-right">
                    {weekIdx % 4 === 0 ? format(week[0].date, 'MMM') : ''}
                  </div>
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      className={`w-8 h-8 rounded-sm ${getLevelColor(day.level)} border border-border/40 transition-colors hover:ring-2 hover:ring-primary/50 cursor-pointer`}
                      data-testid={`calendar-day-${day.dateStr}`}
                      title={`${format(day.date, 'MMM d, yyyy')}\n${day.count} activities\n${Math.round(day.duration / 60)}h ${day.duration % 60}m`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-4 h-4 rounded-sm ${getLevelColor(level)} border border-border/40`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
