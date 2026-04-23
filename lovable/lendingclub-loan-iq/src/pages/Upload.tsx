import { useDataStore } from "@/lib/data-store";
import { CsvUpload } from "@/components/CsvUpload";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Upload as UploadIcon } from "lucide-react";

export default function Upload() {
  const rows = useDataStore((s) => s.rows);
  const columns = useDataStore((s) => s.columns);
  const fileName = useDataStore((s) => s.fileName);

  const previewCols = columns.slice(0, 12);
  const preview = rows.slice(0, 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        icon={<UploadIcon className="h-6 w-6" />}
        title="Upload Dataset"
        description="Import a LendingClub-style loan CSV. Files are parsed entirely in your browser — no data leaves the device."
      />

      <CsvUpload />

      {rows.length > 0 && (
        <section className="panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Preview · {fileName}</h3>
              <p className="text-xs text-muted-foreground">
                {rows.length.toLocaleString()} rows · {columns.length} columns · showing first 100 rows × {previewCols.length} columns
              </p>
            </div>
          </div>
          <DataTable
            data={preview as unknown as Record<string, unknown>[]}
            pageSize={20}
            columns={previewCols.map((c) => ({
              key: c,
              label: c,
              render: (r) => {
                const v = (r as Record<string, unknown>)[c];
                if (v == null) return <span className="text-muted-foreground/40">—</span>;
                if (typeof v === "number") return v.toLocaleString();
                return String(v);
              },
            }))}
          />
        </section>
      )}
    </div>
  );
}
