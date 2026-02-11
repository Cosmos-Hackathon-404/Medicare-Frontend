"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ChatWindow, ConversationList } from "@/components/shared/chat";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function PatientChatPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";
  const searchParams = useSearchParams();

  const [selectedPartner, setSelectedPartner] = useState<{
    clerkId: string;
    name: string;
  } | null>(null);

  // Look up doctor name from query param
  const doctorClerkIdParam = searchParams.get("doctor");
  const doctorNameParam = searchParams.get("name");

  // Resolve doctor name if not provided in params
  const doctors = useQuery(api.queries.doctors.getAll);

  useEffect(() => {
    if (doctorClerkIdParam && !selectedPartner) {
      const name =
        doctorNameParam ??
        doctors?.find((d) => d.clerkUserId === doctorClerkIdParam)?.name ??
        "Doctor";
      setSelectedPartner({ clerkId: doctorClerkIdParam, name });
    }
  }, [doctorClerkIdParam, doctorNameParam, doctors, selectedPartner]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with your doctors.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Conversation List */}
        <Card className="h-[600px] overflow-y-auto">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Conversations</h2>
          </div>
          <ConversationList
            currentUserId={patientClerkId}
            currentUserRole="patient"
            onSelectConversation={(clerkId, name) =>
              setSelectedPartner({ clerkId, name })
            }
            selectedPartner={selectedPartner?.clerkId}
          />
        </Card>

        {/* Chat Window */}
        {selectedPartner ? (
          <ChatWindow
            currentUserId={patientClerkId}
            partnerClerkId={selectedPartner.clerkId}
            partnerName={selectedPartner.name}
            currentUserRole="patient"
            onBack={() => setSelectedPartner(null)}
          />
        ) : (
          <Card className="flex h-[600px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">Select a conversation</p>
              <p className="mt-1 text-sm">
                Choose a doctor from the list to start chatting.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
