"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  ChatWindow,
  ConversationHistoryDropdown,
  PatientContactList,
} from "@/components/shared/chat";
import {
  ArrowRight,
  User,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorChatPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";
  const searchParams = useSearchParams();

  const [selectedPartner, setSelectedPartner] = useState<{
    clerkId: string;
    name: string;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Look up patient name from query param
  const patientClerkIdParam = searchParams.get("patient");

  const patients = useQuery(api.queries.patients.getAll);

  useEffect(() => {
    if (patientClerkIdParam && !selectedPartner) {
      const name =
        patients?.find((p) => p.clerkUserId === patientClerkIdParam)?.name ??
        "Patient";
      setSelectedPartner({ clerkId: patientClerkIdParam, name });
    }
  }, [patientClerkIdParam, patients, selectedPartner]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col -m-4 md:-m-6 lg:-m-8">
      {/* ── Compact Top Bar ── */}
      <div className="flex items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Messages</span>
          </div>
          {!selectedPartner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConversationHistoryDropdown
            currentUserId={doctorClerkId}
            currentUserRole="doctor"
            onSelectConversation={(clerkId, name) =>
              setSelectedPartner({ clerkId, name })
            }
            selectedPartner={selectedPartner?.clerkId ?? undefined}
          />
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 min-h-0">
        {selectedPartner ? (
          <ChatWindow
            currentUserId={doctorClerkId}
            partnerClerkId={selectedPartner.clerkId}
            partnerName={selectedPartner.name}
            currentUserRole="doctor"
            onBack={() => setSelectedPartner(null)}
          />
        ) : (
          <div className="flex h-full">
            {/* Patient List — collapsible sidebar */}
            {sidebarOpen && (
              <div className="w-60 shrink-0 border-r bg-background/60 overflow-y-auto">
                <div className="px-3 py-2.5 border-b">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Patients
                  </h3>
                </div>
                <PatientContactList
                  doctorClerkId={doctorClerkId}
                  onSelectPatient={(clerkId, name) =>
                    setSelectedPartner({ clerkId, name })
                  }
                  selectedPatient={undefined}
                />
              </div>
            )}

            {/* Empty state */}
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-sm text-center space-y-4 p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                  <MessageSquare className="h-8 w-8 text-primary/70" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Select a Patient
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Choose a patient from the sidebar to start or continue a conversation.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2 text-left">
                    <User className="h-4 w-4 shrink-0 text-primary/60" />
                    <p className="text-[11px] text-muted-foreground">
                      Only patients with appointments are shown in the sidebar.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2 text-left">
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary/60" />
                    <p className="text-[11px] text-muted-foreground">
                      Use{" "}
                      <span className="font-medium text-foreground">
                        History
                      </span>{" "}
                      to resume past conversations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
