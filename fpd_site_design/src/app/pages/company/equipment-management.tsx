import { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { Link } from "react-router";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const equipment = [
  { id: "E-101", manufacturer: "Carrier", model: "24ACC636", customer: "Smith Residence", installDate: "Jun 15, 2022", lastService: "Mar 5, 2026", issueCount: 2 },
  { id: "E-102", manufacturer: "Trane", model: "XR16", customer: "ABC Office", installDate: "Jan 10, 2021", lastService: "Mar 8, 2026", issueCount: 5 },
  { id: "E-103", manufacturer: "Lennox", model: "EL296V", customer: "Johnson Home", installDate: "Sep 20, 2023", lastService: "Feb 28, 2026", issueCount: 1 },
  { id: "E-104", manufacturer: "York", model: "YXV", customer: "Downtown Restaurant", installDate: "Mar 5, 2020", lastService: "Mar 10, 2026", issueCount: 8 },
  { id: "E-105", manufacturer: "Carrier", model: "VRF-180", customer: "Tech Startup HQ", installDate: "Nov 1, 2022", lastService: "Mar 7, 2026", issueCount: 3 },
  { id: "E-106", manufacturer: "Daikin", model: "FTKN12", customer: "Medical Clinic", installDate: "Apr 12, 2023", lastService: "Mar 6, 2026", issueCount: 1 },
];

export function EquipmentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredEquipment = equipment.filter(item => {
    return item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.id.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Equipment Management</h1>
        <p className="text-muted-foreground">Track and manage all HVAC equipment</p>
      </div>
      
      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search equipment by manufacturer, model, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>
      
      {/* Equipment Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-sm">Equipment ID</th>
                <th className="text-left p-4 font-semibold text-sm">Manufacturer</th>
                <th className="text-left p-4 font-semibold text-sm">Model</th>
                <th className="text-left p-4 font-semibold text-sm">Customer</th>
                <th className="text-left p-4 font-semibold text-sm">Install Date</th>
                <th className="text-left p-4 font-semibold text-sm">Last Service</th>
                <th className="text-left p-4 font-semibold text-sm">Issue Frequency</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <Link to={`/company/equipment/${item.id}`} className="font-medium text-primary hover:underline">
                      {item.id}
                    </Link>
                  </td>
                  <td className="p-4 font-medium">{item.manufacturer}</td>
                  <td className="p-4">{item.model}</td>
                  <td className="p-4 text-sm">{item.customer}</td>
                  <td className="p-4 text-sm text-muted-foreground">{item.installDate}</td>
                  <td className="p-4 text-sm text-muted-foreground">{item.lastService}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {item.issueCount >= 5 && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <Badge variant={item.issueCount >= 5 ? "warning" : "muted"}>
                        {item.issueCount} issues
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEquipment.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No equipment found matching your search</p>
          </div>
        )}
      </Card>
    </div>
  );
}
