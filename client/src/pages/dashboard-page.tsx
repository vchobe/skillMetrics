import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { SkillsTable } from "@/components/skills/skills-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleUpdateProfile = () => {
    navigate("/profile");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-gray-900">Skill Metrics Dashboard</h1>
        
        {/* Skills Metrics Table */}
        <SkillsTable />
        
        {/* Employee Profile Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Employee Profile</CardTitle>
            <Button onClick={handleUpdateProfile} variant="outline">
              Update Profile
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.firstName} {user?.lastName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.role || "No role set"}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Project</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.projectName || "No project set"}
                  </dd>
                </div>
                <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.clientName || "No client set"}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.location || "No location set"}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
