import { Link, useParams } from "react-router";
import { MapPin, Phone, Clock, Wrench, Camera, Play, Pause, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/status-badge";

export function JobDetail() {
  const { jobId } = useParams();
  
  // Mock data
  const job = {
    id: jobId,
    customer: "Smith Residence",
    address: "123 Oak St, Springfield, IL 62701",
    phone: "(555) 123-4567",
    scheduledTime: "9:00 AM - 11:00 AM",
    status: "in-progress" as const,
    problem: "AC not cooling properly, warm air from vents",
    equipment: [
      { id: "1", type: "Air Conditioner", manufacturer: "Carrier", model: "24ACC636", serial: "5678ABCD1234" },
    ],
  };
  
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{job.customer}</h1>
          <p className="text-muted-foreground">Job #{job.id}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>
      
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Site Address</p>
              <p className="text-sm text-muted-foreground">{job.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Contact</p>
              <p className="text-sm text-muted-foreground">{job.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Scheduled</p>
              <p className="text-sm text-muted-foreground">{job.scheduledTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Problem Description */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{job.problem}</p>
        </CardContent>
      </Card>
      
      {/* Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {job.equipment.map((item) => (
            <Link key={item.id} to={`/technician/equipment/${item.id}`}>
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{item.type}</p>
                    <p className="text-sm text-muted-foreground">{item.manufacturer} {item.model}</p>
                  </div>
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Serial: {item.serial}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Job Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to={`/technician/jobs/${jobId}/measurements`}>
            <Button variant="primary" size="lg" className="w-full h-14">
              <Wrench className="h-5 w-5" />
              Capture Measurements
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full h-14">
            <Camera className="h-5 w-5" />
            Add Photos
          </Button>
        </CardContent>
      </Card>
      
      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 md:hidden">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Button variant="secondary" size="lg" className="flex-1">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
          <Button variant="success" size="lg" className="flex-1">
            <CheckCircle className="h-5 w-5" />
            Complete Job
          </Button>
        </div>
      </div>
    </div>
  );
}
