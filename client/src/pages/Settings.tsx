import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import {
  User, Mail, Phone, Globe, Github, Linkedin, FileText, Settings2,
  Database, RefreshCw, TestTube, Moon, Sun, Monitor,
} from "lucide-react";

const settingsSchema = z.object({
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  signature: z.string().optional(),
  defaultSubject: z.string().optional(),
  dailySendLimit: z.number().min(1).max(500).optional(),
  emailDelayMs: z.number().min(0).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpSecure: z.boolean().optional(),
  googleSheetsConfig: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

function Section({ title, description, icon: Icon, children }: any) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => { toast.success("Settings saved"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      phone: "",
      portfolio: "",
      github: "",
      linkedin: "",
      signature: "",
      defaultSubject: "",
      dailySendLimit: 50,
      emailDelayMs: 5000,
      smtpUser: "",
      smtpPass: "",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpSecure: false,
      googleSheetsConfig: "",
      theme: "system",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        phone: settings.phone ?? "",
        portfolio: settings.portfolio ?? "",
        github: settings.github ?? "",
        linkedin: settings.linkedin ?? "",
        signature: settings.signature ?? "",
        defaultSubject: settings.defaultSubject ?? "",
        dailySendLimit: settings.dailySendLimit ?? 50,
        emailDelayMs: settings.emailDelayMs ?? 5000,
        smtpUser: settings.smtpUser ?? "",
        smtpPass: settings.smtpPass ?? "",
        smtpHost: settings.smtpHost ?? "smtp.gmail.com",
        smtpPort: settings.smtpPort ?? 587,
        smtpSecure: settings.smtpSecure ?? false,
        googleSheetsConfig: settings.googleSheetsConfig ?? "",
        theme: (settings.theme as any) ?? "system",
      });
    }
  }, [settings]);

  const onSubmit = (data: SettingsForm) => {
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== "" && v !== undefined) clean[k] = v;
    });
    updateMutation.mutate(clean);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your dashboard preferences</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Profile */}
        <Section title="Profile" description="Your personal information used in email templates" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone">
              <Input {...form.register("phone")} placeholder="+1 234 567 8900" />
            </FormField>
            <FormField label="Portfolio URL">
              <Input {...form.register("portfolio")} placeholder="https://yourportfolio.com" />
            </FormField>
            <FormField label="GitHub">
              <Input {...form.register("github")} placeholder="https://github.com/username" />
            </FormField>
            <FormField label="LinkedIn">
              <Input {...form.register("linkedin")} placeholder="https://linkedin.com/in/username" />
            </FormField>
          </div>
          <FormField label="Email Signature" hint="Appended to all outgoing emails">
            <Textarea {...form.register("signature")} placeholder="Best regards,&#10;Your Name" rows={4} />
          </FormField>
        </Section>

        {/* Email Defaults */}
        <Section title="Email Defaults" description="Default values for composing emails" icon={Mail}>
          <FormField label="Default Subject">
            <Input {...form.register("defaultSubject")} placeholder="Application for {{position}} at {{company}}" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Daily Send Limit" hint="Max emails per day">
              <Input
                type="number"
                {...form.register("dailySendLimit", { valueAsNumber: true })}
                min={1}
                max={500}
              />
            </FormField>
            <FormField label="Delay Between Emails (ms)" hint="Prevent spam detection">
              <Input
                type="number"
                {...form.register("emailDelayMs", { valueAsNumber: true })}
                min={0}
                step={500}
              />
            </FormField>
          </div>
        </Section>

        {/* SMTP Settings */}
        <Section title="Email Settings" description="Configure your email server to send emails" icon={Settings2}>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email Address">
                <Input
                  {...form.register("smtpUser")}
                  placeholder="you@example.com"
                />
              </FormField>
              <FormField label="Gmail App Password" hint="NOT your login password - use App Password">
                <Input
                  {...form.register("smtpPass")}
                  placeholder="xxxx xxxx xxxx xxxx"
                  type="password"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="SMTP Host">
                <Input
                  {...form.register("smtpHost")}
                  placeholder="smtp.gmail.com"
                />
              </FormField>
              <FormField label="Port">
                <Input
                  type="number"
                  {...form.register("smtpPort", { valueAsNumber: true })}
                  placeholder="587"
                />
              </FormField>
            </div>
            <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
              <p className="font-medium">Gmail Setup (2 minutes):</p>
              <p>1. Go to <a href="https://myaccount.google.com/security" target="_blank" className="underline">myaccount.google.com/security</a></p>
              <p>2. Enable <b>2-Step Verification</b> (must)</p>
              <p>3. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">myaccount.google.com/apppasswords</a></p>
              <p>4. Create App Password, copy the 16-digit code</p>
              <p>5. Paste above, save settings</p>
            </div>
          </div>
        </Section>

        {/* Google Sheets */}
        <Section title="Google Sheets" description="Sync applications to a spreadsheet" icon={Database}>
          <FormField label="Google Sheets Configuration (JSON)" hint="Paste your GCP service account credentials and spreadsheet settings">
            <Textarea
              {...form.register("googleSheetsConfig")}
              placeholder='{"spreadsheetId": "...", "worksheetName": "Applications", "credentials": {...}}'
              rows={6}
              className="font-mono text-xs"
            />
          </FormField>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <TestTube className="h-4 w-4" />Test Connection
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />Sync Now
            </Button>
          </div>
        </Section>

        {/* Theme */}
        <Section title="Appearance" description="Customize the look of your dashboard" icon={Monitor}>
          <FormField label="Theme">
            <div className="flex gap-2">
              {[
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setTheme(value as any); form.setValue("theme", value as any); }}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    theme === value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </FormField>
        </Section>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
