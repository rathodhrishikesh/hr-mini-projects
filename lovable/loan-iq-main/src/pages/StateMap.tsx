import { useMemo } from "react";
import { useDataStore } from "@/lib/data-store";
import { groupBy, fmtNum, fmtPct } from "@/lib/analytics";
import { PageHeader, ChartPanel } from "@/components/PageHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { Map as MapIcon } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useState } from "react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS code → 2-letter state postal abbreviation
const FIPS_TO_STATE: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC",
  "12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY",
  "22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT",
  "31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH",
  "40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT",
  "50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
};

export default function StateMap() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);
  const columns = useDataStore((s) => s.columns);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const byState = useMemo(() => {
    const groups = groupBy(filtered, (r) => r.addr_state as string);
    return groups;
  }, [filtered]);

  const stateMap = useMemo(() => new Map(byState.map((g) => [g.key, g])), [byState]);

  const maxRate = useMemo(() => {
    const rates = byState.filter((g) => g.count >= 5).map((g) => g.defaultRate);
    return rates.length ? Math.max(...rates) : 30;
  }, [byState]);

  const colorScale = useMemo(
    () => scaleLinear<string>().domain([0, maxRate / 2, maxRate]).range(["hsl(152 70% 30%)", "hsl(38 95% 50%)", "hsl(0 78% 55%)"]),
    [maxRate]
  );

  if (!hasData) return <EmptyState />;

  if (!columns.includes("addr_state")) {
    return (
      <div className="flex gap-6 animate-fade-in">
        <div className="flex-1 min-w-0 space-y-6">
          <PageHeader icon={<MapIcon className="h-6 w-6" />} title="State Risk Map" />
          <div className="panel p-12 text-center text-muted-foreground">
            <MapIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>This dataset has no <code className="font-mono">addr_state</code> column — the geographic view is unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        <PageHeader
          icon={<MapIcon className="h-6 w-6" />}
          title="State Risk Map"
          description="Geographic distribution of default risk across the United States."
        />

        <ChartPanel
          title="Default rate by state"
          description="Color intensity indicates default rate. Hover a state for details."
        >
          <div className="relative">
            <ComposableMap projection="geoAlbersUsa" width={980} height={520} style={{ width: "100%", height: "auto" }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const fips = String(geo.id).padStart(2, "0");
                    const code = FIPS_TO_STATE[fips];
                    const stat = code ? stateMap.get(code) : undefined;
                    const fill = stat && stat.count >= 1 ? colorScale(stat.defaultRate) : "hsl(var(--muted))";
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="hsl(var(--background))"
                        strokeWidth={0.6}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "hsl(var(--primary))", cursor: "pointer" },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e) => {
                          if (!code) return;
                          const c = stat
                            ? `${code} · ${fmtNum(stat.count)} loans · ${fmtPct(stat.defaultRate)} default`
                            : `${code} · no data`;
                          setTooltip({ x: e.clientX, y: e.clientY, content: c });
                        }}
                        onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
            {tooltip && (
              <div
                className="pointer-events-none fixed z-50 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium shadow-lg"
                style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
              >
                {tooltip.content}
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="h-2 flex-1 rounded-full" style={{ background: "linear-gradient(to right, hsl(152 70% 30%), hsl(38 95% 50%), hsl(0 78% 55%))" }} />
              <span>High ({maxRate.toFixed(0)}%)</span>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="State-level metrics">
          <DataTable
            data={byState}
            initialSort={{ key: "defaultRate", dir: "desc" }}
            columns={[
              { key: "key", label: "State" },
              { key: "count", label: "Loans", numeric: true, render: (r) => fmtNum(r.count) },
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
