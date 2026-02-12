"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatWindowProps {
  currentUserId: string;
  partnerClerkId: string;
  partnerName: string;
  currentUserRole: "doctor" | "patient";
  onBack?: () => void;
}

export function ChatWindow({
  currentUserId,
  partnerClerkId,
  partnerName,
  currentUserRole,
  onBack,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.queries.messages.getConversation,
    currentUserId && partnerClerkId
      ? { userAClerkId: currentUserId, userBClerkId: partnerClerkId }
      : "skip"
  );

  const sendMessage = useMutation(api.mutations.messages.send);
  const markAsRead = useMutation(api.mutations.messages.markAsRead);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (currentUserId && partnerClerkId) {
      markAsRead({
        senderClerkId: partnerClerkId,
        receiverClerkId: currentUserId,
      });
    }
  }, [messages, currentUserId, partnerClerkId, markAsRead]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || !partnerClerkId) return;

    setMessage("");
    await sendMessage({
      senderClerkId: currentUserId,
      receiverClerkId: partnerClerkId,
      senderRole: currentUserRole,
      content: trimmed,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const partnerInitials = partnerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="flex h-[600px] flex-col">
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {partnerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate">{partnerName}</CardTitle>
            <p className="text-xs text-muted-foreground capitalize">
              {currentUserRole === "doctor" ? "Patient" : "Doctor"}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="space-y-3 p-4">
            {!messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs">Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderClerkId === currentUserId;
                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex",
                      isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          isMe
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {format(new Date(msg._creationTime), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="flex-shrink-0 border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Conversation list sidebar
interface ConversationListProps {
  currentUserId: string;
  currentUserRole: "doctor" | "patient";
  onSelectConversation: (partnerClerkId: string, partnerName: string) => void;
  selectedPartner?: string;
}

export function ConversationList({
  currentUserId,
  currentUserRole,
  onSelectConversation,
  selectedPartner,
}: ConversationListProps) {
  const conversations = useQuery(
    api.queries.messages.getConversations,
    currentUserId ? { clerkUserId: currentUserId } : "skip"
  );

  // Resolve partner names — look up doctor or patient profiles
  const partnerProfiles = useQuery(
    currentUserRole === "doctor"
      ? api.queries.patients.getAll
      : api.queries.doctors.getAll
  );

  const getPartnerName = (partnerClerkId: string) => {
    if (!partnerProfiles) return partnerClerkId.slice(0, 12) + "...";
    const profile = partnerProfiles.find(
      (p: { clerkUserId: string }) => p.clerkUserId === partnerClerkId
    );
    return profile?.name ?? partnerClerkId.slice(0, 12) + "...";
  };

  if (!conversations) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="mt-1 text-xs">
          {currentUserRole === "patient"
            ? "Message a doctor after booking an appointment."
            : "Conversations with patients will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => {
        const name = getPartnerName(conv.partnerClerkId);
        const isSelected = selectedPartner === conv.partnerClerkId;
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <button
            key={conv.partnerClerkId}
            onClick={() => onSelectConversation(conv.partnerClerkId, name)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/80",
              isSelected && "bg-muted"
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {format(new Date(conv.lastMessageTime), "MMM d")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="truncate text-xs text-muted-foreground">
                  {conv.lastMessage}
                </p>
                {conv.unreadCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px]">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
