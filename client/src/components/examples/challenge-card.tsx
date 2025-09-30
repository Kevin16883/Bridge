import { ChallengeCard } from "../challenge-card";
import { ThemeProvider } from "../theme-provider";

export default function ChallengeCardExample() {
  return (
    <ThemeProvider>
      <div className="p-8 grid md:grid-cols-2 gap-6 max-w-4xl">
        <ChallengeCard
          title="逻辑推理挑战"
          description="通过一系列逻辑题目测试你的分析和推理能力"
          skillType="logic"
          duration="10分钟"
          difficulty="medium"
          points={50}
        />
        <ChallengeCard
          title="创意写作挑战"
          description="根据给定主题创作一段吸引人的营销文案"
          skillType="creative"
          duration="15分钟"
          difficulty="hard"
          points={80}
          completed={true}
          score={92}
        />
      </div>
    </ThemeProvider>
  );
}
