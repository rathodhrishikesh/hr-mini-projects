import { useMemo } from "react";
import { useDataStore } from "@/lib/data-store";
import { parseIssueYear, fmtNum, fmtPct } from "@/lib/analytics";
import { isClosed, isDefault } from "@/lib/loan-types";
import { PageHeader, ChartPanel } from "@/components/PageHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Bar, ComposedChart } from "recharts";

export default function Trends() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);

  const series = useMemo(() => {
    const map = new Map<number, { year: number; count: number; closed: number; defaults: number }>();
    for (const r of filtered) {
      const y = parseIssueYear(r.issue_d as string);
      if (y == null) continue;
      let agg = map.get(y);
      if (!agg) { agg = { year: y, count: 0, closed: 0, defaults: 0 }; map.set(y, agg); }
      agg.count++;
      const s = r.loan_status as string;
      if (isClosed(s)) agg.closed++;
      if (isDefault(s)) agg.defaults++;
    }
    return Array.from(map.values())
      .sort((a, b) => a.year - b.year)
      .map((d) => ({
        ...d,
        defaultRate: d.closed ? (d.defaults / d.closed) * 100 : 0,
      }));
  }, [filtered]);

  if (!hasData) return <EmptyState />;

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<TrendingDown className="h-6 w-6" />}
          title="Default Rate Over Time"
          description="Vintage analysis of default performance by loan origination year."
        />

        <ChartPanel title="Defaults by issue year" description="Closed-loan default rate (line) and origination count (bars)">
          {series.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No issue dates available in the dataset.</p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number, n: string) => n === "Default rate" ? `${v.toFixed(2)}%` : v.toLocaleString()}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="count" name="Loans issued" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="defaultRate" name="Default rate" stroke="hsl(var(--chart-5))" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Yearly breakdown" description="Underlying figures for each origination year">
          <DataTable
            data={series}
            initialSort={{ key: "year", dir: "desc" }}
            columns={[
              { key: "year", label: "Year", numeric: true },
              { key: "count", label: "Loans", numeric: true, render: (r) => fmtNum(r.count) },
              { key: "closed", label: "Closed", numeric: true, render: (r) => fmtNum(r.closed) },
              { key: "defaults", label: "Defaults", numeric: true, render: (r) => fmtNum(r.defaults) },
              { key: "defaultRate", label: "Default rate", numeric: true, render: (r) => fmtPct(r.defaultRate) },
            ]}
          />
        </ChartPanel>
      </div>
      <FilterPanel />
    </div>
  );
}
