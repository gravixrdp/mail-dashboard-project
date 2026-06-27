import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Mail, MessageSquare, CheckCircle, XCircle, Percent } from "lucide-react";

const COLORS = ["#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#E5E5E5"];

export default function Analytics() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: dailyData, isLoading: dailyLoading } = trpc.dashboard.dailyData.useQuery();
  const { data: monthlyData, isLoading: monthlyLoading } = trpc.dashboard.monthlyData.useQuery();
  const { data: topDomains, isLoading: domainsLoading } = trpc.dashboard.topDomains.useQuery();

  const metricCards = [
    { label: "Total Applications", value: stats?.totalApplications ?? 0, icon: Mail, color: "text-black dark:text-white" },
    { label: "Replies", value: stats?.replies ?? 0, icon: MessageSquare, color: "text-black dark:text-white" },
    { label: "Interviews", value: stats?.interviews ?? 0, icon: CheckCircle, color: "text-black dark:text-white" },
    { label: "Rejected", value: stats?.rejected ?? 0, icon: XCircle, color: "text-black dark:text-white" },
    { label: "Response Rate", value: (stats?.responseRate ?? "0") + "%", icon: Percent, color: "text-black dark:text-white" },
    { label: "This Month", value: stats?.monthApplications ?? 0, icon: TrendingUp, color: "text-black dark:text-white" },
  ];

  const statusData = [
    { name: "Sent/Pending", value: stats?.pending ?? 0 },
    { name: "Replied", value: stats?.replies ?? 0 },
    { name: "Interview", value: stats?.interviews ?? 0 },
    { name: "Rejected", value: stats?.rejected ?? 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Insights into your job search performance</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
            ))
          : metricCards.map((card) => (
              <Card key={card.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <card.icon className={"h-4 w-4 " + card.color} />
                    <div>
                      <p className="text-xl font-bold">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Daily Applications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Daily Applications (Last 30 Days)</CardTitle>
          <CardDescription>Applications sent per day</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="applications" stroke="#000000" strokeWidth={2} fill="url(#colorDaily)" name="Applications" />
                <Area type="monotone" dataKey="replies" stroke="#666666" strokeWidth={2} fill="none" name="Replies" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="applications" fill="#000000" radius={[3, 3, 0, 0]} name="Applications" />
                  <Bar dataKey="replies" fill="#666666" radius={[3, 3, 0, 0]} name="Replies" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Response Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="replies" stroke="#000000" strokeWidth={2} dot={false} name="Replies" />
                  <Line type="monotone" dataKey="interviews" stroke="#666666" strokeWidth={2} dot={false} name="Interviews" />
                  <Line type="monotone" dataKey="rejections" stroke="#999999" strokeWidth={2} dot={false} name="Rejections" />
                  <Legend iconSize={8} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution + Top Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Email Domains</CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topDomains ?? []} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
