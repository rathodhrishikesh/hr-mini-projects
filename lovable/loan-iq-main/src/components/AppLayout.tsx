import { useMemo } from "react";
import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CsvUpload } from "./CsvUpload";
import { useDataStore } from "@/lib/data-store";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/analytics";

export function AppLayout() {
  const rows = useDataStore((s) => s.rows);
  const filters = useDataStore((s) => s.filters);
  const hasData = rows.length > 0;
  const filtered = useMemo(() => useDataStore.getState().filtered(), [rows, filters]);
  const columns = useDataStore((s) => s.columns);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-gradient font-bold">LoanIQ</span>
                <span className="text-muted-foreground/50">/</span>
                <span>Portfolio Analytics</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {hasData && (
                <>
                  <CsvUpload compact />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCsv(filtered, columns, "LoanIQ-filtered.csv")}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    <span className="hidden md:inline">Export filtered</span>
                  </Button>
                </>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
