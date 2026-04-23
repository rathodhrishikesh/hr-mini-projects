import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  numeric?: boolean;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
};

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  initialSort,
}: {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => String(c.key) === sort.key);
    if (!col) return data;
    const getter = col.sortValue ?? ((r: T) => r[col.key as keyof T] as number | string);
    return [...data].sort((a, b) => {
      const va = getter(a); const vb = getter(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
      const sa = String(va); const sb = String(vb);
      return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(key: string) {
    setSort((curr) => {
      if (!curr || curr.key !== key) return { key, dir: "desc" };
      if (curr.dir === "desc") return { key, dir: "asc" };
      return null;
    });
    setPage(0);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => {
                const isSorted = sort?.key === String(c.key);
                return (
                  <th
                    key={String(c.key)}
                    className={`px-3 py-2.5 font-medium select-none cursor-pointer hover:text-foreground ${c.numeric ? "text-right" : "text-left"}`}
                    onClick={() => toggleSort(String(c.key))}
                  >
                    <span className={`inline-flex items-center gap-1 ${c.numeric ? "flex-row-reverse" : ""}`}>
                      {c.label}
                      {isSorted && (sort!.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-3 py-2 ${c.numeric ? "text-right font-mono tabular-nums" : ""}`}>
                    {c.render ? c.render(row) : (row[c.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Page {safePage + 1} of {pageCount} · {sorted.length.toLocaleString()} rows</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded border border-border/60 px-2 py-1 hover:bg-secondary disabled:opacity-40"
            >Prev</button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded border border-border/60 px-2 py-1 hover:bg-secondary disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
