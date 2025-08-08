import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PadariaSidebar } from "@/components/padaria/PadariaSidebar";
import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PadariaLayoutProps {
  children: React.ReactNode;
}

export function PadariaLayout({ children }: PadariaLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication
  const isAuthenticated = localStorage.getItem("padaria_token");

  if (!isAuthenticated) {
    return <Navigate to="/padaria/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("padaria_token");
    localStorage.removeItem("padaria_id");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/padaria/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold text-primary">Portal da Padaria</h1>
              <p className="text-sm text-muted-foreground">Campanha SINDPAN 2025</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex w-full">
          <PadariaSidebar />
          <main className="flex-1 p-3 lg:p-4 xl:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}