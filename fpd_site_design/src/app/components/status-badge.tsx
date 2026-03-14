import { Badge } from "./ui/badge";

export type JobStatus = "assigned" | "in-progress" | "completed" | "cancelled";
export type TenantStatus = "active" | "suspended" | "trial";

interface StatusBadgeProps {
  status: JobStatus | TenantStatus | string;
}

const statusConfig: Record<string, { variant: "default" | "success" | "warning" | "danger" | "muted"; label: string }> = {
  "assigned": { variant: "default", label: "Assigned" },
  "in-progress": { variant: "warning", label: "In Progress" },
  "completed": { variant: "success", label: "Completed" },
  "cancelled": { variant: "muted", label: "Cancelled" },
  "active": { variant: "success", label: "Active" },
  "suspended": { variant: "danger", label: "Suspended" },
  "trial": { variant: "warning", label: "Trial" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: "default" as const, label: status };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
