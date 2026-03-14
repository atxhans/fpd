import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { TechnicianLayout } from "./layouts/technician-layout";
import { CompanyLayout } from "./layouts/company-layout";
import { AdminLayout } from "./layouts/admin-layout";

// Technician Mobile Pages
import { TechnicianDashboard } from "./pages/technician/dashboard";
import { JobList } from "./pages/technician/job-list";
import { JobDetail } from "./pages/technician/job-detail";
import { MeasurementCapture } from "./pages/technician/measurement-capture";
import { EquipmentDetail } from "./pages/technician/equipment-detail";

// Company Dashboard Pages
import { CompanyDashboard } from "./pages/company/dashboard";
import { JobsManagement } from "./pages/company/jobs-management";
import { EquipmentManagement } from "./pages/company/equipment-management";
import { TechnicianManagement } from "./pages/company/technician-management";
import { ServiceAnalytics } from "./pages/company/service-analytics";

// Admin Console Pages
import { AdminDashboard } from "./pages/admin/dashboard";
import { TenantManagement } from "./pages/admin/tenant-management";
import { TenantDetail } from "./pages/admin/tenant-detail";
import { SupportConsole } from "./pages/admin/support-console";
import { AuditLogs } from "./pages/admin/audit-logs";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: CompanyDashboard },
      
      // Technician Mobile Routes
      {
        path: "technician",
        Component: TechnicianLayout,
        children: [
          { index: true, Component: TechnicianDashboard },
          { path: "jobs", Component: JobList },
          { path: "jobs/:jobId", Component: JobDetail },
          { path: "jobs/:jobId/measurements", Component: MeasurementCapture },
          { path: "equipment/:equipmentId", Component: EquipmentDetail },
        ],
      },
      
      // Company Dashboard Routes
      {
        path: "company",
        Component: CompanyLayout,
        children: [
          { index: true, Component: CompanyDashboard },
          { path: "jobs", Component: JobsManagement },
          { path: "equipment", Component: EquipmentManagement },
          { path: "equipment/:equipmentId", Component: EquipmentDetail },
          { path: "technicians", Component: TechnicianManagement },
          { path: "analytics", Component: ServiceAnalytics },
        ],
      },
      
      // Admin Console Routes
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "tenants", Component: TenantManagement },
          { path: "tenants/:tenantId", Component: TenantDetail },
          { path: "support", Component: SupportConsole },
          { path: "audit-logs", Component: AuditLogs },
        ],
      },
    ],
  },
]);
