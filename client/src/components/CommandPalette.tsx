import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Send,
  Briefcase,
  Building2,
  BookOpen,
  FileUser,
  BarChart3,
  Settings,
  Activity,
} from "lucide-react";
import { useLocation } from "wouter";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pages = [
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

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();

  const navigate = (path: string) => {
    setLocation(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => navigate(page.path)}
              className="cursor-pointer"
            >
              <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{page.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate("/compose")} className="cursor-pointer">
            <Send className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Compose New Email</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/applications")} className="cursor-pointer">
            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>View All Applications</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/companies")} className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Browse Companies</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
