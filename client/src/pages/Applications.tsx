import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search, Plus, Pencil, Trash2, Briefcase, Filter, ChevronLeft, ChevronRight,
  Mail, Calendar, FileText, Building2,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-black text-white dark:bg-white dark:text-black",
  replied: "bg-gray-800 text-white dark:bg-gray-200 dark:text-black",
  interview: "bg-gray-600 text-white dark:bg-gray-400 dark:text-black",
  rejected: "bg-gray-400 text-black dark:bg-gray-600 dark:text-white",
  ghosted: "bg-gray-200 text-black dark:bg-gray-800 dark:text-white",
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

const appSchema = z.object({
  companyId: z.number({ required_error: "Company is required" }),
  hrEmail: z.string().email("Invalid email"),
  subject: z.string().min(1, "Subject is required"),
  emailBody: z.string().min(1, "Body is required"),
  status: z.enum(["sent", "replied", "interview", "rejected", "ghosted", "draft"]).optional(),
  resumeUsed: z.string().optional(),
  templateUsed: z.string().optional(),
  notes: z.string().optional(),
});

type AppForm = z.infer<typeof appSchema>;

const PAGE_SIZE = 20;

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [editApp, setEditApp] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: apps, isLoading, refetch } = trpc.applications.list.useQuery({
    limit: 200,
    offset: 0,
  });
  const { data: companies } = trpc.companies.list.useQuery();
  const createMutation = trpc.applications.create.useMutation({
    onSuccess: () => { toast.success("Application created"); refetch(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.applications.update.useMutation({
    onSuccess: () => { toast.success("Application updated"); refetch(); setEditApp(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.applications.delete.useMutation({
    onSuccess: () => { toast.success("Application deleted"); refetch(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<AppForm>({ resolver: zodResolver(appSchema) });

  const filtered = (apps ?? []).filter((a: any) => {
    const matchSearch =
      !search ||
      a.hrEmail.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openEdit = (app: any) => {
    setEditApp(app);
    form.reset({
      companyId: app.companyId,
      hrEmail: app.hrEmail,
      subject: app.subject,
      emailBody: app.emailBody,
      status: app.status,
      resumeUsed: app.resumeUsed ?? "",
      templateUsed: app.templateUsed ?? "",
      notes: app.notes ?? "",
    });
  };

  const openCreate = () => {
    setShowCreate(true);
    form.reset({ hrEmail: "", subject: "", emailBody: "", status: "draft" });
  };

  const onSubmit = (data: AppForm) => {
    if (editApp) {
      updateMutation.mutate({ id: editApp.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} application{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />Add Application
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="ghosted">Ghosted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No applications found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or add a new application</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">HR Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Sent</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((app: any) => (
                  <TableRow key={app.id} className="group">
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[160px]">{app.hrEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="truncate max-w-[300px] block">{app.subject}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={"text-xs " + (STATUS_COLORS[app.status] ?? "")}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.sentAt ? format(new Date(app.sentAt), "MMM d, yyyy") : app.createdAt ? format(new Date(app.createdAt), "MMM d") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(app)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(app.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!editApp} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditApp(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editApp ? "Edit Application" : "New Application"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={form.watch("companyId")?.toString() ?? ""}
                onValueChange={(v) => form.setValue("companyId", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {(companies ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HR Email</Label>
              <Input {...form.register("hrEmail")} placeholder="hr@company.com" />
              {form.formState.errors.hrEmail && <p className="text-xs text-destructive">{form.formState.errors.hrEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input {...form.register("subject")} placeholder="Application for Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("status") ?? "draft"} onValueChange={(v: any) => form.setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft", "sent", "replied", "interview", "rejected", "ghosted"].map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Any notes..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditApp(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editApp ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
