import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto bg-gray-50">
        <div className={cn("p-4 sm:p-6 lg:p-8", className)}>{children}</div>
      </main>
    </div>
  );
}
