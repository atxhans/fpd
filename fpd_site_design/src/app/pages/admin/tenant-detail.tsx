import { useParams } from "react-router";
import { Building2, Users, Briefcase, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/status-badge";
import { Badge } from "../../components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const usageData = [
  { date: "Mar 6", jobs: 15, readings: 89 },
  { date: "Mar 7", jobs: 18, readings: 102 },
  { date: "Mar 8", jobs: 22, readings: 124 },
  { date: "Mar 9", jobs: 19, readings: 98 },
  { date: "Mar 10", jobs: 21, readings: 115 },
  { date: "Mar 11", jobs: 24, readings: 132 },
  { date: "Mar 12", jobs: 26, readings: 145 },
];

const technicians = [
  { id: "1", name: "Mike Johnson", email: "mike@abchvac.com", status: "active", jobsCompleted: 142 },
  { id: "2", name: "Sarah Lee", email: "sarah@abchvac.com", status: "active", jobsCompleted: 128 },
  { id: "3", name: "David Chen", email: "david@abchvac.com", status: "active", jobsCompleted: 156 },
];

const recentJobs = [
  { id: "J-1001", customer: "Smith Residence", technician: "Mike Johnson", status: "completed", date: "2h ago" },
  { id: "J-1002", customer: "ABC Office", technician: "Sarah Lee", status: "in-progress", date: "3h ago" },
  { id: "J-1003", customer: "Downtown Restaurant", technician: "David Chen", status: "completed", date: "5h ago" },
];

export function TenantDetail() {
  const { tenantId } = useParams();
  
  const tenant = {
    id: tenantId,
    name: "ABC HVAC Services",
    status: "active" as const,
    plan: "Professional",
    technicianCount: 12,
    createdDate: "January 15, 2024",
    lastActivity: "2 minutes ago",
    email: "admin@abchvac.com",
    phone: "(555) 123-4567",
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">{tenant.name}</h1>
          <p className="text-muted-foreground">Tenant ID: {tenant.id}</p>
        </div>
        <StatusBadge status={tenant.status} />
      </div>
      
      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan</p>
              <Badge variant="outline">{tenant.plan}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{tenant.createdDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Contact Email</p>
              <p className="font-medium">{tenant.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">{tenant.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Technicians</p>
                <p className="text-3xl font-semibold">{tenant.technicianCount}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Jobs (30d)</p>
                <p className="text-3xl font-semibold">145</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Readings</p>
                <p className="text-3xl font-semibold">1,245</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Active</p>
                <p className="text-lg font-semibold">{tenant.lastActivity}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
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
              <Line type="monotone" dataKey="jobs" stroke="hsl(var(--primary))" strokeWidth={2} name="Jobs" />
              <Line type="monotone" dataKey="readings" stroke="hsl(var(--success))" strokeWidth={2} name="Readings" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Technician Roster */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-sm">Name</th>
                  <th className="text-left p-3 font-semibold text-sm">Email</th>
                  <th className="text-left p-3 font-semibold text-sm">Status</th>
                  <th className="text-left p-3 font-semibold text-sm">Jobs Completed</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.id} className="border-b border-border">
                    <td className="p-3 font-medium">{tech.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{tech.email}</td>
                    <td className="p-3">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="p-3 text-sm">{tech.jobsCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{job.id} - {job.customer}</p>
                  <p className="text-sm text-muted-foreground">{job.technician} • {job.date}</p>
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
