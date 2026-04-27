import { Activity } from "lucide-react";

export const AppHeader = () => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elev-md">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight text-foreground">
              LendingClub<span className="text-primary">IQ</span>
            </div>
            <div className="text-[11px] font-medium text-muted-foreground">
              Credit Risk Modeling Suite
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#upload" className="transition-colors hover:text-foreground">Upload</a>
          <a href="#preview" className="transition-colors hover:text-foreground">Data</a>
          <a href="#model" className="transition-colors hover:text-foreground">Model</a>
          <a href="#insights" className="transition-colors hover:text-foreground">Insights</a>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
            ● Live
          </span>
        </div>
      </div>
    </header>
  );
};
