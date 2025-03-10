import { Link, useLocation } from "wouter";
import { LayoutDashboard, UserCircle, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Base navigation items
  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/profile", icon: UserCircle, label: "Update Profile" },
  ];
  
  // Add admin link for admin user
  if (user?.email === "admin@example.com") {
    navItems.push({ href: "/admin", icon: ShieldCheck, label: "Admin Dashboard" });
  }

  const NavContent = () => (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={closeMobileMenu}
          className={cn(
            "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
            location === item.href
              ? "bg-gray-900 text-white"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          )}
        >
          <item.icon className="mr-3 h-6 w-6" />
          {item.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
      >
        <LogOut className="mr-3 h-6 w-6" />
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn("hidden md:flex md:flex-col w-64 bg-gray-800", className)}>
        <div className="flex items-center h-16 px-4 bg-gray-900">
          <span className="text-xl font-bold text-white">SkillMetrix</span>
        </div>
        <div className="flex flex-col flex-grow overflow-y-auto">
          <NavContent />
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center bg-gray-800 h-16 px-4 justify-between">
        <span className="text-xl font-bold text-white">SkillMetrix</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 right-0 left-0 bg-gray-800 z-50 md:hidden">
          <NavContent />
        </div>
      )}
    </>
  );
}
