import { LayoutDashboard, Users, Building, ClipboardList, Settings, Calendar, BarChart2, Package, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "employees", icon: Users, label: "Dipendenti" },
  { id: "clients", icon: Building, label: "Clienti" },
  { id: "workorders", icon: ClipboardList, label: "Commesse" },
  { id: "configuration", icon: Settings, label: "Configurazione" },
  { id: "attendance", icon: Calendar, label: "Presenze" },
  { id: "absence-stats", icon: BarChart2, label: "Statistiche" },
  { id: "fuel", icon: Package, label: "Rifornimenti" },
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  pendingReportsCount?: number;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  pendingReportsCount = 0,
}: AppSidebarProps) {
  // Update badge for dashboard if we have pending reports
  const itemsWithBadges = sidebarItems.map(item => {
    if (item.id === "dashboard" && pendingReportsCount > 0) {
      return { ...item, badge: pendingReportsCount };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[250px]",
        isMobile && "fixed inset-y-0 left-0 z-50 shadow-lg"
      )}
    >
      {/* Header con toggle */}
      <div className="flex items-center justify-between p-4 border-b h-[73px]">
        {!isCollapsed && <span className="font-semibold text-lg">Menu</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {itemsWithBadges.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          const button = (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-all",
                isCollapsed && "justify-center px-2",
                isActive && "bg-secondary hover:bg-secondary/80"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform",
                isActive && "scale-110"
              )} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );

          // Wrap with tooltip when collapsed
          if (isCollapsed) {
            return (
              <Tooltip key={item.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="default" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>
    </aside>
  );
}

export { sidebarItems };
