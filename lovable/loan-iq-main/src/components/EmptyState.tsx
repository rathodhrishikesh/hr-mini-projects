import { Link } from "react-router-dom";
import { useDataStore } from "@/lib/data-store";
import { CsvUpload } from "./CsvUpload";
import { Button } from "@/components/ui/button";
import { Database, Download } from "lucide-react";

export function EmptyState() {
  const hasData = useDataStore((s) => s.rows.length > 0);
  if (hasData) return null;
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Database className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Upload a portfolio to begin</h2>
        <p className="mt-2 text-muted-foreground">
          Drop a LendingClub-format loan CSV to unlock the full analytics suite.
        </p>
      </div>
      <CsvUpload />
      <div className="mt-6 flex justify-center">
        {/* <Link to="/upload"><Button variant="outline">Or open the dedicated upload page</Button></Link> */}
        <a
          href="https://drive.google.com/file/d/145dAePvPakpMnC0QanZQ3N5uDvXblMfB/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Dummy Dataset
          </Button>
        </a>
      </div>
    </div>
  );
}
