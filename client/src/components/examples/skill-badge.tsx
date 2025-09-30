import { SkillBadge } from "../skill-badge";
import { ThemeProvider } from "../theme-provider";

export default function SkillBadgeExample() {
  return (
    <ThemeProvider>
      <div className="p-8 flex flex-wrap gap-3">
        <SkillBadge type="logic" score={85} />
        <SkillBadge type="creative" score={92} />
        <SkillBadge type="technical" score={78} />
        <SkillBadge type="communication" score={88} />
      </div>
    </ThemeProvider>
  );
}
