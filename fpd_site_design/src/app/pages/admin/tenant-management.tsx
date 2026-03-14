import { useState } from "react";
import { Search, Building2 } from "lucide-react";
import { Link } from "react-router";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { StatusBadge, TenantStatus } from "../../components/status-badge";
import { Badge } from "../../components/ui/badge";

const tenants = [
  { id: "T-1001", name: "ABC HVAC Services", technicians: 12, status: "active" as TenantStatus, plan: "Professional", lastActivity: "2m ago", jobs: 145 },
  { id: "T-1002", name: "CoolTech Solutions", technicians: 8, status: "active" as TenantStatus, plan: "Business", lastActivity: "15m ago", jobs: 98 },
  { id: "T-1003", name: "Climate Control Pro", technicians: 3, status: "trial" as TenantStatus, plan: "Trial", lastActivity: "1h ago", jobs: 23 },
  { id: "T-1004", name: "Air Masters Inc", technicians: 15, status: "active" as TenantStatus, plan: "Enterprise", lastActivity: "5m ago", jobs: 234 },
  { id: "T-1005", name: "Premier HVAC", technicians: 6, status: "active" as TenantStatus, plan: "Professional", lastActivity: "30m ago", jobs: 76 },
  { id: "T-1006", name: "QuickFix Climate", technicians: 2, status: "suspended" as TenantStatus, plan: "Business", lastActivity: "2d ago", jobs: 12 },
];

export function TenantManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TenantStatus>("all");
  
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Tenant Management</h1>
        <p className="text-muted-foreground">Manage all tenant accounts and subscriptions</p>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tenants by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("trial")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "trial"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Trial
          </button>
          <button
            onClick={() => setStatusFilter("suspended")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "suspended"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Suspended
          </button>
        </div>
      </Card>
      
      {/* Tenants Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Tenant ID</th>
                <th className="text-left p-4 font-semibold text-sm">Company Name</th>
                <th className="text-left p-4 font-semibold text-sm">Technicians</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Plan</th>
                <th className="text-left p-4 font-semibold text-sm">Jobs (30d)</th>
                <th className="text-left p-4 font-semibold text-sm">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <Link to={`/admin/tenants/${tenant.id}`} className="font-medium text-primary hover:underline">
                      {tenant.id}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{tenant.technicians}</td>
                  <td className="p-4">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{tenant.plan}</Badge>
                  </td>
                  <td className="p-4 text-sm font-medium">{tenant.jobs}</td>
                  <td className="p-4 text-sm text-muted-foreground">{tenant.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tenants found matching your criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}
