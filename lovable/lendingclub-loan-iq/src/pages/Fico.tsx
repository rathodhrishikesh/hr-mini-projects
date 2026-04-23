import { useMemo } from "react";
import { useDataStore } from "@/lib/data-store";
import { groupBy, fmtNum, fmtPct, fmtCurrency } from "@/lib/analytics";
import { ficoBand, FICO_BAND_ORDER } from "@/lib/loan-types";
import { PageHeader, ChartPanel } from "@/components/PageHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const COLORS = ["hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--chart-7))", "hsl(var(--chart-2))", "hsl(var(--success))"];

export default function Fico() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);
  const columns = useDataStore((s) => s.columns);

  const data = useMemo(() => {
    const grouped = groupBy(filtered, (r) => ficoBand(r.fico_range_low as number));
    return FICO_BAND_ORDER.map((band) => grouped.find((g) => g.key === band)).filter((g): g is NonNullable<typeof g> => !!g);
  }, [filtered]);

  if (!hasData) return <EmptyState />;

  if (!columns.includes("fico_range_low")) {
    return (
      <div className="flex gap-6 animate-fade-in">
        <div className="flex-1 min-w-0 space-y-6">
          <PageHeader icon={<GraduationCap className="h-6 w-6" />} title="FICO / Credit Score Analysis" />
          <div className="panel p-12 text-center text-muted-foreground">
            <p>This dataset has no <code className="font-mono">fico_range_low</code> column — FICO analysis is unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<GraduationCap className="h-6 w-6" />}
          title="FICO / Credit Score Analysis"
          description="Risk and pricing distribution across borrower credit-quality bands."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPanel title="Default rate by FICO band" description="Lower scores typically translate to higher realized default rates.">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => `${v.toFixed(2)}%`}
                />
                <Bar dataKey="defaultRate" name="Default %" radius={[4, 4, 0, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Average interest rate by FICO band" description="Better credit should command lower rates.">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => `${v.toFixed(2)}%`}
                />
                <Bar dataKey="avgRate" name="Avg rate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <ChartPanel title="FICO band metrics">
          <DataTable
            data={data}
            columns={[
              { key: "key", label: "FICO band" },
              { key: "count", label: "Loans", numeric: true, render: (r) => fmtNum(r.count) },
              { key: "volume", label: "Volume", numeric: true, render: (r) => fmtCurrency(r.volume, true) },
              { key: "avgLoan", label: "Avg loan", numeric: true, render: (r) => fmtCurrency(r.avgLoan, true) },
              { key: "avgRate", label: "Avg rate", numeric: true, render: (r) => fmtPct(r.avgRate ?? 0, 2) },
              { key: "defaultRate", label: "Default rate", numeric: true, render: (r) => fmtPct(r.defaultRate) },
            ]}
          />
        </ChartPanel>
      </div>
      <FilterPanel />
    </div>
  );
}
