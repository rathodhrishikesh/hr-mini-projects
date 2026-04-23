import { useMemo } from "react";
import { useDataStore } from "@/lib/data-store";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency, fmtPct } from "@/lib/analytics";
import { Filter, RotateCcw } from "lucide-react";

function MultiToggleList({
  options, selected, onChange, label,
}: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; label: string;
}) {
  if (!options.length) return null;
  function toggle(v: string) {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {selected.length > 0 && (
          <button onClick={() => onChange([])} className="text-[10px] text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterPanel() {
  const filters = useDataStore((s) => s.filters);
  const bounds = useDataStore((s) => s.bounds);
  const setFilters = useDataStore((s) => s.setFilters);
  const reset = useDataStore((s) => s.resetFilters);
  const totalRows = useDataStore((s) => s.rows.length);
  const filteredFn = useDataStore((s) => s.filtered);
  const rowsRef = useDataStore((s) => s.rows);
  const filteredCount = useMemo(
    () => (rowsRef.length ? filteredFn().length : 0),
    [rowsRef, filters, filteredFn]
  );

  const activeCount = useMemo(() => {
    if (!bounds) return 0;
    let n = 0;
    if (filters.status !== "all") n++;
    if (filters.grades.length) n++;
    if (filters.purposes.length) n++;
    if (filters.states.length) n++;
    if (filters.loanAmount && (filters.loanAmount[0] !== bounds.loanMin || filters.loanAmount[1] !== bounds.loanMax)) n++;
    if (filters.intRate && (filters.intRate[0] !== bounds.rateMin || filters.intRate[1] !== bounds.rateMax)) n++;
    return n;
  }, [filters, bounds]);

  if (!bounds) return null;

  return (
    <aside className="panel sticky top-4 h-fit w-72 shrink-0 p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-semibold">Filters</span>
          {activeCount > 0 && <Badge variant="secondary" className="ml-1">{activeCount}</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>

      <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Showing </span>
        <span className="font-mono font-semibold text-primary">{filteredCount.toLocaleString()}</span>
        <span className="text-muted-foreground"> of {totalRows.toLocaleString()}</span>
      </div>

      {filters.loanAmount && bounds.loanMax > bounds.loanMin && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Loan amount</span>
          </div>
          <Slider
            min={bounds.loanMin}
            max={bounds.loanMax}
            step={Math.max(100, Math.round((bounds.loanMax - bounds.loanMin) / 100))}
            value={[
              Math.max(bounds.loanMin, Math.min(bounds.loanMax, filters.loanAmount[0])),
              Math.max(bounds.loanMin, Math.min(bounds.loanMax, filters.loanAmount[1])),
            ]}
            onValueChange={(v) => {
              const cur = filters.loanAmount!;
              if (v[0] === cur[0] && v[1] === cur[1]) return;
              setFilters({ loanAmount: [v[0], v[1]] });
            }}
          />
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{fmtCurrency(filters.loanAmount[0], true)}</span>
            <span>{fmtCurrency(filters.loanAmount[1], true)}</span>
          </div>
        </div>
      )}

      {filters.intRate && bounds.rateMax > bounds.rateMin && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest rate</span>
          </div>
          <Slider
            min={bounds.rateMin}
            max={bounds.rateMax}
            step={0.5}
            value={[
              Math.max(bounds.rateMin, Math.min(bounds.rateMax, filters.intRate[0])),
              Math.max(bounds.rateMin, Math.min(bounds.rateMax, filters.intRate[1])),
            ]}
            onValueChange={(v) => {
              const cur = filters.intRate!;
              if (v[0] === cur[0] && v[1] === cur[1]) return;
              setFilters({ intRate: [v[0], v[1]] });
            }}
          />
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{fmtPct(filters.intRate[0], 1)}</span>
            <span>{fmtPct(filters.intRate[1], 1)}</span>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Loan status</div>
        <Select value={filters.status} onValueChange={(v) => setFilters({ status: v as "all" | "default" | "current" | "paid" })}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All loans</SelectItem>
            <SelectItem value="current">Current only</SelectItem>
            <SelectItem value="paid">Fully paid</SelectItem>
            <SelectItem value="default">Defaulted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MultiToggleList label="Grade" options={bounds.grades} selected={filters.grades} onChange={(v) => setFilters({ grades: v })} />
      <MultiToggleList label="Purpose" options={bounds.purposes.slice(0, 20)} selected={filters.purposes} onChange={(v) => setFilters({ purposes: v })} />
      <MultiToggleList label="State" options={bounds.states} selected={filters.states} onChange={(v) => setFilters({ states: v })} />
    </aside>
  );
}
