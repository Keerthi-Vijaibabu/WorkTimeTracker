
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  User,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Shield,
  Briefcase,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
             <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-accent">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
            <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                WorkTracker
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavItem href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </NavItem>
            </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <NavItem href="/admin">
                  <Shield />
                  <span>Admin Panel</span>
                </NavItem>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <ThemeToggle />
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-2 md:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href}>
      <SidebarMenuButton asChild isActive={isActive}>{children}</SidebarMenuButton>
    </Link>
  );
}

function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function UserMenu() {
    const { user, logout } = useAuth();
    const { open } = useSidebar();
    return (
        <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {open && 
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
            }
             <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
             </Button>
        </div>
    )
}
