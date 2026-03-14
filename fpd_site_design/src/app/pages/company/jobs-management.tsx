import { useState } from "react";
import { Search, Filter, Calendar } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { StatusBadge, JobStatus } from "../../components/status-badge";
import { Button } from "../../components/ui/button";

const jobs = [
  { id: "J-1001", customer: "Smith Residence", site: "123 Oak St", equipment: "Carrier AC", technician: "Mike Johnson", status: "in-progress" as JobStatus, scheduled: "9:00 AM" },
  { id: "J-1002", customer: "ABC Office Building", site: "456 Pine Ave", equipment: "Trane Heat Pump", technician: "Sarah Lee", status: "completed" as JobStatus, scheduled: "11:30 AM" },
  { id: "J-1003", customer: "Johnson Home", site: "789 Maple Dr", equipment: "Lennox Furnace", technician: "David Chen", status: "assigned" as JobStatus, scheduled: "2:00 PM" },
  { id: "J-1004", customer: "Downtown Restaurant", site: "321 Main St", equipment: "York Package Unit", technician: "Mike Johnson", status: "completed" as JobStatus, scheduled: "8:00 AM" },
  { id: "J-1005", customer: "Tech Startup HQ", site: "555 Innovation Blvd", equipment: "Carrier VRF", technician: "Sarah Lee", status: "assigned" as JobStatus, scheduled: "3:30 PM" },
  { id: "J-1006", customer: "Medical Clinic", site: "888 Health Plaza", equipment: "Daikin Split", technician: "David Chen", status: "in-progress" as JobStatus, scheduled: "10:00 AM" },
];

export function JobsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Jobs Management</h1>
        <p className="text-muted-foreground">View and manage all service jobs</p>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search jobs, customers, or sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="md">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="md">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
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
            onClick={() => setStatusFilter("assigned")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "assigned"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setStatusFilter("in-progress")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "in-progress"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === "completed"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Completed
          </button>
        </div>
      </Card>
      
      {/* Jobs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Job ID</th>
                <th className="text-left p-4 font-semibold text-sm">Customer</th>
                <th className="text-left p-4 font-semibold text-sm">Site</th>
                <th className="text-left p-4 font-semibold text-sm">Equipment</th>
                <th className="text-left p-4 font-semibold text-sm">Technician</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-primary">{job.id}</span>
                  </td>
                  <td className="p-4">{job.customer}</td>
                  <td className="p-4 text-muted-foreground text-sm">{job.site}</td>
                  <td className="p-4 text-sm">{job.equipment}</td>
                  <td className="p-4 text-sm">{job.technician}</td>
                  <td className="p-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{job.scheduled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs found matching your criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}
