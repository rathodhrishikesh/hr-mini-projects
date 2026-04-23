import { useMemo } from "react";
import { useDataStore } from "@/lib/data-store";
import { computeKpis, fmtCurrency, fmtNum, fmtPct, groupBy } from "@/lib/analytics";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader, ChartPanel } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilterPanel } from "@/components/FilterPanel";
import { LayoutDashboard, DollarSign, Percent, AlertTriangle, FileText, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { DataTable } from "@/components/DataTable";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))", "hsl(var(--chart-7))"];

export default function Overview() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);

  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const byGrade = useMemo(() => groupBy(filtered, (r) => r.grade as string).sort((a, b) => a.key.localeCompare(b.key)), [filtered]);
  const byPurpose = useMemo(() => groupBy(filtered, (r) => r.purpose as string).sort((a, b) => b.count - a.count).slice(0, 8), [filtered]);
  const byStatus = useMemo(() => groupBy(filtered, (r) => r.loan_status as string).sort((a, b) => b.count - a.count).slice(0, 7), [filtered]);

  if (!hasData) return <EmptyState />;

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<LayoutDashboard className="h-6 w-6" />}
          title="Portfolio Overview"
          description="High-level performance and risk metrics across the loaded loan portfolio."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Loans" value={fmtNum(kpis.count)} icon={<FileText className="h-4 w-4" />} accent="primary" />
          <KpiCard label="Total Volume" value={fmtCurrency(kpis.totalVolume, true)} icon={<DollarSign className="h-4 w-4" />} accent="accent" />
          <KpiCard label="Avg Loan" value={fmtCurrency(kpis.avgLoan, true)} icon={<Users className="h-4 w-4" />} accent="primary" />
          <KpiCard label="Avg Rate" value={fmtPct(kpis.avgRate ?? 0, 2)} icon={<Percent className="h-4 w-4" />} accent="accent" />
          <KpiCard label="Default Rate" value={fmtPct(kpis.defaultRate)} icon={<AlertTriangle className="h-4 w-4" />} accent={kpis.defaultRate > 25 ? "destructive" : kpis.defaultRate > 15 ? "warning" : "success"} sublabel="of closed loans" />
          <KpiCard label="Interest Earned" value={fmtCurrency(kpis.totalInterest, true)} icon={<TrendingUp className="h-4 w-4" />} accent="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPanel title="Loans by grade" description="Volume and default rate per credit grade">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byGrade}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number, n: string) => n === "Default %" ? `${v.toFixed(2)}%` : v.toLocaleString()}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="count" name="Loans" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="defaultRate" name="Default %" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Status mix" description="Distribution of loan outcomes">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="key" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => v.toLocaleString()}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <ChartPanel title="Top purposes" description="Most common loan purposes in your portfolio">
          <DataTable
            data={byPurpose}
            columns={[
              { key: "key", label: "Purpose" },
              { key: "count", label: "Loans", numeric: true, render: (r) => fmtNum(r.count) },
              { key: "volume", label: "Volume", numeric: true, render: (r) => fmtCurrency(r.volume, true) },
              { key: "avgLoan", label: "Avg loan", numeric: true, render: (r) => fmtCurrency(r.avgLoan, true) },
              { key: "avgRate", label: "Avg rate", numeric: true, render: (r) => fmtPct(r.avgRate ?? 0, 2) },
              { key: "defaultRate", label: "Default %", numeric: true, render: (r) => fmtPct(r.defaultRate) },
            ]}
          />
        </ChartPanel>
      </div>
      <FilterPanel />
    </div>
  );
}
