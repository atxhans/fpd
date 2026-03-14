import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Briefcase, Wrench, Users, BarChart3 } from "lucide-react";
import { FieldpieceLogo } from "../components/fieldpiece-logo";

export function CompanyLayout() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/company" && (location.pathname === "/company" || location.pathname === "/")) return true;
    if (path !== "/company" && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-black text-white">
        <div className="p-4 border-b border-white/10">
          <FieldpieceLogo size="sm" showTagline={true} variant="light" />
          <p className="text-sm text-white/60 mt-2">HVAC Service Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/company"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/company")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/company/jobs"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/company/jobs")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span>Jobs</span>
          </Link>
          <Link
            to="/company/equipment"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/company/equipment")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Wrench className="h-5 w-5" />
            <span>Equipment</span>
          </Link>
          <Link
            to="/company/technicians"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/company/technicians")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Technicians</span>
          </Link>
          <Link
            to="/company/analytics"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/company/analytics")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Analytics</span>
          </Link>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}