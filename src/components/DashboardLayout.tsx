import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-dashboard-bg">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-4">
            {isMobile ? <MobileNavigation /> : <SidebarTrigger />}
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold text-primary">SINDPAN</h1>
              {!isMobile && (
                <p className="text-sm text-muted-foreground">Painel Administrativo</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {!isMobile && (
              <Button variant="ghost" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user?.bakery_name}</p>
                  <p className="text-muted-foreground text-xs">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex w-full">
          <AppSidebar />
          <main className="flex-1 p-3 md:p-6 overflow-x-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
