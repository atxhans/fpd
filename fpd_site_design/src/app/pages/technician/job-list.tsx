import { useState } from "react";
import { Link } from "react-router";
import { Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { StatusBadge, JobStatus } from "../../components/status-badge";

const allJobs = [
  { id: "1", customer: "Smith Residence", address: "123 Oak St", time: "9:00 AM", status: "assigned" as JobStatus, equipment: "Carrier AC Unit" },
  { id: "2", customer: "ABC Office Building", address: "456 Pine Ave", time: "11:30 AM", status: "in-progress" as JobStatus, equipment: "Trane Heat Pump" },
  { id: "3", customer: "Johnson Home", address: "789 Maple Dr", time: "2:00 PM", status: "assigned" as JobStatus, equipment: "Lennox Furnace" },
  { id: "4", customer: "Downtown Restaurant", address: "321 Main St", time: "Yesterday", status: "completed" as JobStatus, equipment: "York Package Unit" },
  { id: "5", customer: "Tech Startup HQ", address: "555 Innovation Blvd", time: "2 days ago", status: "completed" as JobStatus, equipment: "Carrier VRF System" },
];

export function JobList() {
  const [filter, setFilter] = useState<"all" | JobStatus>("all");
  
  const filteredJobs = filter === "all" 
    ? allJobs 
    : allJobs.filter(job => job.status === filter);
  
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">My Jobs</h1>
        <p className="text-muted-foreground">{filteredJobs.length} jobs</p>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          All Jobs
        </button>
        <button
          onClick={() => setFilter("assigned")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
            filter === "assigned"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Assigned
        </button>
        <button
          onClick={() => setFilter("in-progress")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
            filter === "in-progress"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
            filter === "completed"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Completed
        </button>
      </div>
      
      {/* Job Cards */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <Link key={job.id} to={`/technician/jobs/${job.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{job.customer}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{job.equipment}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {job.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {job.time}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
