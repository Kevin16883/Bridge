import { EmptyState } from "../empty-state";
import { ThemeProvider } from "../theme-provider";

export default function EmptyStateExample() {
  return (
    <ThemeProvider>
      <div className="p-8">
        <EmptyState
          title="还没有任务"
          description="开始完成能力挑战，构建你的潜力图谱，系统会自动为你推荐合适的任务"
          actionLabel="开始挑战"
          onAction={() => console.log("Start challenge clicked")}
        />
      </div>
    </ThemeProvider>
  );
}
