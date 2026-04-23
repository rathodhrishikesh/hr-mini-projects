import { useMemo, useState } from "react";
import { useDataStore } from "@/lib/data-store";
import { groupBy, fmtCurrency, fmtNum, fmtPct } from "@/lib/analytics";
import { ficoBand } from "@/lib/loan-types";
import { PageHeader, ChartPanel } from "@/components/PageHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const SEGMENT_OPTIONS = [
  { value: "grade", label: "Grade" },
  { value: "sub_grade", label: "Sub-grade" },
  { value: "purpose", label: "Purpose" },
  { value: "addr_state", label: "State" },
  { value: "home_ownership", label: "Home ownership" },
  { value: "term", label: "Term" },
  { value: "emp_length", label: "Employment length" },
  { value: "verification_status", label: "Verification status" },
  { value: "fico_band", label: "FICO band" },
];

export default function Segmentation() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);
  const [seg, setSeg] = useState("grade");

  const data = useMemo(() => {
    const fn = seg === "fico_band"
      ? (r: Record<string, unknown>) => ficoBand(r.fico_range_low as number)
      : (r: Record<string, unknown>) => r[seg] as string;
    const groups = groupBy(filtered, fn);
    return groups.sort((a, b) => b.count - a.count).slice(0, 25);
  }, [filtered, seg]);

  function colorForRate(rate: number) {
    if (rate < 15) return "hsl(var(--success))";
    if (rate < 25) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  }

  if (!hasData) return <EmptyState />;

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<Layers className="h-6 w-6" />}
          title="Risk Segmentation"
          description="Compare default rates and pricing across portfolio segments."
          actions={
            <Select value={seg} onValueChange={setSeg}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEGMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPanel title="Default rate by segment" description="Color-coded by risk level (green / amber / red)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-30} textAnchor="end" height={70} interval={0} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => `${v.toFixed(2)}%`}
                />
                <Bar dataKey="defaultRate" name="Default %" radius={[4, 4, 0, 0]}>
                  {data.map((d, i) => <Cell key={i} fill={colorForRate(d.defaultRate)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Average interest rate by segment">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-30} textAnchor="end" height={70} interval={0} />
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

        <ChartPanel title="Segment metrics">
          <DataTable
            data={data}
            initialSort={{ key: "count", dir: "desc" }}
            columns={[
              { key: "key", label: "Segment" },
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
