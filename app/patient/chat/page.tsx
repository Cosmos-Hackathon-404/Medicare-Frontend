"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  ChatWindow,
  ConversationHistoryDropdown,
  ReportPicker,
  AIChatWindow,
  DoctorContactList,
} from "@/components/shared/chat";
import {
  Bot,
  Sparkles,
  ArrowRight,
  Stethoscope,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChatTab = "ai" | "doctor";

export default function PatientChatPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ChatTab>("ai");
  const [selectedPartner, setSelectedPartner] = useState<{
    clerkId: string;
    name: string;
  } | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  // Look up doctor name from query param
  const doctorClerkIdParam = searchParams.get("doctor");
  const doctorNameParam = searchParams.get("name");

  const doctors = useQuery(api.queries.doctors.getAll);

  useEffect(() => {
    if (doctorClerkIdParam && !selectedPartner) {
      const name =
        doctorNameParam ??
        doctors?.find((d) => d.clerkUserId === doctorClerkIdParam)?.name ??
        "Doctor";
      setSelectedPartner({ clerkId: doctorClerkIdParam, name });
      setActiveTab("doctor");
    }
  }, [doctorClerkIdParam, doctorNameParam, doctors, selectedPartner]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Chat with AI or your doctors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportPicker
            patientClerkId={patientClerkId}
            selectedReportIds={selectedReportIds}
            onSelectionChange={setSelectedReportIds}
          />
          {activeTab === "doctor" && (
            <ConversationHistoryDropdown
              currentUserId={patientClerkId}
              currentUserRole="patient"
              onSelectConversation={(clerkId, name) =>
                setSelectedPartner({ clerkId, name })
              }
              selectedPartner={selectedPartner?.clerkId}
            />
          )}
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setActiveTab("ai")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "ai"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="h-4 w-4" />
          Chat with AI
        </button>
        <button
          onClick={() => setActiveTab("doctor")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "doctor"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Stethoscope className="h-4 w-4" />
          Chat with Doctor
        </button>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 min-h-0">
        {activeTab === "ai" ? (
          <AIChatWindow
            currentUserId={patientClerkId}
            selectedReportIds={selectedReportIds}
          />
        ) : selectedPartner ? (
          <ChatWindow
            currentUserId={patientClerkId}
            partnerClerkId={selectedPartner.clerkId}
            partnerName={selectedPartner.name}
            currentUserRole="patient"
            includeReportData={selectedReportIds.length > 0}
            onBack={() => setSelectedPartner(null)}
          />
        ) : (
          <div className="flex h-full gap-4">
            {/* Doctor List Sidebar */}
            <div className="w-72 shrink-0 rounded-2xl border bg-background/60 backdrop-blur-xl overflow-y-auto">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Your Doctors</h3>
                <p className="text-xs text-muted-foreground">
                  Doctors you have appointments with
                </p>
              </div>
              <DoctorContactList
                patientClerkId={patientClerkId}
                onSelectDoctor={(clerkId, name) =>
                  setSelectedPartner({ clerkId, name })
                }
                selectedDoctor={selectedPartner?.clerkId}
              />
            </div>

            {/* Empty state */}
            <div className="flex flex-1 items-center justify-center rounded-2xl border bg-background/60 backdrop-blur-xl">
              <div className="max-w-md text-center space-y-6 p-8">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                  <Stethoscope className="h-10 w-10 text-primary/70" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Chat with your Doctor
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select a doctor from the list to start or continue a
                    conversation. You can only chat with doctors you have
                    appointments with.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-left">
                    <Sparkles className="h-5 w-5 shrink-0 text-primary/60" />
                    <div className="text-xs">
                      <p className="font-medium">Include Report Data</p>
                      <p className="text-muted-foreground mt-0.5">
                        Toggle reports to share your medical reports in the
                        conversation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-left">
                    <ArrowRight className="h-5 w-5 shrink-0 text-primary/60" />
                    <div className="text-xs">
                      <p className="font-medium">Chat History</p>
                      <p className="text-muted-foreground mt-0.5">
                        Use the History button to resume past conversations.
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
