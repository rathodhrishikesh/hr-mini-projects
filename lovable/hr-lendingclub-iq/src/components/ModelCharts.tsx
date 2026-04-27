import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ReferenceLine, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";
import type { ModelResult } from "@/lib/creditModel";

const axis = "hsl(var(--muted-foreground))";
const grid = "hsl(var(--border))";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "var(--shadow-md)",
};

interface Props { model: ModelResult; }

export const ModelCharts = ({ model }: Props) => {
  const rocData = model.rocCurve;
  const calData = model.calibration.filter((c) => c.count > 0);
  const histData = model.pdHistogram;
  const fi = model.featureImportance;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="ROC Curve" subtitle={`AUC = ${model.metrics.auc.toFixed(3)}`}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rocData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="fpr" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} stroke={axis} fontSize={11} />
            <YAxis dataKey="tpr" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} stroke={axis} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(3)} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke={grid} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="tpr" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Calibration" subtitle="Predicted vs actual default rate per decile">
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="predicted" name="Predicted" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke={axis} fontSize={11} />
            <YAxis type="number" dataKey="actual" name="Actual" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke={axis} fontSize={11} />
            <ZAxis type="number" dataKey="count" range={[40, 280]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v * 100).toFixed(1)}%`} cursor={{ strokeDasharray: "3 3" }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke={grid} strokeDasharray="4 4" />
            <Scatter data={calData} fill="hsl(var(--chart-2))" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="PD Distribution"
        subtitle="Histogram of predicted Probability of Default — colored by risk tier"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={histData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bin" stroke={axis} fontSize={10} interval={1} />
            <YAxis stroke={axis} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histData.map((d, i) => {
                // Parse the lower bound of the bin (e.g., "10–15%" -> 10)
                const lo = parseFloat(d.bin.split("–")[0]);
                const color =
                  lo < 10
                    ? "hsl(var(--success))"
                    : lo < 30
                    ? "hsl(var(--warning))"
                    : "hsl(var(--destructive))";
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <LegendDot color="hsl(var(--success))" label="Low (< 10%)" />
          <LegendDot color="hsl(var(--warning))" label="Medium (10–30%)" />
          <LegendDot color="hsl(var(--destructive))" label="High (≥ 30%)" />
        </div>
      </ChartCard>

      <ChartCard title="Top Risk Drivers" subtitle="Standardized logistic regression coefficients">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fi} layout="vertical" margin={{ top: 5, right: 16, left: 90, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke={axis} fontSize={11} />
            <YAxis type="category" dataKey="feature" stroke={axis} fontSize={11} width={150} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(3)} />
            <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
              {fi.map((d, i) => (
                <Cell key={i} fill={d.weight >= 0 ? "hsl(var(--chart-5))" : "hsl(var(--chart-3))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
    {label}
  </span>
);

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <Card className="bg-card p-5 shadow-elev-sm">
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </Card>
);
