import { useState } from "react";
import { Search, User, Building2, Briefcase, Wrench, AlertCircle } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

const supportCases = [
  { id: "S-001", tenant: "ABC HVAC Services", type: "Technical", priority: "high", subject: "Mobile app sync issue", status: "open", created: "2h ago" },
  { id: "S-002", tenant: "CoolTech Solutions", type: "Billing", priority: "medium", subject: "Invoice inquiry", status: "in-progress", created: "5h ago" },
  { id: "S-003", tenant: "Climate Control Pro", type: "Account", priority: "low", subject: "Add new users", status: "resolved", created: "1d ago" },
];

const searchResults = [
  {
    type: "tenant",
    name: "ABC HVAC Services",
    id: "T-1001",
    info: "12 technicians • Professional Plan"
  },
  {
    type: "user",
    name: "Mike Johnson",
    id: "U-5432",
    info: "ABC HVAC Services • Technician"
  },
  {
    type: "job",
    name: "Job #J-1001",
    id: "J-1001",
    info: "Smith Residence • In Progress"
  }
];

export function SupportConsole() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Support Console</h1>
        <p className="text-muted-foreground">Search and manage support activities across the platform</p>
      </div>
      
      {/* Global Search */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Global Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for tenant, job, equipment, or technician..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            className="pl-10 h-12 text-lg"
          />
        </div>
        
        {/* Search Results */}
        {showResults && (
          <div className="mt-4 space-y-2">
            {searchResults.map((result, index) => (
              <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  {result.type === "tenant" && <Building2 className="h-5 w-5 text-primary mt-0.5" />}
                  {result.type === "user" && <User className="h-5 w-5 text-primary mt-0.5" />}
                  {result.type === "job" && <Briefcase className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <p className="font-semibold">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.info}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">{result.id}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <Building2 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Impersonate Tenant</h3>
            <p className="text-sm text-muted-foreground mb-4">View platform as a specific tenant</p>
            <Button variant="outline" size="sm" className="w-full">
              Start Impersonation
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <User className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Reset User Access</h3>
            <p className="text-sm text-muted-foreground mb-4">Reset password or session</p>
            <Button variant="outline" size="sm" className="w-full">
              Reset Access
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Wrench className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Feature Flags</h3>
            <p className="text-sm text-muted-foreground mb-4">Manage platform features</p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Flags
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Active Support Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Active Support Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-sm">Case ID</th>
                  <th className="text-left p-3 font-semibold text-sm">Tenant</th>
                  <th className="text-left p-3 font-semibold text-sm">Type</th>
                  <th className="text-left p-3 font-semibold text-sm">Priority</th>
                  <th className="text-left p-3 font-semibold text-sm">Subject</th>
                  <th className="text-left p-3 font-semibold text-sm">Status</th>
                  <th className="text-left p-3 font-semibold text-sm">Created</th>
                </tr>
              </thead>
              <tbody>
                {supportCases.map((supportCase) => (
                  <tr key={supportCase.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-primary">{supportCase.id}</span>
                    </td>
                    <td className="p-3 text-sm">{supportCase.tenant}</td>
                    <td className="p-3">
                      <Badge variant="outline">{supportCase.type}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={supportCase.priority === "high" ? "danger" : supportCase.priority === "medium" ? "warning" : "muted"}>
                        {supportCase.priority}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{supportCase.subject}</td>
                    <td className="p-3">
                      <Badge variant={supportCase.status === "resolved" ? "success" : supportCase.status === "in-progress" ? "warning" : "default"}>
                        {supportCase.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{supportCase.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Impersonation Banner (Example) */}
      <Card className="border-warning bg-warning/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-warning" />
              <div>
                <p className="font-semibold text-warning">You are currently impersonating</p>
                <p className="text-sm text-muted-foreground">ABC HVAC Services (T-1001) • Mike Johnson (U-5432)</p>
              </div>
            </div>
            <Button variant="danger" size="sm">
              End Impersonation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
