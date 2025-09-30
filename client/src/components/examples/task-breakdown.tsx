import { TaskBreakdown } from "../task-breakdown";
import { ThemeProvider } from "../theme-provider";

export default function TaskBreakdownExample() {
  const mockTasks = [
    {
      id: "1",
      title: "内容策划",
      skills: ["创意思维", "市场洞察"],
      estimatedTime: "2-3小时",
      budget: "¥300-400",
      status: "completed" as const,
    },
    {
      id: "2",
      title: "文案撰写",
      skills: ["创意写作", "沟通表达"],
      estimatedTime: "3-4小时",
      budget: "¥400-600",
      status: "matched" as const,
    },
    {
      id: "3",
      title: "图片设计",
      skills: ["视觉设计", "创意思维"],
      estimatedTime: "4-5小时",
      budget: "¥500-800",
      status: "pending" as const,
    },
    {
      id: "4",
      title: "数据分析",
      skills: ["数据分析", "逻辑推理"],
      estimatedTime: "2-3小时",
      budget: "¥300-400",
      status: "pending" as const,
    },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <TaskBreakdown
          originalDemand="我想为我的新款环保咖啡杯做一波小红书推广"
          tasks={mockTasks}
        />
      </div>
    </ThemeProvider>
  );
}
