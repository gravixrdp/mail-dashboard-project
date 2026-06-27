import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search, Plus, Pencil, Trash2, Building2, Mail, Calendar, Hash,
} from "lucide-react";

const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  emails: z.string().min(1, "At least one email is required"),
  notes: z.string().optional(),
  status: z.enum(["active", "archived", "rejected"]).optional(),
});
type CompanyForm = z.infer<typeof companySchema>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-black text-white dark:bg-white dark:text-black",
  archived: "bg-gray-200 text-black dark:bg-gray-800 dark:text-white",
  rejected: "bg-gray-400 text-black dark:bg-gray-600 dark:text-white",
};

export default function Companies() {
  const [search, setSearch] = useState("");
  const [editCompany, setEditCompany] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: companies, isLoading, refetch } = trpc.companies.list.useQuery();
  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => { toast.success("Company created"); refetch(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => { toast.success("Company updated"); refetch(); setEditCompany(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { toast.success("Company deleted"); refetch(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<CompanyForm>({ resolver: zodResolver(companySchema) });

  const filtered = (companies ?? []).filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.emails.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (company: any) => {
    setEditCompany(company);
    form.reset({
      name: company.name,
      emails: company.emails,
      notes: company.notes ?? "",
      status: company.status,
    });
  };

  const openCreate = () => {
    setShowCreate(true);
    form.reset({ name: "", emails: "", notes: "", status: "active" });
  };

  const onSubmit = (data: CompanyForm) => {
    if (editCompany) {
      updateMutation.mutate({ id: editCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} companies tracked</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />Add Company
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No companies found</p>
          <Button variant="link" size="sm" className="mt-1" onClick={openCreate}>Add your first company</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company: any) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{company.name}</CardTitle>
                      <Badge variant="secondary" className={"text-xs mt-1 " + (STATUS_COLORS[company.status] ?? "")}>
                        {company.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(company)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(company.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="truncate">{company.emails}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>{company.applicationCount} application{company.applicationCount !== 1 ? "s" : ""}</span>
                </div>
                {company.lastAppliedAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Last: {format(new Date(company.lastAppliedAt), "MMM d, yyyy")}</span>
                  </div>
                )}
                {company.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 border-t border-border/50 pt-2">{company.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate || !!editCompany} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditCompany(null); } }}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCompany ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input {...form.register("name")} placeholder="Acme Corp" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>HR Emails (comma-separated)</Label>
              <Input {...form.register("emails")} placeholder="hr@acme.com, careers@acme.com" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("status") ?? "active"} onValueChange={(v: any) => form.setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Any notes about this company..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditCompany(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editCompany ? "Save Changes" : "Add Company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the company and all associated data.</AlertDialogDescription>
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
