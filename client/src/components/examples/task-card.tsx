import { TaskCard } from "../task-card";
import { ThemeProvider } from "../theme-provider";

export default function TaskCardExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-md">
        <TaskCard
          title="小红书推广文案撰写"
          description="为环保咖啡杯撰写吸引人的小红书推广文案，需要突出产品的环保理念和使用场景"
          skills={["creative", "communication"]}
          estimatedTime="2-3小时"
          budget="¥300-500"
          matchScore={92}
          difficulty="intermediate"
        />
      </div>
    </ThemeProvider>
  );
}
