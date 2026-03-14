import { Building2, Users, Briefcase, Activity, HeadphonesIcon } from "lucide-react";
import { MetricCard } from "../../components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBadge } from "../../components/status-badge";

const platformActivityData = [
  { date: "Mar 6", tenants: 45, jobs: 234, readings: 1456 },
  { date: "Mar 7", tenants: 46, jobs: 289, readings: 1702 },
  { date: "Mar 8", tenants: 47, jobs: 312, readings: 1889 },
  { date: "Mar 9", tenants: 47, jobs: 267, readings: 1623 },
  { date: "Mar 10", tenants: 48, jobs: 298, readings: 1756 },
  { date: "Mar 11", tenants: 49, jobs: 334, readings: 1945 },
  { date: "Mar 12", tenants: 50, jobs: 356, readings: 2103 },
];

const tenantActivityData = [
  { name: "ABC HVAC Services", jobs: 45 },
  { name: "CoolTech Solutions", jobs: 38 },
  { name: "Climate Control Pro", jobs: 32 },
  { name: "Air Masters Inc", jobs: 28 },
  { name: "Premier HVAC", jobs: 24 },
];

const recentTenants = [
  { id: "1", name: "ABC HVAC Services", status: "active" as const, technicians: 12, plan: "Professional", activity: "2m ago" },
  { id: "2", name: "CoolTech Solutions", status: "active" as const, technicians: 8, plan: "Business", activity: "15m ago" },
  { id: "3", name: "Climate Control Pro", status: "trial" as const, technicians: 3, plan: "Trial", activity: "1h ago" },
];

export function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Yellow Accent Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary to-accent p-6 rounded-lg shadow-md border-2 border-black">
        <h1 className="text-3xl font-bold text-black mb-2">Platform Dashboard</h1>
        <p className="text-black/80 font-medium">Fieldpiece Digital platform overview and metrics</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Active Tenants"
          value={50}
          icon={Building2}
          trend={{ value: "+2 this week", isPositive: true }}
        />
        <MetricCard
          title="Active Technicians"
          value={342}
          icon={Users}
          trend={{ value: "+18 this week", isPositive: true }}
        />
        <MetricCard
          title="Jobs Today"
          value={356}
          icon={Briefcase}
          trend={{ value: "+12% vs yesterday", isPositive: true }}
        />
        <MetricCard
          title="Readings Submitted"
          value="2,103"
          icon={Activity}
          trend={{ value: "+8% vs yesterday", isPositive: true }}
        />
        <MetricCard
          title="Support Tickets"
          value={12}
          icon={HeadphonesIcon}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformActivityData}>
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
                <Line type="monotone" dataKey="jobs" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Jobs" />
                <Line type="monotone" dataKey="readings" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Readings" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Most Active Tenants (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenantActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }} 
                />
                <Bar dataKey="jobs" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Tenant Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tenant Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">{tenant.technicians} technicians • {tenant.plan}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{tenant.activity}</span>
                  <StatusBadge status={tenant.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}