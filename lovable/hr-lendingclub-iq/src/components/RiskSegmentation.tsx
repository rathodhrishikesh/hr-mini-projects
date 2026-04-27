import { Card } from "@/components/ui/card";
import type { ModelResult } from "@/lib/creditModel";

const fmtMoney = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const tones: Record<string, { dot: string; chip: string }> = {
  Low: { dot: "bg-success", chip: "bg-success/10 text-success" },
  Medium: { dot: "bg-warning", chip: "bg-warning/10 text-warning" },
  High: { dot: "bg-destructive", chip: "bg-destructive/10 text-destructive" },
};

export const RiskSegmentation = ({ model }: { model: ModelResult }) => {
  const total = model.portfolioSize;
  const c = model.metrics.confusion;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="bg-gradient-card p-5 shadow-elev-sm lg:col-span-2">
        <div className="mb-4 flex items-baseline justify-between">
          <h4 className="text-sm font-semibold text-foreground">Risk Segmentation</h4>
          <span className="text-xs text-muted-foreground">Low &lt; 10% PD · Medium 10–30% · High ≥ 30%</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {model.segments.map((s) => {
            const pct = total ? (s.count / total) * 100 : 0;
            const t = tones[s.segment];
            return (
              <div key={s.segment} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-semibold ${t.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                    {s.segment} risk
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                </div>
                <div className="mt-3 font-mono text-2xl font-bold text-foreground">{s.count.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">loans in segment</div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <Row k="Avg PD" v={fmtPct(s.avgPd)} />
                  <Row k="Default rate" v={fmtPct(s.defaultRate)} />
                  <Row k="Avg EL / loan" v={fmtMoney(s.avgEl)} />
                  <Row k="Total EL" v={fmtMoney(s.totalEl)} />
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full ${t.dot}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="bg-card p-5 shadow-elev-sm">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Confusion Matrix</h4>
        <div className="grid grid-cols-3 gap-1 text-center text-xs">
          <div />
          <div className="font-medium text-muted-foreground">Pred 1</div>
          <div className="font-medium text-muted-foreground">Pred 0</div>
          <div className="flex items-center justify-end pr-2 font-medium text-muted-foreground">Actual 1</div>
          <Cell value={c.tp} label="TP" tone="primary" />
          <Cell value={c.fn} label="FN" tone="destructive" />
          <div className="flex items-center justify-end pr-2 font-medium text-muted-foreground">Actual 0</div>
          <Cell value={c.fp} label="FP" tone="warning" />
          <Cell value={c.tn} label="TN" tone="success" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <Row k="Precision" v={fmtPct(model.metrics.precision)} />
          <Row k="Recall" v={fmtPct(model.metrics.recall)} />
          <Row k="F1 score" v={model.metrics.f1.toFixed(3)} />
          <Row k="Accuracy" v={fmtPct(model.metrics.accuracy)} />
        </div>
      </Card>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-mono font-semibold text-foreground">{v}</span>
  </div>
);

const Cell = ({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "success" | "warning" | "destructive" | "primary";
}) => {
  const t: Record<string, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <div className={`rounded-lg p-3 ${t[tone]}`}>
      <div className="font-mono text-base font-bold">{value.toLocaleString()}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
};
