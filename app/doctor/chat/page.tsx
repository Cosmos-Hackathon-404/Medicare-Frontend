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
import { Bot, ArrowRight, Sparkles, User, MessageSquare } from "lucide-react";

export default function DoctorChatPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";
  const searchParams = useSearchParams();

  const [selectedPartner, setSelectedPartner] = useState<{
    clerkId: string;
    name: string;
  } | null>(null);

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
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Chat with your patients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConversationHistoryDropdown
            currentUserId={doctorClerkId}
            currentUserRole="doctor"
            onSelectConversation={(clerkId, name) =>
              setSelectedPartner({ clerkId, name })
            }
            selectedPartner={selectedPartner?.clerkId}
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
          <div className="flex h-full gap-4">
            {/* Patient List Sidebar */}
            <div className="w-72 shrink-0 rounded-2xl border bg-background/60 backdrop-blur-xl overflow-y-auto">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Your Patients</h3>
                <p className="text-xs text-muted-foreground">
                  Patients with appointments
                </p>
              </div>
              <PatientContactList
                doctorClerkId={doctorClerkId}
                onSelectPatient={(clerkId, name) =>
                  setSelectedPartner({ clerkId, name })
                }
                selectedPatient={selectedPartner?.clerkId}
              />
            </div>

            {/* Empty state */}
            <div className="flex flex-1 items-center justify-center rounded-2xl border bg-background/60 backdrop-blur-xl">
              <div className="max-w-md text-center space-y-6 p-8">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                  <MessageSquare className="h-10 w-10 text-primary/70" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Welcome to Messages
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Communicate with your patients securely. Select a patient
                    from the list or use the History button to resume a
                    conversation.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-left">
                    <User className="h-5 w-5 shrink-0 text-primary/60" />
                    <div className="text-xs">
                      <p className="font-medium">Your Patients</p>
                      <p className="text-muted-foreground mt-0.5">
                        Select a patient from the sidebar to start chatting.
                        Only patients with appointments are shown.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-left">
                    <ArrowRight className="h-5 w-5 shrink-0 text-primary/60" />
                    <div className="text-xs">
                      <p className="font-medium">Chat History</p>
                      <p className="text-muted-foreground mt-0.5">
                        Click the History button above to resume a previous
                        conversation with a patient.
                      </p>
                    </div>
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
