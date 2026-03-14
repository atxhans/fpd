import { Outlet, Link, useLocation } from "react-router";
import { FieldpieceLogo } from "../components/fieldpiece-logo";

export function RootLayout() {
  const location = useLocation();
  
  // Determine which section we're in
  const section = location.pathname.split("/")[1] || "company";
  
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-black shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <FieldpieceLogo size="md" showTagline={true} variant="light" />
          </Link>
          
          {/* Section Switcher */}
          <nav className="ml-auto flex items-center gap-4">
            <Link
              to="/technician"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                section === "technician"
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Technician
            </Link>
            <Link
              to="/company"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                section === "company" || section === ""
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Company
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                section === "admin"
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      
      <Outlet />
    </div>
  );
}