import { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  textVisible?: boolean;
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  P0: { color: "bg-red-500", label: "Urgent" },
  P1: { color: "bg-orange-500", label: "High" },
  P2: { color: "bg-blue-500", label: "Medium" },
  P3: { color: "bg-gray-500", label: "Low" },
};

export function PriorityBadge({ priority, className, textVisible = false }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  if (!config) return null;

  if (textVisible) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
            <span className="text-sm text-foreground">{config.label}</span>
        </div>
    )
  }

  return (
    <div
      className={cn("w-2.5 h-2.5 rounded-full", config.color, className)}
      title={config.label}
    />
  );
}
