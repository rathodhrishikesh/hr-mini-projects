import { Card } from "@/components/ui/card";
import type { Row, DatasetSummary } from "@/lib/creditModel";

interface Props {
  rows: Row[];
  summary: DatasetSummary;
}

export const DatasetPreview = ({ rows, summary }: Props) => {
  const previewCols = summary.columns.slice(0, 12);
  const previewRows = rows.slice(0, 8);

  return (
    <Card className="overflow-hidden bg-card shadow-elev-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Dataset Preview</h3>
          <p className="text-xs text-muted-foreground">
            Showing first 8 rows × {previewCols.length} of {summary.columns.length} columns
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary/60 text-left">
            <tr>
              {previewCols.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold text-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r, i) => (
              <tr key={i} className="border-t border-border/60 hover:bg-secondary/40">
                {previewCols.map((c) => (
                  <td key={c} className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">
                    {r[c] === null || r[c] === undefined || r[c] === "" ? (
                      <span className="text-muted-foreground/50 italic">—</span>
                    ) : (
                      String(r[c]).slice(0, 28)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
