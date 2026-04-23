import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingDown,
  Layers,
  DollarSign,
  AlertTriangle,
  Map,
  GraduationCap,
  Upload,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useDataStore } from "@/lib/data-store";
import { fmtNum } from "@/lib/analytics";

const items = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Default Over Time", url: "/trends", icon: TrendingDown },
  { title: "Risk Segmentation", url: "/segmentation", icon: Layers },
  { title: "Pricing vs Risk", url: "/pricing", icon: DollarSign },
  { title: "High-Risk Finder", url: "/finder", icon: AlertTriangle },
  { title: "State Risk Map", url: "/states", icon: Map },
  { title: "FICO Analysis", url: "/fico", icon: GraduationCap },
  { title: "Upload Data", url: "/upload", icon: Upload },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const fileName = useDataStore((s) => s.fileName);
  const rowCount = useDataStore((s) => s.rows.length);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-bold tracking-tight text-sidebar-foreground">LoanIQ</div>
              <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                Credit Risk Analytics
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
          {fileName ? (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Loaded dataset</div>
              <div className="truncate text-sm font-medium text-sidebar-foreground">{fileName}</div>
              <div className="text-xs text-muted-foreground">{fmtNum(rowCount)} loan records</div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No dataset loaded</div>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
