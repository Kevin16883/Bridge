import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export function DemandInput() {
  const [demand, setDemand] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    console.log("Analyzing demand:", demand);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      console.log("Analysis complete");
    }, 2000);
  };

  return (
    <Card data-testid="card-demand-input">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          描述你的需求
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="例如：我想为我的新款环保咖啡杯做一波小红书推广..."
          value={demand}
          onChange={(e) => setDemand(e.target.value)}
          className="min-h-[120px] text-base resize-none"
          data-testid="input-demand"
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            用自然语言描述，AI会帮你拆解成具体任务
          </p>
          <Button 
            onClick={handleAnalyze}
            disabled={!demand.trim() || isAnalyzing}
            data-testid="button-analyze-demand"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI解析
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
