import { DeadlineStatus } from "@/lib/enums";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEADLINE_STATUS_LABELS } from "@/lib/deadline";

const STYLES: Record<DeadlineStatus, string> = {
  OPEN: "bg-success/10 text-success border-success/20",
  CLOSING_SOON: "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  CLOSED: "bg-muted text-muted-foreground border-border",
  UPCOMING: "bg-primary/10 text-primary border-primary/20",
  ROLLING: "bg-accent/15 text-accent-foreground border-accent/30",
  UNKNOWN: "bg-muted text-muted-foreground border-border",
};

const DOT_STYLES: Record<DeadlineStatus, string> = {
  OPEN: "fill-success text-success",
  CLOSING_SOON: "fill-destructive text-destructive",
  CLOSED: "fill-muted-foreground text-muted-foreground",
  UPCOMING: "fill-primary text-primary",
  ROLLING: "fill-accent text-accent",
  UNKNOWN: "fill-muted-foreground text-muted-foreground",
};

export function DeadlineBadge({
  status,
  daysRemaining,
  className,
}: {
  status: DeadlineStatus;
  daysRemaining?: number | null;
  className?: string;
}) {
  const label =
    status === "CLOSING_SOON" && daysRemaining != null
      ? `Closing in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
      : status === "OPEN" && daysRemaining != null
        ? `${daysRemaining} days left`
        : DEADLINE_STATUS_LABELS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      <Circle className={cn("h-1.5 w-1.5", DOT_STYLES[status])} />
      {label}
    </span>
  );
}
