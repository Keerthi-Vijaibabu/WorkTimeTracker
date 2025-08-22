
"use client";

import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <main>
      <Dashboard />
    </main>
  );
}
