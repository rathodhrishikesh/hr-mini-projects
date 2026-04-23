import { useMemo } from "react";
import { useDataStore } from "@/lib/data-store";
import { computeKpis, fmtCurrency, fmtNum, fmtPct } from "@/lib/analytics";
import { PageHeader } from "@/components/PageHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { AlertTriangle, FileText, DollarSign, Percent } from "lucide-react";

function riskLevel(rate: number): { label: string; tone: string; bg: string } {
  if (rate < 15) return { label: "Low risk", tone: "text-success", bg: "bg-success/10 border-success/30" };
  if (rate < 25) return { label: "Medium risk", tone: "text-warning", bg: "bg-warning/10 border-warning/30" };
  return { label: "High risk", tone: "text-destructive", bg: "bg-destructive/10 border-destructive/30" };
}

export default function Finder() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);
  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const risk = riskLevel(kpis.defaultRate);

  if (!hasData) return <EmptyState />;

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<AlertTriangle className="h-6 w-6" />}
          title="High-Risk Segment Finder"
          description="Combine the global filters at right to define any segment, then read its risk profile here."
        />

        <div className={`panel p-6 border-2 ${risk.bg}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Segment classification</div>
              <div className={`text-4xl font-bold font-mono ${risk.tone}`}>{risk.label}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Default rate {fmtPct(kpis.defaultRate)} across {fmtNum(kpis.count)} loans
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${risk.tone.replace("text-", "bg-")} animate-pulse-glow`} />
              <div className="text-xs text-muted-foreground max-w-xs">
                <strong>Bands:</strong> &lt;15% Low · 15–25% Medium · &gt;25% High
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Loan count" value={fmtNum(kpis.count)} icon={<FileText className="h-4 w-4" />} />
          <KpiCard label="Default rate" value={fmtPct(kpis.defaultRate)} icon={<AlertTriangle className="h-4 w-4" />} accent={kpis.defaultRate > 25 ? "destructive" : kpis.defaultRate > 15 ? "warning" : "success"} />
          <KpiCard label="Avg loan size" value={fmtCurrency(kpis.avgLoan, true)} icon={<DollarSign className="h-4 w-4" />} accent="accent" />
          <KpiCard label="Avg interest rate" value={fmtPct(kpis.avgRate ?? 0, 2)} icon={<Percent className="h-4 w-4" />} accent="accent" />
        </div>

        <div className="panel p-5 text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Use the filter panel to drill into specific grades, purposes, states,
          loan-amount ranges and interest-rate bands. Risk classification updates instantly. Combine filters such as{" "}
          <em>Grade E + low FICO + small loan amount</em> to surface concentrated risk pockets.
        </div>
      </div>
      <FilterPanel />
    </div>
  );
}
