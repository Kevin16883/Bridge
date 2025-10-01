import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
      data-testid="button-language-toggle"
      className="font-medium"
    >
      {language === "zh" ? "EN" : "中文"}
    </Button>
  );
}
