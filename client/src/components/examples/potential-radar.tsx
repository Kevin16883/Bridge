import { PotentialRadar } from "../potential-radar";
import { ThemeProvider } from "../theme-provider";

export default function PotentialRadarExample() {
  const mockData = [
    { skill: "逻辑推理", score: 85 },
    { skill: "创意思维", score: 92 },
    { skill: "技术能力", score: 78 },
    { skill: "沟通协作", score: 88 },
    { skill: "数据分析", score: 82 },
    { skill: "问题解决", score: 90 },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 max-w-2xl">
        <PotentialRadar data={mockData} overall={86} />
      </div>
    </ThemeProvider>
  );
}
