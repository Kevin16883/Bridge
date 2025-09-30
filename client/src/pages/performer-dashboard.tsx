import { Header } from "@/components/header";
import { PotentialRadar } from "@/components/potential-radar";
import { TaskCard } from "@/components/task-card";
import { ChallengeCard } from "@/components/challenge-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp } from "lucide-react";

export default function PerformerDashboard() {
  const potentialData = [
    { skill: "逻辑推理", score: 85 },
    { skill: "创意思维", score: 92 },
    { skill: "技术能力", score: 78 },
    { skill: "沟通协作", score: 88 },
    { skill: "数据分析", score: 82 },
    { skill: "问题解决", score: 90 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">任务执行者控制台</h1>
          <p className="text-muted-foreground">完成挑战，接收任务，提升技能</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-total-points">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总积分</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">本月+320分</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-challenges">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成挑战</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">平均得分 87</p>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-completed-tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">完成任务</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">收入 ¥4,200</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <PotentialRadar data={potentialData} overall={86} />
            
            <Card className="mt-6" data-testid="card-achievements">
              <CardHeader>
                <CardTitle>成就徽章</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {["逻辑大师", "创意新星", "快速响应", "精准匹配", "品质保证", "持续学习"].map((achievement) => (
                    <div key={achievement} className="aspect-square rounded-lg bg-primary/10 flex items-center justify-center p-2 text-center">
                      <span className="text-xs font-medium text-primary">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">推荐任务</h2>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  基于你的潜力图谱
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TaskCard
                  title="小红书推广文案撰写"
                  description="为环保咖啡杯撰写吸引人的小红书推广文案"
                  skills={["creative", "communication"]}
                  estimatedTime="2-3小时"
                  budget="¥300-500"
                  matchScore={92}
                  difficulty="intermediate"
                />
                <TaskCard
                  title="数据分析报告"
                  description="分析电商平台用户行为数据，生成洞察报告"
                  skills={["logic", "technical"]}
                  estimatedTime="4-5小时"
                  budget="¥600-800"
                  matchScore={88}
                  difficulty="advanced"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">能力挑战</h2>
                <Badge variant="outline">提升你的潜力分数</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
