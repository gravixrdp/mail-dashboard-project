import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  Mail,
  Building2,
  FileUser,
  BarChart3,
  Settings,
  Activity,
  Search,
  Moon,
  Sun,
  Briefcase,
  BookOpen,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayoutSkeleton from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import CommandPalette from "./CommandPalette";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Send, label: "Compose Mail", path: "/compose" },
  { icon: Briefcase, label: "Applications", path: "/applications" },
  { icon: Building2, label: "Companies", path: "/companies" },
  { icon: BookOpen, label: "Templates", path: "/templates" },
  { icon: FileUser, label: "Resume Manager", path: "/resumes" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Activity, label: "Activity Logs", path: "/activity" },
];

function SidebarInner({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { state } = useSidebar() as any;
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeMenuItem = menuItems.find(
    (item) => item.path === location || (item.path !== "/" && location.startsWith(item.path))
  );

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <Sidebar collapsible="icon" className="border-r border-border/60">
        <SidebarHeader className="h-14 justify-center border-b border-border/60">
          <div className="flex items-center gap-2.5 px-3 w-full">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight">JobTracker</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Personal Dashboard</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 py-2">
          <SidebarMenu className="px-2 gap-0.5">
            {menuItems.map((item) => {
              const isActive =
                location === item.path ||
                (item.path !== "/" && location.startsWith(item.path));
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className={`h-9 rounded-md transition-all font-normal ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-border/60">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-7 w-7 border shrink-0">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-none">{user?.name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email || ""}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex border-b border-border/60 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-md" />
            <div className="h-4 w-px bg-border" />
            <h2 className="font-semibold text-sm">{activeMenuItem?.label ?? "Dashboard"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-muted-foreground text-xs hidden sm:flex border-border/60"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Quick search...</span>
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">⌘K</Badge>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:hidden"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-3.5rem)]">{children}</main>
      </SidebarInset>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Briefcase className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold tracking-tight">JobTracker Dashboard</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your personal job application management system. Sign in to access your dashboard.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SidebarInner>{children}</SidebarInner>
      </div>
    </SidebarProvider>
  );
}
