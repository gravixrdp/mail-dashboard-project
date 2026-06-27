import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Send, Save, Eye, AlertTriangle, X, Plus, FileText, Building2, ChevronDown, Bold, Italic, Underline,
} from "lucide-react";

const VARIABLES = ["{{company}}", "{{today}}", "{{position}}", "{{portfolio}}", "{{github}}", "{{linkedin}}", "{{phone}}", "{{email}}", "{{resume}}"];

const composeSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  templateId: z.string().optional(),
  resumeId: z.string().optional(),
  companyName: z.string().optional(),
  companyId: z.string().optional(),
});
type ComposeForm = z.infer<typeof composeSchema>;

function extractCompanyFromEmail(email: string): string {
  if (!email.includes("@")) return "";
  const domain = email.split("@")[1];
  if (!domain) return "";
  const parts = domain.split(".");
  const name = parts[0] ?? "";
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderVariables(text: string, settings: any, companyName: string): string {
  const today = format(new Date(), "MMMM d, yyyy");
  return text
    .replace(/\{\{company\}\}/g, companyName || "{{company}}")
    .replace(/\{\{today\}\}/g, today)
    .replace(/\{\{phone\}\}/g, settings?.phone ?? "{{phone}}")
    .replace(/\{\{email\}\}/g, settings?.email ?? "{{email}}")
    .replace(/\{\{portfolio\}\}/g, settings?.portfolio ?? "{{portfolio}}")
    .replace(/\{\{github\}\}/g, settings?.github ?? "{{github}}")
    .replace(/\{\{linkedin\}\}/g, settings?.linkedin ?? "{{linkedin}}")
    .replace(/\{\{position\}\}/g, "{{position}}");
}

export default function ComposeMail() {
  const [showPreview, setShowPreview] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: templates } = trpc.templates.list.useQuery();
  const { data: resumes } = trpc.resumes.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: applications } = trpc.applications.list.useQuery({ limit: 1000 });
  const createApplication = trpc.applications.create.useMutation({
    onSuccess: () => {
      toast.success("Application saved and email queued!");
      form.reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<ComposeForm>({
    resolver: zodResolver(composeSchema),
    defaultValues: { to: "", subject: settings?.defaultSubject ?? "", body: "" },
  });

  // Function to wrap selected text with tags
  const wrapTextWithTags = (startTag: string, endTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const newText = value.substring(0, selectionStart) +
                   startTag + selectedText + endTag +
                   value.substring(selectionEnd);

    form.setValue("body", newText);

    // Force the textarea DOM to update by using the native setter
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(textarea, newText);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Set cursor position after the end tag
    setTimeout(() => {
      textarea.focus();
      if (selectedText.length === 0) {
        textarea.setSelectionRange(selectionStart + startTag.length, selectionStart + startTag.length);
      } else {
        textarea.setSelectionRange(selectionEnd + startTag.length + endTag.length, selectionEnd + startTag.length + endTag.length);
      }
    }, 0);
  };

  // Formatting functions
  const handleBold = () => wrapTextWithTags("<b>", "</b>");
  const handleItalic = () => wrapTextWithTags("<i>", "</i>");
  const handleUnderline = () => wrapTextWithTags("<u>", "</u>");

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleBold();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        handleItalic();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        handleUnderline();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toValue = form.watch("to");
  const bodyValue = form.watch("body");
  const subjectValue = form.watch("subject");
  const companyNameValue = form.watch("companyName") ?? "";

  // Auto-detect company from email
  useEffect(() => {
    if (toValue && toValue.includes("@")) {
      const detected = extractCompanyFromEmail(toValue);
      if (detected && !form.getValues("companyName")) {
        form.setValue("companyName", detected);
      }
    }
  }, [toValue]);

  // Load template
  const loadTemplate = (templateId: string) => {
    const template = (templates ?? []).find((t: any) => t.id.toString() === templateId);
    if (template) {
      form.setValue("subject", template.subject);
      form.setValue("body", template.body);
    }
  };

  const checkDuplicate = () => {
    const email = form.getValues("to");
    if (!email || !applications) return null;
    const domain = email.split("@")[1];
    const existing = (applications as any[]).find((a: any) => {
      if (a.hrEmail === email) return true;
      if (domain && a.hrEmail.includes("@") && a.hrEmail.split("@")[1] === domain) return true;
      return false;
    });
    return existing;
  };

  const handleSend = async (data: ComposeForm) => {
    const duplicate = checkDuplicate();
    if (duplicate) {
      setDuplicateInfo(duplicate);
      setShowDuplicateWarning(true);
      return;
    }
    await doSend(data);
  };

  const doSend = async (data: ComposeForm) => {
    setIsSending(true);
    try {
      const companyId = data.companyId ? parseInt(data.companyId) : (companies as any[])?.[0]?.id ?? 1;
      await createApplication.mutateAsync({
        companyId,
        hrEmail: data.to,
        subject: renderVariables(data.subject, settings, companyNameValue),
        emailBody: renderVariables(data.body, settings, companyNameValue),
        status: "sent",
        resumeUsed: data.resumeId ?? undefined,
        templateUsed: data.templateId ?? undefined,
      });
    } finally {
      setIsSending(false);
      setShowDuplicateWarning(false);
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    const companyId = data.companyId ? parseInt(data.companyId) : (companies as any[])?.[0]?.id ?? 1;
    createApplication.mutate({
      companyId,
      hrEmail: data.to || "draft@example.com",
      subject: data.subject || "Draft",
      emailBody: data.body || "",
      status: "draft",
    });
    toast.success("Draft saved");
  };

  const insertVariable = (variable: string) => {
    const current = form.getValues("body");
    form.setValue("body", current + variable);
  };

  const renderedBody = renderVariables(bodyValue, settings, companyNameValue);
  const renderedSubject = renderVariables(subjectValue, settings, companyNameValue);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compose Mail</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Send job applications directly from your dashboard</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSend)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main compose area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                {/* To */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</Label>
                  <Input
                    {...form.register("to")}
                    placeholder="careers@company.com"
                    className="font-mono text-sm"
                  />
                  {form.formState.errors.to && (
                    <p className="text-xs text-destructive">{form.formState.errors.to.message}</p>
                  )}
                </div>

                {/* Company auto-detect */}
                {toValue && toValue.includes("@") && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Detected company:</span>
                    <Input
                      {...form.register("companyName")}
                      className="h-6 text-xs border-0 bg-transparent p-0 font-medium focus-visible:ring-0"
                      placeholder="Company name"
                    />
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</Label>
                  <Input {...form.register("subject")} placeholder="Application for Software Engineer at {{company}}" />
                </div>

                <Separator />

                {/* Formatting Toolbar */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Format</Label>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={handleBold}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={handleItalic}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={handleUnderline}
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Variables */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insert Variable</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body</Label>
                  <Textarea
                    ref={textareaRef}
                    {...form.register("body")}
                    placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in..."
                    rows={16}
                    className="font-mono text-sm resize-none"
                  />
                  {form.formState.errors.body && (
                    <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button type="submit" className="gap-2" disabled={isSending}>
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send Email"}
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={handleSaveDraft}>
                <Save className="h-4 w-4" />Save Draft
              </Button>
              <Button type="button" variant="ghost" className="gap-2" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" />Preview
              </Button>
            </div>
          </div>

          {/* Sidebar options */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Template</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select onValueChange={(v) => { form.setValue("templateId", v); loadTemplate(v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates ?? []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        <div className="flex flex-col">
                          <span>{t.name}</span>
                          {t.category && <span className="text-xs text-muted-foreground">{t.category}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Resume</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select onValueChange={(v) => form.setValue("resumeId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {(resumes ?? []).map((r: any) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{r.filename}</span>
                          {r.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Company</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select onValueChange={(v) => form.setValue("companyId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Link to company" />
                  </SelectTrigger>
                  <SelectContent>
                    {(companies ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Variable values */}
            {settings && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Variable Values</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-xs">
                  {[
                    { key: "phone", value: settings.phone },
                    { key: "portfolio", value: settings.portfolio },
                    { key: "github", value: settings.github },
                    { key: "linkedin", value: settings.linkedin },
                  ].map(({ key, value }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono">{`{{${key}}}`}</span>
                      <span className="text-foreground truncate max-w-[120px]">{value ?? <span className="text-muted-foreground/50">not set</span>}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Variables have been substituted with real values</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-16 shrink-0">To:</span>
                <span className="font-medium">{toValue}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-16 shrink-0">Subject:</span>
                <span className="font-medium">{renderedSubject}</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div 
                className="text-sm whitespace-pre-wrap font-sans leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderedBody }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Duplicate Detected
            </DialogTitle>
            <DialogDescription>
              You may have already applied to this company or email address.
            </DialogDescription>
          </DialogHeader>
          {duplicateInfo && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Email:</span>
                <span className="font-medium">{duplicateInfo.hrEmail}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Status:</span>
                <Badge variant="secondary" className="text-xs">{duplicateInfo.status}</Badge>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Date:</span>
                <span>{duplicateInfo.createdAt ? format(new Date(duplicateInfo.createdAt), "MMM d, yyyy") : "Unknown"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => doSend(form.getValues())}
              disabled={isSending}
            >
              Send Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
