
"use client";

import { useAuth } from "@/hooks/use-auth";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
        <main className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        </main>
    )
  }

  return (
    <main>
      <AdminDashboard />
    </main>
  );
}
