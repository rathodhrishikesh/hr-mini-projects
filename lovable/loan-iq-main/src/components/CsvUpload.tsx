import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { parseCsv } from "@/lib/csv-parser";
import { useDataStore } from "@/lib/data-store";
import { Button } from "@/components/ui/button";
import { fmtNum } from "@/lib/analytics";
import { toast } from "sonner";

export function CsvUpload({ compact = false }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setData = useDataStore((s) => s.setData);
  const clearData = useDataStore((s) => s.clearData);
  const fileName = useDataStore((s) => s.fileName);
  const rowCount = useDataStore((s) => s.rows.length);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setLoading(true);
    setProgress(0);
    try {
      const result = await parseCsv(file, (n) => setProgress(n));
      if (!result.rows.length) {
        toast.error("No rows found in CSV");
        return;
      }
      setData(result.rows, result.columns, file.name);
      if (result.truncated) {
        toast.warning(
          `Loaded first ${result.rows.length.toLocaleString()} of ${result.totalScanned.toLocaleString()}+ rows`,
          {
            description: `File exceeds the ${result.rowLimit.toLocaleString()}-row in-browser limit. Analytics reflect the loaded subset.`,
            duration: 8000,
          }
        );
      } else if (result.missingRecommended.length) {
        toast.warning(`Missing recommended columns: ${result.missingRecommended.join(", ")}`, {
          description: "Some pages may be limited.",
        });
      } else {
        toast.success(`Loaded ${result.rows.length.toLocaleString()} loans from ${file.name}`);
      }
    } catch (err) {
      toast.error("Failed to parse CSV", { description: String(err) });
    } finally {
      setLoading(false);
    }
  }

  if (compact && fileName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-sm">
        <FileText className="h-4 w-4 text-primary" />
        <span className="max-w-[180px] truncate font-medium">{fileName}</span>
        <span className="text-muted-foreground text-xs">{fmtNum(rowCount)} rows</span>
        <button
          onClick={clearData}
          className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear data"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
        drag ? "border-primary bg-primary/5" : "border-border/60 bg-card/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="rounded-full bg-primary/10 p-4">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-primary" />
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold">
          {loading ? "Parsing your data…" : "Upload loan portfolio CSV"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? `${fmtNum(progress)} rows parsed`
            : "Drop your file here or click to browse. LendingClub-format expected."}
        </p>
      </div>
      {!loading && (
        <Button onClick={() => inputRef.current?.click()} size="lg" className="mt-2">
          Choose CSV file
        </Button>
      )}
    </div>
  );
}
