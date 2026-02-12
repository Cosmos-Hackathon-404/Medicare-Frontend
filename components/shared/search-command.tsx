"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Settings,
  MessageSquare,
  Activity,
  User,
  Sparkles,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SearchCommandProps {
  role: "doctor" | "patient";
}

const doctorPages = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
  { label: "Availability", href: "/doctor/availability", icon: Clock, keywords: ["schedule", "slots", "time"] },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar, keywords: ["booking", "upcoming"] },
  { label: "Sessions", href: "/doctor/sessions", icon: Mic, keywords: ["consultation", "recording", "past"] },
  { label: "Messages", href: "/doctor/chat", icon: MessageSquare, keywords: ["chat", "inbox", "conversation"] },
  { label: "Reports", href: "/doctor/reports", icon: FileText, keywords: ["documents", "lab", "analysis"] },
  { label: "Shared Context", href: "/doctor/shared-context", icon: Inbox, keywords: ["referral", "context"] },
  { label: "Settings", href: "/doctor/settings", icon: Settings, keywords: ["profile", "preferences", "account"] },
];

const patientPages = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar, keywords: ["booking", "upcoming"] },
  { label: "Find Doctor", href: "/patient/book", icon: Search, keywords: ["search", "book", "doctor"] },
  { label: "Messages", href: "/patient/chat", icon: MessageSquare, keywords: ["chat", "inbox"] },
  { label: "My Reports", href: "/patient/reports", icon: FileText, keywords: ["documents", "lab"] },
  { label: "Health Trends", href: "/patient/health-trends", icon: Activity, keywords: ["vitals", "data", "chart"] },
  { label: "Wellness Plan", href: "/patient/wellness", icon: Sparkles, keywords: ["nutrition", "exercise", "diet", "fitness", "lifestyle", "mental", "wellness"] },
  { label: "Sessions", href: "/patient/sessions", icon: History, keywords: ["consultation", "past"] },
  { label: "Share Context", href: "/patient/share", icon: Share2, keywords: ["referral", "share"] },
  { label: "Settings", href: "/patient/settings", icon: Settings, keywords: ["profile", "preferences"] },
];

export function SearchCommand({ role }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const patients = useQuery(
    api.queries.patients.getAll,
    role === "doctor" ? {} : "skip"
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const pages = role === "doctor" ? doctorPages : patientPages;

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, patients, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                value={`${page.label} ${page.keywords.join(" ")}`}
                onSelect={() => handleSelect(page.href)}
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {role === "doctor" && patients && patients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Patients">
                {patients.map((patient) => (
                  <CommandItem
                    key={patient._id}
                    value={`patient ${patient.name} ${patient.email || ""}`}
                    onSelect={() =>
                      handleSelect(`/doctor/patient/${patient.clerkUserId}`)
                    }
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>{patient.name}</span>
                    {patient.email && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {patient.email}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="new session start recording"
              onSelect={() => handleSelect(`/${role}/sessions`)}
            >
              <Mic className="mr-2 h-4 w-4" />
              <span>Go to Sessions</span>
            </CommandItem>
            <CommandItem
              value="send message chat"
              onSelect={() => handleSelect(`/${role}/chat`)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Open Messages</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
