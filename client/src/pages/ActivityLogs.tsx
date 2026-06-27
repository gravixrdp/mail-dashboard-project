import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search, Activity, Mail, FileText, Building2, Settings,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";

const ACTION_ICONS: Record<string, any> = {
  APPLICATION_SENT: Mail,
  APPLICATION_CREATED: Mail,
  APPLICATION_UPDATED: Mail,
  APPLICATION_DELETED: Mail,
  RESUME_UPLOADED: FileText,
  RESUME_UPDATED: FileText,
  RESUME_DELETED: FileText,
  TEMPLATE_CREATED: FileText,
  TEMPLATE_UPDATED: FileText,
  TEMPLATE_DELETED: FileText,
  SETTINGS_UPDATED: Settings,
  DUPLICATE_PREVENTED: AlertCircle,
  BOUNCE_DETECTED: AlertCircle,
  GOOGLE_SHEET_SYNCED: RefreshCw,
};

const ACTION_COLORS: Record<string, string> = {
  APPLICATION_SENT: "bg-black text-white dark:bg-white dark:text-black",
  APPLICATION_CREATED: "bg-black text-white dark:bg-white dark:text-black",
  RESUME_UPLOADED: "bg-gray-800 text-white dark:bg-gray-200 dark:text-black",
  TEMPLATE_CREATED: "bg-gray-600 text-white dark:bg-gray-400 dark:text-black",
  SETTINGS_UPDATED: "bg-gray-200 text-black dark:bg-gray-800 dark:text-white",
  DUPLICATE_PREVENTED: "bg-gray-400 text-black dark:bg-gray-600 dark:text-white",
  BOUNCE_DETECTED: "bg-gray-300 text-black dark:bg-gray-700 dark:text-white",
};

const PAGE_SIZE = 25;

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data: logs, isLoading, refetch } = trpc.activityLogs.list.useQuery({ limit: 500, offset: 0 });

  const filtered = (logs ?? []).filter((l: any) =>
    !search ||
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.actionType?.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} events recorded</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activity..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-16 text-center">
          <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No activity found</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />
          <div className="space-y-2 pl-12">
            {paginated.map((log: any) => {
              const Icon = ACTION_ICONS[log.actionType] ?? Activity;
              const colorClass = ACTION_COLORS[log.actionType] ?? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
              return (
                <div key={log.id} className="relative">
                  <div className={`absolute -left-[2.35rem] h-7 w-7 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={"text-xs " + colorClass}>
                            {log.actionType?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ""}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {log.createdAt ? format(new Date(log.createdAt), "MMM d, h:mm a") : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
