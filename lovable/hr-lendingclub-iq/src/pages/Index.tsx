import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Activity, Database, Gauge, Layers, ShieldAlert, TrendingDown, Wallet, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CsvUpload } from "@/components/CsvUpload";
import { DatasetPreview } from "@/components/DatasetPreview";
import { KpiCard } from "@/components/KpiCard";
import { ModelCharts } from "@/components/ModelCharts";
import { RiskSegmentation } from "@/components/RiskSegmentation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trainAndScore, summarize, type Row, type ModelResult, type DatasetSummary } from "@/lib/creditModel";

const fmtMoney = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(1)}K`
        : `$${n.toFixed(0)}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const Index = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [model, setModel] = useState<ModelResult | null>(null);
  const [training, setTraining] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!rows || !summary) return;
    setTraining(true);
    toast.loading("Training logistic regression…", { id: "train" });
    // defer to next tick so spinner paints
    const id = setTimeout(() => {
      try {
        const result = trainAndScore(rows);
        setModel(result);
        toast.success(`Model trained — AUC ${result.metrics.auc.toFixed(3)}`, { id: "train" });
      } catch (e) {
        console.error(e);
        toast.error("Training failed. Check that the CSV has a 'loan_status' column.", { id: "train" });
      } finally {
        setTraining(false);
      }
    }, 80);
    return () => clearTimeout(id);
  }, [rows, summary]);

  const onLoaded = (r: Row[], total: number, name: string) => {
    setFileName(name);
    const s = summarize(r, total);
    if (!s.columns.includes("loan_status")) {
      toast.error("CSV is missing the required 'loan_status' column.");
      return;
    }
    setRows(r);
    setSummary(s);
    setModel(null);
    toast.success(`Loaded ${total.toLocaleString()} rows · sampled ${r.length.toLocaleString()}`);
  };

  const reset = () => {
    setRows(null);
    setSummary(null);
    setModel(null);
    setFileName(null);
  };

  const totalLoanVolume = useMemo(() => model?.predictions.reduce((a, b) => a + b.loanAmnt, 0) ?? 0, [model]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AppHeader />

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-card">
        <div className="container py-12">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Credit Risk Strategy · Probability of Default · Expected Loss
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Underwrite smarter with{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">LendingClubIQ</span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground md:text-lg">
                Upload a personal-loan portfolio and instantly see PD scores, expected loss, risk segmentation and model
                diagnostics.
              </p>
            </div>
            <div className="flex gap-2">
              {model && (
                <Button variant="outline" onClick={reset}>
                  Upload new file
                </Button>
              )}
              <Button asChild>
                <a href="#upload">
                  <Database className="mr-2 h-4 w-4" />
                  {model ? "Back to data" : "Get started"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container space-y-10 py-10">
        {/* Upload */}
        <section id="upload" className="space-y-3">
          <SectionHeader step={1} title="Upload Loan Dataset" subtitle="Expected LendingClub-format CSV" />
          <CsvUpload onLoaded={onLoaded} busy={training} />
        </section>

        {/* Preview + summary */}
        {summary && rows && (
          <section id="preview" className="space-y-5">
            <SectionHeader step={2} title="Dataset Overview" subtitle={fileName ? `Source: ${fileName}` : undefined} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total Rows"
                value={summary.totalRows.toLocaleString()}
                icon={Database}
                tone="primary"
                hint={`${summary.sampledRows.toLocaleString()} sampled for modeling`}
              />
              <KpiCard label="Columns" value={String(summary.columns.length)} icon={Layers} hint="Features detected" />
              <KpiCard
                label="Default rate (sample)"
                value={fmtPct(summary.defaultRate)}
                icon={ShieldAlert}
                tone="destructive"
                hint={`${summary.positives.toLocaleString()} defaults / ${summary.negatives.toLocaleString()} repaid`}
              />
              <KpiCard
                label="Missing cells"
                value={Object.values(summary.missingByColumn)
                  .reduce((a, b) => a + b, 0)
                  .toLocaleString()}
                icon={Gauge}
                tone="warning"
                hint="Imputed with column median"
              />
            </div>
            <DatasetPreview rows={rows} summary={summary} />
          </section>
        )}

        {/* Model results */}
        {model && (
          <>
            <section id="model" className="space-y-5">
              <SectionHeader
                step={3}
                title="Model Performance"
                subtitle="Logistic Regression · class-balanced · L2-regularized · standardized features"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="AUC-ROC"
                  value={model.metrics.auc.toFixed(3)}
                  icon={Activity}
                  tone="primary"
                  hint="Discrimination quality"
                />
                <KpiCard
                  label="Precision"
                  value={fmtPct(model.metrics.precision)}
                  icon={Gauge}
                  hint={`@ threshold ${model.metrics.threshold.toFixed(2)}`}
                />
                <KpiCard
                  label="Recall"
                  value={fmtPct(model.metrics.recall)}
                  icon={ShieldAlert}
                  tone="warning"
                  hint="Defaults captured"
                />
                <KpiCard label="F1 score" value={model.metrics.f1.toFixed(3)} icon={TrendingDown} tone="success" />
              </div>
              <ModelCharts model={model} />
            </section>

            <section id="insights" className="space-y-5">
              <SectionHeader
                step={4}
                title="Portfolio Insights"
                subtitle="Expected Loss = PD × LGD × EAD   (LGD = 0.6, EAD = loan_amnt)"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Portfolio Size"
                  value={model.portfolioSize.toLocaleString()}
                  icon={Layers}
                  tone="primary"
                />
                <KpiCard label="Total Exposure" value={fmtMoney(totalLoanVolume)} icon={Wallet} hint="Σ loan_amnt" />
                <KpiCard
                  label="Total Expected Loss"
                  value={fmtMoney(model.totalExpectedLoss)}
                  icon={TrendingDown}
                  tone="destructive"
                  hint={`${fmtPct(model.totalExpectedLoss / Math.max(1, totalLoanVolume))} of exposure`}
                />
                <KpiCard
                  label="Avg PD"
                  value={fmtPct(model.predictions.reduce((a, b) => a + b.pd, 0) / model.portfolioSize)}
                  icon={ShieldAlert}
                  tone="warning"
                />
              </div>
              <RiskSegmentation model={model} />
            </section>
          </>
        )}

        {!summary && (
          <section className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={Database}
              title="Smart preprocessing"
              body="Term, employment length, interest rate, and categorical fields are parsed and one-hot encoded automatically. Missing numerics are median-imputed."
            />
            <FeatureCard
              icon={Activity}
              title="Logistic regression"
              body="Class-balanced LR with L2 regularization, trained in-browser via gradient descent on a stratified sample for 500k-row CSVs."
            />
            <FeatureCard
              icon={ShieldAlert}
              title="Expected Loss"
              body="EL = PD × LGD × EAD with LGD = 0.6 and EAD = loan_amnt. Loans bucketed into Low / Medium / High risk for portfolio review."
            />
          </section>
        )}
      </main>

      <footer className="border-t border-border/60 bg-card">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground md:flex-row">
          <div>© LendingClubIQ — Credit Risk Strategy demo. Not financial advice.</div>
          <div className="flex flex-col items-center gap-0.5 md:items-end">
            <div>
              <span className="text-muted-foreground">Made by: </span>
              <span className="font-semibold text-foreground">Hrishikesh Rathod</span>
            </div>
            <a
              href="mailto:rathodhrishikesh.career@gmail.com"
              className="transition-colors hover:text-primary"
            >
              rathodhrishikesh.career@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SectionHeader = ({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-elev-sm">
      {step}
    </div>
    <div>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, body }: { icon: any; title: string; body: string }) => (
  <Card className="bg-gradient-card p-5 shadow-elev-sm">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
  </Card>
);

export default Index;
