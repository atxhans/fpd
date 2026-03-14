import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Building2, HeadphonesIcon, FileText, Shield } from "lucide-react";
import { FieldpieceLogo } from "../components/fieldpiece-logo";

export function AdminLayout() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/admin" && location.pathname === "/admin") return true;
    if (path !== "/admin" && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-black text-white">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-lg">Admin Console</h2>
          </div>
          <FieldpieceLogo size="sm" showTagline={false} variant="light" />
          <p className="text-sm text-white/60 mt-2">Platform Operations</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin/tenants"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/admin/tenants")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Building2 className="h-5 w-5" />
            <span>Tenants</span>
          </Link>
          <Link
            to="/admin/support"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/admin/support")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <HeadphonesIcon className="h-5 w-5" />
            <span>Support Console</span>
          </Link>
          <Link
            to="/admin/audit-logs"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/admin/audit-logs")
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Audit Logs</span>
          </Link>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}