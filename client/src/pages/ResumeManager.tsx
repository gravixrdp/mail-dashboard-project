import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText, Upload, Trash2, Pencil, Star, StarOff, Eye, Download,
} from "lucide-react";

export default function ResumeManager() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [renameResume, setRenameResume] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resumes, isLoading, refetch } = trpc.resumes.list.useQuery();
  const deleteMutation = trpc.resumes.delete.useMutation({
    onSuccess: () => { toast.success("Resume deleted"); refetch(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.resumes.update.useMutation({
    onSuccess: () => { toast.success("Resume updated"); refetch(); setRenameResume(null); },
    onError: (e) => toast.error(e.message),
  });
  const createMutation = trpc.resumes.create.useMutation({
    onSuccess: () => { toast.success("Resume uploaded"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // In production this would upload to R2; here we store metadata
      await createMutation.mutateAsync({
        filename: file.name,
        fileKey: `resumes/${Date.now()}_${file.name}`,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        mimeType: file.type,
        isDefault: (resumes ?? []).length === 0,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setDefault = (id: number) => {
    updateMutation.mutate({ id, data: { isDefault: true } });
  };

  const openRename = (resume: any) => {
    setRenameResume(resume);
    setNewName(resume.filename);
  };

  const doRename = () => {
    if (!renameResume || !newName.trim()) return;
    updateMutation.mutate({ id: renameResume.id, data: { filename: newName.trim() } });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{(resumes ?? []).length} resume{(resumes ?? []).length !== 1 ? "s" : ""} stored</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Resume"}
          </Button>
        </div>
      </div>

      {/* Upload drop zone */}
      <div
        className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            handleFileUpload({ target: fileInputRef.current } as any);
          }
        }}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">Drop your resume here or click to browse</p>
        <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOC, DOCX supported</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (resumes ?? []).length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No resumes uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(resumes as any[]).map((resume: any) => (
            <Card key={resume.id} className={`hover:shadow-md transition-shadow ${resume.isDefault ? "border-primary/40 bg-primary/5" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{resume.filename}</p>
                    {resume.isDefault && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary shrink-0">Default</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {resume.fileSize && (
                      <span className="text-xs text-muted-foreground">{formatSize(resume.fileSize)}</span>
                    )}
                    {resume.uploadedAt && (
                      <span className="text-xs text-muted-foreground">
                        Uploaded {format(new Date(resume.uploadedAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!resume.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Set as default"
                      onClick={() => setDefault(resume.id)}
                    >
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  {resume.isDefault && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                      <Star className="h-4 w-4 text-primary fill-primary" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Rename"
                    onClick={() => openRename(resume)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {resume.fileUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Preview"
                      onClick={() => window.open(resume.fileUrl, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Delete"
                    onClick={() => setDeleteId(resume.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={!!renameResume} onOpenChange={(o) => !o && setRenameResume(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="resume.pdf" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameResume(null)}>Cancel</Button>
            <Button onClick={doRename} disabled={updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
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
