import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const KpiCard = ({ label, value, hint, icon: Icon, tone = "default" }: Props) => (
  <Card className="bg-gradient-card p-5 shadow-elev-sm transition-shadow hover:shadow-elev-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 truncate font-mono text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
      {Icon && (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  </Card>
);
