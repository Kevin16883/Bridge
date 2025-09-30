import { Button } from "@/components/ui/button";
import emptyStateImage from "@assets/generated_images/Empty_state_illustration_38c6f5a6.png";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="empty-state">
      <img 
        src={emptyStateImage} 
        alt="Empty state" 
        className="w-64 h-48 object-contain mb-8 opacity-80"
      />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
      <Button onClick={onAction} data-testid="button-empty-state-action">
        {actionLabel}
      </Button>
    </div>
  );
}
