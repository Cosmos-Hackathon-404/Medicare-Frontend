"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Search,
  Share2,
  History,
  Inbox,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const doctorNav: NavItem[] = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
  { label: "Reports", href: "/doctor/reports", icon: FileText },
  { label: "Shared Context", href: "/doctor/shared-context", icon: Inbox },
];

const patientNav: NavItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "Find Doctor", href: "/patient/book", icon: Search },
  { label: "My Reports", href: "/patient/reports", icon: FileText },
  { label: "Sessions", href: "/patient/sessions", icon: History },
  { label: "Share Context", href: "/patient/share", icon: Share2 },
];

export function AppSidebar({
  role,
  children,
}: {
  role: "doctor" | "patient";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = role === "doctor" ? doctorNav : patientNav;
  const { user } = useUser();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="Medicare AI">
                <Link href={`/${role}/dashboard`}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="font-bold text-sm">M</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Medicare AI</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      {role} Portal
                    </span>

                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />

        {/* Footer */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="cursor-default hover:bg-transparent active:bg-transparent"
              >
                <UserButton afterSignOutUrl="/" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.fullName || user?.firstName || "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main content */}
      <SidebarInset className="h-svh max-h-svh">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 ">
          <div className="flex items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {role} Portal
            </span>
          </div>

          <div className="mr-5 flex space-x-5">
            <ThemeToggle />

            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
