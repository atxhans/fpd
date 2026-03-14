import { useState } from "react";
import { Search, Filter, Calendar, User, Activity } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

const auditLogs = [
  { id: "1", timestamp: "2026-03-12 14:32:15", user: "admin@fieldpiece.com", tenant: "ABC HVAC Services", action: "user.created", details: "Created user Mike Johnson", ipAddress: "192.168.1.1" },
  { id: "2", timestamp: "2026-03-12 14:28:43", user: "mike@abchvac.com", tenant: "ABC HVAC Services", action: "job.completed", details: "Completed job J-1001", ipAddress: "10.0.0.45" },
  { id: "3", timestamp: "2026-03-12 14:15:22", user: "admin@fieldpiece.com", tenant: "CoolTech Solutions", action: "tenant.updated", details: "Updated plan to Enterprise", ipAddress: "192.168.1.1" },
  { id: "4", timestamp: "2026-03-12 13:58:11", user: "sarah@cooltech.com", tenant: "CoolTech Solutions", action: "measurement.created", details: "Added measurements for equipment E-102", ipAddress: "10.0.0.78" },
  { id: "5", timestamp: "2026-03-12 13:45:30", user: "admin@fieldpiece.com", tenant: "Climate Control Pro", action: "tenant.suspended", details: "Suspended tenant for non-payment", ipAddress: "192.168.1.1" },
  { id: "6", timestamp: "2026-03-12 13:22:18", user: "david@climate.com", tenant: "Climate Control Pro", action: "job.started", details: "Started job J-1003", ipAddress: "10.0.0.92" },
  { id: "7", timestamp: "2026-03-12 12:58:45", user: "admin@fieldpiece.com", tenant: "System", action: "feature.enabled", details: "Enabled AI diagnostics globally", ipAddress: "192.168.1.1" },
  { id: "8", timestamp: "2026-03-12 12:34:12", user: "support@fieldpiece.com", tenant: "Air Masters Inc", action: "user.password_reset", details: "Reset password for tech@airmasters.com", ipAddress: "192.168.1.5" },
];

const actionTypes = [
  "user.created",
  "user.updated",
  "user.deleted",
  "user.password_reset",
  "job.created",
  "job.started",
  "job.completed",
  "tenant.created",
  "tenant.updated",
  "tenant.suspended",
  "feature.enabled",
  "feature.disabled",
  "measurement.created",
];

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });
  
  const getActionBadgeVariant = (action: string) => {
    if (action.includes("created")) return "success";
    if (action.includes("deleted") || action.includes("suspended")) return "danger";
    if (action.includes("updated")) return "warning";
    return "default";
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">System-wide audit trail of all platform activities</p>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search logs by user, tenant, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="md">
              <Filter className="h-4 w-4" />
              Advanced
            </Button>
            <Button variant="outline" size="md">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="text-sm font-medium mb-2 block">Action Type</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-64 h-10 px-3 rounded-lg border border-input bg-input-background text-sm"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </Card>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Events</p>
                <p className="text-2xl font-semibold">2,456</p>
              </div>
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Today</p>
                <p className="text-2xl font-semibold">156</p>
              </div>
              <Calendar className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                <p className="text-2xl font-semibold">342</p>
              </div>
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Critical Events</p>
                <p className="text-2xl font-semibold">3</p>
              </div>
              <Filter className="h-6 w-6 text-warning" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold">Timestamp</th>
                <th className="text-left p-3 font-semibold">User</th>
                <th className="text-left p-3 font-semibold">Tenant</th>
                <th className="text-left p-3 font-semibold">Action</th>
                <th className="text-left p-3 font-semibold">Details</th>
                <th className="text-left p-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 font-medium">{log.user}</td>
                  <td className="p-3">{log.tenant}</td>
                  <td className="p-3">
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{log.details}</td>
                  <td className="p-3 text-muted-foreground font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No audit logs found matching your criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}
