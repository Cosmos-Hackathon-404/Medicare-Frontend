"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  Clock,
  FileText,
  Search,
  Share2,
  History,
  Inbox,
  Mic,
  CalendarCog,
  Settings,
  MessageSquare,
  Activity,
  Bell,
  AlertTriangle,
  Mail,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SearchCommand } from "@/components/shared/search-command";
import { KeyboardShortcutsDialog } from "@/components/shared/keyboard-shortcuts-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const doctorNav: NavItem[] = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Availability", href: "/doctor/availability", icon: Clock },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
  { label: "Sessions", href: "/doctor/sessions", icon: Mic },
  { label: "Messages", href: "/doctor/chat", icon: MessageSquare },
  { label: "Reports", href: "/doctor/reports", icon: FileText },
  { label: "Shared Context", href: "/doctor/shared-context", icon: Inbox },
  { label: "Settings", href: "/doctor/settings", icon: Settings },
];

const patientNav: NavItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "Find Doctor", href: "/patient/book", icon: Search },
  { label: "Messages", href: "/patient/chat", icon: MessageSquare },
  { label: "My Reports", href: "/patient/reports", icon: FileText },
  { label: "Health Trends", href: "/patient/health-trends", icon: Activity },
  { label: "Wellness Plan", href: "/patient/wellness", icon: Sparkles },
  { label: "Sessions", href: "/patient/sessions", icon: History },
  { label: "Share Context", href: "/patient/share", icon: Share2 },
  { label: "Settings", href: "/patient/settings", icon: Settings },
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

  useKeyboardShortcuts(role);

  const unreadCount = useQuery(
    api.queries.messages.getUnreadCount,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const criticalAlerts = useQuery(
    api.queries.criticalAlerts.getActiveForDoctor,
    role === "doctor" && user?.id ? { doctorClerkId: user.id } : "skip"
  );

  const sharedContexts = useQuery(
    api.queries.sharedContexts.getForDoctor,
    role === "doctor" && user?.id ? { doctorClerkId: user.id } : "skip"
  );

  // Appointment reminder notifications
  const reminderNotifications = useQuery(
    api.queries.notifications.getForUser,
    user?.id ? { userClerkId: user.id } : "skip"
  );
  const unreadReminderCount = reminderNotifications?.filter((n) => !n.read).length ?? 0;
  const markAllRead = useMutation(api.mutations.notifications.markAllAsRead);

  const alertCount = criticalAlerts?.length ?? 0;
  const contextCount = sharedContexts?.length ?? 0;
  const totalNotifications = (unreadCount ?? 0) + alertCount + contextCount + unreadReminderCount;

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
                  const isMessages = item.label === "Messages";
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
                          {isMessages && unreadCount && unreadCount > 0 ? (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-5 min-w-5 px-1.5 text-xs font-bold"
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Badge>
                          ) : null}
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

          <div className="mr-5 flex items-center space-x-3">
            <SearchCommand role={role} />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {totalNotifications > 0 && (
                      <p className="text-xs text-muted-foreground">
                        You have {totalNotifications} notification{totalNotifications !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  {unreadReminderCount > 0 && user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => markAllRead({ userClerkId: user.id })}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="mb-2 h-8 w-8 opacity-40" />
                      <p className="text-sm">All caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {(unreadCount ?? 0) > 0 && (
                        <Link
                          href={`/${role}/chat`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Unread Messages</p>
                            <p className="text-xs text-muted-foreground">
                              {unreadCount} new message{(unreadCount ?? 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {unreadCount}
                          </Badge>
                        </Link>
                      )}
                      {alertCount > 0 && (
                        <Link
                          href={`/${role}/reports`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Critical Alerts</p>
                            <p className="text-xs text-muted-foreground">
                              {alertCount} active alert{alertCount !== 1 ? "s" : ""} need attention
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {alertCount}
                          </Badge>
                        </Link>
                      )}
                      {contextCount > 0 && (
                        <Link
                          href={`/${role}/shared-context`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                            <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Shared Contexts</p>
                            <p className="text-xs text-muted-foreground">
                              {contextCount} context{contextCount !== 1 ? "s" : ""} received
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {contextCount}
                          </Badge>
                        </Link>
                      )}
                      {/* Appointment Reminders */}
                      {reminderNotifications && reminderNotifications.filter((n) => !n.read).map((notification) => (
                        <Link
                          key={notification._id}
                          href={notification.link ?? `/${role}/appointments`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
                            <CalendarCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {notification.message}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <ThemeToggle />

            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
      <KeyboardShortcutsDialog role={role} />
    </SidebarProvider>
  );
}
