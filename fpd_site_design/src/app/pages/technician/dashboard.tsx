import { Link } from "react-router";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/status-badge";

const todaysJobs = [
  { id: "1", customer: "Smith Residence", address: "123 Oak St", time: "9:00 AM", status: "assigned" as const },
  { id: "2", customer: "ABC Office Building", address: "456 Pine Ave", time: "11:30 AM", status: "in-progress" as const },
  { id: "3", customer: "Johnson Home", address: "789 Maple Dr", time: "2:00 PM", status: "assigned" as const },
];

const recentEquipment = [
  { id: "1", manufacturer: "Carrier", model: "24ACC636", location: "Smith Residence" },
  { id: "2", manufacturer: "Trane", model: "XR16", location: "ABC Office" },
];

export function TechnicianDashboard() {
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Yellow Accent Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary to-accent p-4 rounded-lg shadow-md border-2 border-black mb-6">
        <h1 className="text-2xl font-bold text-black mb-1">Good morning, Mike</h1>
        <p className="text-black/80 font-medium">You have 3 jobs scheduled today</p>
      </div>
      
      {/* Quick Start Button */}
      <Link to="/technician/jobs">
        <Button size="lg" className="w-full h-14 text-lg">
          <Plus className="h-6 w-6" />
          Start New Job
        </Button>
      </Link>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-semibold">2</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold">1</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-semibold">8</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysJobs.map((job) => (
            <Link key={job.id} to={`/technician/jobs/${job.id}`}>
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{job.customer}</p>
                    <p className="text-sm text-muted-foreground">{job.address}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.time}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
      
      {/* Recent Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentEquipment.map((equipment) => (
            <Link key={equipment.id} to={`/technician/equipment/${equipment.id}`}>
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                <p className="font-semibold">{equipment.manufacturer} {equipment.model}</p>
                <p className="text-sm text-muted-foreground">{equipment.location}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}