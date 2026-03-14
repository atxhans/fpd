import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { User, CheckCircle, Clock, TrendingUp } from "lucide-react";

const technicians = [
  { 
    id: "1", 
    name: "Mike Johnson", 
    status: "active" as const, 
    jobsToday: 3, 
    jobsCompleted: 142, 
    avgCompletionTime: "2.5 hrs",
    rating: 4.8
  },
  { 
    id: "2", 
    name: "Sarah Lee", 
    status: "active" as const, 
    jobsToday: 2, 
    jobsCompleted: 128, 
    avgCompletionTime: "2.2 hrs",
    rating: 4.9
  },
  { 
    id: "3", 
    name: "David Chen", 
    status: "active" as const, 
    jobsToday: 2, 
    jobsCompleted: 156, 
    avgCompletionTime: "2.8 hrs",
    rating: 4.7
  },
  { 
    id: "4", 
    name: "Emily Rodriguez", 
    status: "active" as const, 
    jobsToday: 1, 
    jobsCompleted: 98, 
    avgCompletionTime: "2.4 hrs",
    rating: 4.9
  },
];

export function TechnicianManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Technician Management</h1>
        <p className="text-muted-foreground">Monitor technician performance and activity</p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Technicians</p>
                <p className="text-3xl font-semibold">8</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Now</p>
                <p className="text-3xl font-semibold text-success">4</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Completion</p>
                <p className="text-3xl font-semibold">2.5h</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-3xl font-semibold">94</p>
                <p className="text-sm text-success">+12%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Technician Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {technicians.map((tech) => (
          <Card key={tech.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{tech.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success">Active</Badge>
                      <span className="text-sm text-muted-foreground">Rating: {tech.rating}/5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jobs Today</p>
                  <p className="text-2xl font-semibold">{tech.jobsToday}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Completed</p>
                  <p className="text-2xl font-semibold">{tech.jobsCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Time</p>
                  <p className="text-2xl font-semibold">{tech.avgCompletionTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
