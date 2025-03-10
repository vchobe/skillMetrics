import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileHistoryTable } from "@/components/profile/profile-history";
import { AppLayout } from "@/components/layout/app-layout";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-gray-900">Update Profile</h1>
        <ProfileForm />
        <ProfileHistoryTable />
      </div>
    </AppLayout>
  );
}
