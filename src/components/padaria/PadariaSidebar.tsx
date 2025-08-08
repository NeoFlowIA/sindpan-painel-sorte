import { 
  Home, 
  Users, 
  Receipt, 
  Trophy, 
  Settings,
  Store
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { title: "Dashboard", url: "/padaria/dashboard", icon: Home },
  { title: "Clientes", url: "/padaria/clientes", icon: Users },
];

export function PadariaSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  return (
    <Sidebar 
      className={`border-r border-border ${collapsed ? "w-14" : "w-64"}`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg text-primary">Minha Padaria</h2>
              <p className="text-sm text-muted-foreground">Portal de Gestão</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`
                        }
                      >
                        <Icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}