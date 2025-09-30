import { DemandInput } from "../demand-input";
import { ThemeProvider } from "../theme-provider";

export default function DemandInputExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-3xl">
        <DemandInput />
      </div>
    </ThemeProvider>
  );
}
