import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Mail, MessageSquare, CheckCircle, XCircle, Clock,
  TrendingUp, Calendar, Send, Activity, ArrowRight,
  Briefcase, Building2, FileText, Zap
} from "lucide-react";
import { format, subDays } from "date-fns";
import { useLocation } from "wouter";

const generateWeeklyData = () =>
  Array.from({ length: 7 }, (_, i) => ({
    day: format(subDays(new Date(), 6 - i), "EEE"),
    applications: Math.floor(Math.random() * 20) + 2,
    replies: Math.floor(Math.random() * 5),
  }));

const generateMonthlyData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: format(new Date(2024, i, 1), "MMM"),
    applications: Math.floor(Math.random() * 80) + 10,
    replies: Math.floor(Math.random() * 20) + 2,
  }));

const weeklyData = generateWeeklyData();
const monthlyData = generateMonthlyData();

const STATUS_COLORS: Record<string, string> = {
  sent: "#3b82f6",
  replied: "#22c55e",
  interview: "#a855f7",
  rejected: "#ef4444",
  ghosted: "#f59e0b",
  draft: "#6b7280",
};

function StatCard({ label, value, icon: Icon, color = "text-primary", description }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10">
            <Icon className={"h-5 w-5 " + color} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: applicationsData } = trpc.applications.list.useQuery({ limit: 5 });
  const { data: logs } = trpc.activityLogs.list.useQuery({ limit: 8 });
  const [, setLocation] = useLocation();
  const applications = applicationsData ?? [];

  const statusDistribution = [
    { name: "Sent", value: stats?.pending ?? 0, color: STATUS_COLORS.sent },
    { name: "Replied", value: stats?.replies ?? 0, color: STATUS_COLORS.replied },
    { name: "Interview", value: stats?.interviews ?? 0, color: STATUS_COLORS.interview },
    { name: "Rejected", value: stats?.rejected ?? 0, color: STATUS_COLORS.rejected },
  ].filter(s => s.value > 0);

  const statCards = [
    { label: "Total Applications", value: stats?.totalApplications ?? 0, icon: Mail, color: "text-blue-500", description: "All time" },
    { label: "Today", value: stats?.todayApplications ?? 0, icon: Calendar, color: "text-purple-500", description: "Sent today" },
    { label: "This Week", value: stats?.weekApplications ?? 0, icon: Zap, color: "text-amber-500", description: "Last 7 days" },
    { label: "This Month", value: stats?.monthApplications ?? 0, icon: TrendingUp, color: "text-green-500", description: "Current month" },
    { label: "Replies", value: stats?.replies ?? 0, icon: MessageSquare, color: "text-green-500", description: "Responses received" },
    { label: "Interviews", value: stats?.interviews ?? 0, icon: CheckCircle, color: "text-purple-500", description: "Scheduled" },
    { label: "Rejected", value: stats?.rejected ?? 0, icon: XCircle, color: "text-red-500", description: "Declined" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-500", description: "Awaiting response" },
  ];

  const responseRate = parseFloat(stats?.responseRate ?? "0");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")} &middot; Your job search overview</p>
        </div>
        <Button onClick={() => setLocation("/compose")} className="gap-2">
          <Send className="h-4 w-4" />Compose Mail
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Response Rate</CardTitle>
            <CardDescription>Replies + Interviews / Total</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-3">
                <div className="text-4xl font-bold text-primary">{responseRate}%</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: Math.min(responseRate, 100) + "%" }} />
                </div>
                <p className="text-xs text-muted-foreground">{stats?.replies ?? 0} replies out of {stats?.totalApplications ?? 0} sent</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Application Status</CardTitle>
            <CardDescription>Distribution by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32 w-full" /> : statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {statusDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No applications yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Weekly Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} fill="url(#colorApps)" name="Applications" />
                <Area type="monotone" dataKey="replies" stroke="#22c55e" strokeWidth={2} fill="none" name="Replies" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="applications" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Applications" />
                <Bar dataKey="replies" fill="#22c55e" radius={[3, 3, 0, 0]} name="Replies" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Applications</CardTitle>
              <CardDescription>Latest submissions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setLocation("/applications")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {applications.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {applications.map((app: any) => (
                  <div key={app.id} className="px-6 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{app.hrEmail}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.subject}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">{app.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
              <CardDescription>Recent actions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setLocation("/activity")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {!logs || logs.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {logs.map((log: any) => (
                  <div key={log.id} className="px-6 py-3 flex items-start gap-3 hover:bg-accent/30 transition-colors">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.createdAt ? format(new Date(log.createdAt), "MMM d, h:mm a") : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Send, label: "Compose Mail", path: "/compose", color: "text-blue-500" },
          { icon: Briefcase, label: "Applications", path: "/applications", color: "text-purple-500" },
          { icon: Building2, label: "Companies", path: "/companies", color: "text-amber-500" },
          { icon: FileText, label: "Templates", path: "/templates", color: "text-green-500" },
        ].map((action) => (
          <Card key={action.path} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => setLocation(action.path)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <action.icon className={"h-4 w-4 " + action.color} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
