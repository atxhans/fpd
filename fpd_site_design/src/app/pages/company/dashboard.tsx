import { Briefcase, Users, Wrench, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { MetricCard } from "../../components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/status-badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const activityData = [
  { date: "Mon", jobs: 12 },
  { date: "Tue", jobs: 15 },
  { date: "Wed", jobs: 18 },
  { date: "Thu", jobs: 14 },
  { date: "Fri", jobs: 22 },
  { date: "Sat", jobs: 8 },
  { date: "Sun", jobs: 5 },
];

const issueData = [
  { issue: "Low Refrigerant", count: 28 },
  { issue: "Airflow Restriction", count: 22 },
  { issue: "Compressor Issue", count: 15 },
  { issue: "Electrical", count: 12 },
  { issue: "Thermostat", count: 8 },
];

const recentJobs = [
  { id: "1", customer: "Smith Residence", technician: "Mike Johnson", status: "in-progress" as const, time: "2h ago" },
  { id: "2", customer: "ABC Office", technician: "Sarah Lee", status: "completed" as const, time: "3h ago" },
  { id: "3", customer: "Downtown Restaurant", technician: "Mike Johnson", status: "completed" as const, time: "4h ago" },
  { id: "4", customer: "Tech Startup HQ", technician: "David Chen", status: "assigned" as const, time: "5h ago" },
];

export function CompanyDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Yellow Accent Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary to-accent p-6 rounded-lg shadow-md border-2 border-black">
        <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-black/80 font-medium">Welcome back! Here's what's happening today.</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Open Jobs"
          value={24}
          icon={Briefcase}
          trend={{ value: "+12% from last week", isPositive: true }}
        />
        <MetricCard
          title="Active Technicians"
          value={8}
          icon={Users}
          trend={{ value: "2 on break", isPositive: false }}
        />
        <MetricCard
          title="Units Serviced Today"
          value={47}
          icon={Wrench}
          trend={{ value: "+8% from yesterday", isPositive: true }}
        />
        <MetricCard
          title="Follow-ups Needed"
          value={6}
          icon={AlertCircle}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Service Activity (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
                <Line type="monotone" dataKey="jobs" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Recurring Issues Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Issues (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="issue" width={150} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold">{job.customer}</p>
                  <p className="text-sm text-muted-foreground">{job.technician} • {job.time}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}