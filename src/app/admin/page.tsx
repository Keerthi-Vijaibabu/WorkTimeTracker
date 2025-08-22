
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dashboard } from "@/components/dashboard";
import Link from "next/link";

export default function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <main className="bg-background font-body text-foreground">
        <div className="container mx-auto px-4 py-8 sm:py-12">
            <header className="flex justify-between items-center mb-10">
            <div className="text-left">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                <Link href="/">WorkTracker</Link>
                </h1>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
                Admin Dashboard
                </p>
            </div>
            {user && (
                <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" onClick={logout}>Logout</Button>
                </div>
            )}
            </header>
            <Dashboard />
        </div>
    </main>
  );
}
