import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Save, AlertTriangle, ThermometerSun, Gauge, Droplets, Wind } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function MeasurementCapture() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [measurements, setMeasurements] = useState({
    suctionPressure: "",
    dischargePressure: "",
    superheat: "",
    subcooling: "",
    returnAirTemp: "",
    supplyAirTemp: "",
    ambientTemp: "",
    humidity: "",
    voltage: "",
    amperage: "",
    airflow: "",
    refrigerantAdded: "",
  });
  
  const updateMeasurement = (key: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = () => {
    // Save logic here
    navigate(`/technician/jobs/${jobId}`);
  };
  
  // Mock diagnostic alert
  const showAlert = measurements.suctionPressure && parseFloat(measurements.suctionPressure) < 50;
  
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Capture Measurements</h1>
        <p className="text-muted-foreground">Job #{jobId} - Carrier 24ACC636</p>
      </div>
      
      {/* Diagnostic Alert */}
      {showAlert && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-semibold text-warning mb-1">Possible Low Refrigerant</p>
                <p className="text-sm text-muted-foreground">Suction pressure reading is below normal range. Check for leaks.</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence: 85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Pressure Readings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Pressure Readings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Suction Pressure (PSI)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.suctionPressure}
              onChange={(e) => updateMeasurement("suctionPressure", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Discharge Pressure (PSI)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.dischargePressure}
              onChange={(e) => updateMeasurement("dischargePressure", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Temperature Readings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-primary" />
            Temperature Readings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Superheat (°F)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.superheat}
              onChange={(e) => updateMeasurement("superheat", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Subcooling (°F)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.subcooling}
              onChange={(e) => updateMeasurement("subcooling", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Return Air Temperature (°F)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.returnAirTemp}
              onChange={(e) => updateMeasurement("returnAirTemp", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Supply Air Temperature (°F)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.supplyAirTemp}
              onChange={(e) => updateMeasurement("supplyAirTemp", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Ambient Temperature (°F)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.ambientTemp}
              onChange={(e) => updateMeasurement("ambientTemp", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Environmental */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Environmental
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Humidity (%)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.humidity}
              onChange={(e) => updateMeasurement("humidity", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Electrical */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-primary" />
            Electrical & Airflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Voltage (V)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.voltage}
              onChange={(e) => updateMeasurement("voltage", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Amperage (A)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.amperage}
              onChange={(e) => updateMeasurement("amperage", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Airflow (CFM)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.airflow}
              onChange={(e) => updateMeasurement("airflow", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Refrigerant */}
      <Card>
        <CardHeader>
          <CardTitle>Refrigerant</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-2 block">Refrigerant Added (lbs)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={measurements.refrigerantAdded}
              onChange={(e) => updateMeasurement("refrigerantAdded", e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Fixed Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleSave} variant="success" size="lg" className="w-full h-14">
            <Save className="h-5 w-5" />
            Save Measurements
          </Button>
        </div>
      </div>
    </div>
  );
}
