import { Link, useLocation } from "wouter";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Wallet, MessageSquare, Truck, Settings, Sparkles } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Finance", url: "/finance", icon: Wallet },
  { title: "Providers", url: "/providers", icon: Truck },
  { title: "Cleaning", url: "/cleaning", icon: Sparkles },
  { title: "Support Chat", url: "/chat", icon: MessageSquare },
];

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
} as React.CSSProperties;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive =
                      item.url === "/"
                        ? location === "/"
                        : location.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/settings"}
                  tooltip="Settings"
                  data-testid="nav-settings"
                >
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 border-b px-4 py-3 sticky top-0 bg-background z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-base font-semibold">Hoster Admin</h1>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
