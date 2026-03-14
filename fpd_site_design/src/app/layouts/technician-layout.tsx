import { Outlet, Link, useLocation } from "react-router";
import { Home, Briefcase, Menu } from "lucide-react";
import { useState } from "react";
import { FieldpieceLogo } from "../components/fieldpiece-logo";

export function TechnicianLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/technician" && location.pathname === "/technician") return true;
    if (path !== "/technician" && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/30">
      {/* Mobile Header */}
      <div className="md:hidden bg-black border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <FieldpieceLogo size="sm" showTagline={false} variant="light" />
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-white">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-black border-t border-white/10">
        <div className="flex items-center justify-around px-4 py-2">
          <Link
            to="/technician"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isActive("/technician")
                ? "text-primary"
                : "text-white/70"
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link
            to="/technician/jobs"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isActive("/technician/jobs")
                ? "text-primary"
                : "text-white/70"
            }`}
          >
            <Briefcase className="h-6 w-6" />
            <span className="text-xs">Jobs</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}