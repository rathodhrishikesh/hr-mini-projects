import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: ReactNode;
  trend?: { direction: "up" | "down"; label: string };
  accent?: "primary" | "accent" | "warning" | "destructive" | "success";
}) {
  const accentColor: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    success: "text-success bg-success/10",
  };
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-3xl font-bold font-mono tracking-tight">{value}</div>
          {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${accentColor[accent]}`}>{icon}</div>
        )}
      </div>
      {trend && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
          trend.direction === "up" ? "text-success" : "text-destructive"
        }`}>
          {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend.label}
        </div>
      )}
    </div>
  );
}
