import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Row } from "@/lib/creditModel";

interface Props {
  onLoaded: (rows: Row[], totalRows: number, fileName: string) => void;
  busy?: boolean;
  maxRows?: number;
}

export const CsvUpload = ({ onLoaded, busy, maxRows = 500000 }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseInput = useCallback(
    (input: File | string, displayName: string, sizeHint?: number) => {
      setParsing(true);
      setProgress(0);
      setFileName(displayName);

      const rows: Row[] = [];
      let total = 0;
      const fileSize = input instanceof File ? input.size : (sizeHint ?? 0);

      const config: any = {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        worker: true,
        chunk: (chunk: Papa.ParseResult<Row>) => {
          total += chunk.data.length;
          for (const r of chunk.data) {
            if (rows.length < maxRows) rows.push(r);
            else {
              const j = Math.floor(Math.random() * total);
              if (j < maxRows) rows[j] = r;
            }
          }
          const cursor = (chunk.meta as any).cursor as number | undefined;
          if (cursor && fileSize) setProgress(Math.min(99, Math.round((cursor / fileSize) * 100)));
        },
        complete: () => {
          setProgress(100);
          setParsing(false);
          onLoaded(rows, total, displayName);
        },
        error: () => {
          setParsing(false);
        },
      };
      if (typeof input === "string") config.download = true;
      Papa.parse(input as any, config);
    },
    [maxRows, onLoaded],
  );

  const parseFile = useCallback(
    (file: File) => {
      parseInput(file, file.name);
    },
    [parseInput],
  );

  const useSample = useCallback(async () => {
    try {
      setParsing(true);
      setProgress(0);
      setFileName("lendscope-sample_50k.csv — downloading…");
      const res = await fetch("/sample/lendscope-sample_50k.csv");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], "lendscope-sample_50k.csv", { type: "text/csv" });
      parseInput(file, "lendscope-sample_50k.csv (sample)");
    } catch (e) {
      console.error("Failed to load sample:", e);
      setParsing(false);
      setFileName(null);
    }
  }, [parseInput]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn(
        "relative rounded-2xl border-2 border-dashed bg-gradient-card p-10 text-center transition-all shadow-elev-sm",
        drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parseFile(f);
        }}
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        {parsing || busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        ) : (
          <Upload className="h-7 w-7 text-primary" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {parsing ? "Parsing CSV…" : busy ? "Training model…" : "Upload your loan dataset"}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Drop a LendingClub-style CSV to begin Loan Analysis. We'll sample up to {maxRows.toLocaleString()} rows for
        in-browser modeling.
      </p>

      {fileName && (
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground">
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
          {fileName}
          {parsing && <span className="text-muted-foreground">— {progress}%</span>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => inputRef.current?.click()} disabled={parsing || busy} size="lg">
          <Upload className="mr-2 h-4 w-4" />
          Choose CSV file
        </Button>
        <Button onClick={useSample} disabled={parsing || busy} size="lg" variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Use Sample Data
        </Button>
      </div>

      {parsing && (
        <div className="mx-auto mt-6 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};
