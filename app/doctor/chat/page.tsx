"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ChatWindow, ConversationList } from "@/components/shared/chat";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function DoctorChatPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const [selectedPartner, setSelectedPartner] = useState<{
    clerkId: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with your patients.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Conversation List */}
        <Card className="h-[600px] overflow-y-auto">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Conversations</h2>
          </div>
          <ConversationList
            currentUserId={doctorClerkId}
            currentUserRole="doctor"
            onSelectConversation={(clerkId, name) =>
              setSelectedPartner({ clerkId, name })
            }
            selectedPartner={selectedPartner?.clerkId}
          />
        </Card>

        {/* Chat Window */}
        {selectedPartner ? (
          <ChatWindow
            currentUserId={doctorClerkId}
            partnerClerkId={selectedPartner.clerkId}
            partnerName={selectedPartner.name}
            currentUserRole="doctor"
            onBack={() => setSelectedPartner(null)}
          />
        ) : (
          <Card className="flex h-[600px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">Select a conversation</p>
              <p className="mt-1 text-sm">
                Choose a patient from the list to start chatting.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
