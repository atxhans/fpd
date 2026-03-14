import { useParams } from "react-router";
import { Wrench, Calendar, MapPin, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const serviceHistory = [
  { id: "1", date: "Mar 5, 2026", technician: "Mike Johnson", type: "Routine Maintenance", notes: "Cleaned coils, checked refrigerant levels" },
  { id: "2", date: "Dec 15, 2025", technician: "Sarah Lee", type: "Repair", notes: "Replaced capacitor, system cooling properly" },
  { id: "3", date: "Sep 8, 2025", technician: "Mike Johnson", type: "Routine Maintenance", notes: "Annual inspection, all systems normal" },
];

export function EquipmentDetail() {
  const { equipmentId } = useParams();
  
  const equipment = {
    id: equipmentId,
    type: "Air Conditioner",
    manufacturer: "Carrier",
    model: "24ACC636",
    serial: "5678ABCD1234",
    installDate: "June 15, 2022",
    location: "Smith Residence",
    address: "123 Oak St, Springfield, IL",
  };
  
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{equipment.manufacturer} {equipment.model}</h1>
        <p className="text-muted-foreground">{equipment.type}</p>
      </div>
      
      {/* Equipment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Manufacturer</p>
              <p className="font-medium">{equipment.manufacturer}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Model</p>
              <p className="font-medium">{equipment.model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Serial Number</p>
              <p className="font-medium">{equipment.serial}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Install Date</p>
              <p className="font-medium">{equipment.installDate}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{equipment.location}</p>
                <p className="text-sm text-muted-foreground">{equipment.address}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Service History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Service History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceHistory.map((service, index) => (
              <div key={service.id} className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0 last:pb-0">
                <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                <div className="mb-1">
                  <p className="font-medium">{service.type}</p>
                  <p className="text-sm text-muted-foreground">{service.date} • {service.technician}</p>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{service.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
