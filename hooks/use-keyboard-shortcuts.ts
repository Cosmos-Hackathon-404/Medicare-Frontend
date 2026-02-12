"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  group: string;
}

export function useKeyboardShortcuts(role: "doctor" | "patient") {
  const router = useRouter();

  useEffect(() => {
    const shortcuts: ShortcutConfig[] =
      role === "doctor"
        ? [
            {
              key: "d",
              shiftKey: true,
              action: () => router.push("/doctor/dashboard"),
              description: "Go to Dashboard",
              group: "Navigation",
            },
            {
              key: "a",
              shiftKey: true,
              action: () => router.push("/doctor/appointments"),
              description: "Go to Appointments",
              group: "Navigation",
            },
            {
              key: "s",
              shiftKey: true,
              action: () => router.push("/doctor/sessions"),
              description: "Go to Sessions",
              group: "Navigation",
            },
            {
              key: "m",
              shiftKey: true,
              action: () => router.push("/doctor/chat"),
              description: "Go to Messages",
              group: "Navigation",
            },
            {
              key: "r",
              shiftKey: true,
              action: () => router.push("/doctor/reports"),
              description: "Go to Reports",
              group: "Navigation",
            },
          ]
        : [
            {
              key: "d",
              shiftKey: true,
              action: () => router.push("/patient/dashboard"),
              description: "Go to Dashboard",
              group: "Navigation",
            },
            {
              key: "a",
              shiftKey: true,
              action: () => router.push("/patient/appointments"),
              description: "Go to Appointments",
              group: "Navigation",
            },
            {
              key: "b",
              shiftKey: true,
              action: () => router.push("/patient/book"),
              description: "Find a Doctor",
              group: "Navigation",
            },
            {
              key: "m",
              shiftKey: true,
              action: () => router.push("/patient/chat"),
              description: "Go to Messages",
              group: "Navigation",
            },
          ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [role, router]);
}

export const doctorShortcuts = [
  { keys: ["Ctrl", "K"], description: "Open search" },
  { keys: ["Shift", "D"], description: "Go to Dashboard" },
  { keys: ["Shift", "A"], description: "Go to Appointments" },
  { keys: ["Shift", "S"], description: "Go to Sessions" },
  { keys: ["Shift", "M"], description: "Go to Messages" },
  { keys: ["Shift", "R"], description: "Go to Reports" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

export const patientShortcuts = [
  { keys: ["Ctrl", "K"], description: "Open search" },
  { keys: ["Shift", "D"], description: "Go to Dashboard" },
  { keys: ["Shift", "A"], description: "Go to Appointments" },
  { keys: ["Shift", "B"], description: "Find a Doctor" },
  { keys: ["Shift", "M"], description: "Go to Messages" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];
