import { useMemo, useState } from "react";
import { useDataStore } from "@/lib/data-store";
import { groupBy, fmtCurrency, fmtNum, fmtPct } from "@/lib/analytics";
import { PageHeader, ChartPanel } from "@/components/PageHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))","hsl(var(--chart-6))","hsl(var(--chart-7))"];

export default function Pricing() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);
  const [colorBy, setColorBy] = useState<"grade" | "purpose">("grade");

  // Each bubble = a unique combination of grade × colorBy aggregation
  const bubbles = useMemo(() => {
    const groups = groupBy(filtered, (r) => {
      const g = r.grade as string;
      const c = r[colorBy] as string;
      return g && c ? `${g}|${c}` : null;
    });
    return groups
      .filter((g) => g.avgRate != null && g.count >= 5)
      .map((g) => {
        const [grade, color] = g.key.split("|");
        return {
          grade,
          color,
          x: g.avgRate as number,
          y: g.defaultRate,
          z: g.count,
          count: g.count,
          avgLoan: g.avgLoan,
        };
      });
  }, [filtered, colorBy]);

  const colorKeys = useMemo(() => {
    return Array.from(new Set(bubbles.map((b) => b.color))).sort();
  }, [bubbles]);

  if (!hasData) return <EmptyState />;

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<DollarSign className="h-6 w-6" />}
          title="Pricing vs Risk"
          description="Does interest pricing align with realized default risk? Each bubble = a segment, sized by loan count."
          actions={
            <Select value={colorBy} onValueChange={(v) => setColorBy(v as "grade" | "purpose")}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grade">Color by grade</SelectItem>
                <SelectItem value="purpose">Color by purpose</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <ChartPanel title="Risk vs price scatter" description="A well-priced book trends diagonally from low-rate/low-default to high-rate/high-default.">
          <ResponsiveContainer width="100%" height={460}>
            <ScatterChart margin={{ top: 20, right: 24, bottom: 40, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number" dataKey="x" name="Avg interest rate" unit="%"
                stroke="hsl(var(--muted-foreground))" fontSize={12}
                label={{ value: "Average interest rate (%)", position: "insideBottom", offset: -10, fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="number" dataKey="y" name="Default rate" unit="%"
                stroke="hsl(var(--muted-foreground))" fontSize={12}
                label={{ value: "Default rate (%)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <ZAxis type="number" dataKey="z" range={[40, 800]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number, n: string) => {
                  if (n === "Avg interest rate" || n === "Default rate") return `${v.toFixed(2)}%`;
                  return v.toLocaleString();
                }}
                labelFormatter={() => ""}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {colorKeys.map((ck, i) => (
                <Scatter
                  key={ck}
                  name={ck}
                  data={bubbles.filter((b) => b.color === ck)}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.7}
                >
                  {bubbles.filter((b) => b.color === ck).map((_, j) => <Cell key={j} fill={COLORS[i % COLORS.length]} />)}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="panel p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Segments plotted</div>
            <div className="text-2xl font-bold font-mono">{fmtNum(bubbles.length)}</div>
          </div>
          <div className="panel p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Avg pricing</div>
            <div className="text-2xl font-bold font-mono">
              {bubbles.length ? fmtPct(bubbles.reduce((a, b) => a + b.x * b.count, 0) / bubbles.reduce((a, b) => a + b.count, 0), 2) : "—"}
            </div>
          </div>
          <div className="panel p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Largest bubble</div>
            <div className="text-2xl font-bold font-mono">
              {bubbles.length ? fmtCurrency(Math.max(...bubbles.map((b) => b.avgLoan ?? 0)), true) : "—"}
            </div>
          </div>
        </div>
      </div>
      <FilterPanel />
    </div>
  );
}
