
"use client";

import { AdminDashboard } from "@/components/admin-dashboard";
import { WorkTracker } from "@/components/work-tracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Dashboard() {
    const { setTheme, theme } = useTheme();
    const { user } = useAuth();

    const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    return (
        <div className="relative">
            <div className="absolute top-0 right-0 -mt-16">
                 <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
            <Tabs defaultValue="tracker" className="w-full">
                <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <TabsTrigger value="tracker">Work Tracker</TabsTrigger>
                    {isAdmin && <TabsTrigger value="admin">Admin View</TabsTrigger>}
                </TabsList>
                <TabsContent value="tracker">
                    <Card>
                        <CardContent className="pt-6">
                            <WorkTracker />
                        </CardContent>
                    </Card>
                </TabsContent>
                {isAdmin && (
                    <TabsContent value="admin">
                        <Card>
                            <CardContent className="pt-6">
                                <AdminDashboard />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
