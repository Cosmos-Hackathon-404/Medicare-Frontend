"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  MessageSquare,
  MessageSquarePlus,
  History,
  FileText,
  FileX,
  Bot,
  ChevronDown,
  Sparkles,
  X,
  Loader2,
  Trash2,
  Stethoscope,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─── Modern Chat Window ─── */

interface ChatWindowProps {
  currentUserId: string;
  partnerClerkId: string;
  partnerName: string;
  currentUserRole: "doctor" | "patient";
  includeReportData?: boolean;
  onBack?: () => void;
}

export function ChatWindow({
  currentUserId,
  partnerClerkId,
  partnerName,
  currentUserRole,
  includeReportData,
  onBack,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || !partnerClerkId) return;

    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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

  // Group messages by date
  const groupedMessages = messages
    ? messages.reduce(
        (groups, msg) => {
          const date = new Date(msg._creationTime);
          let label: string;
          if (isToday(date)) label = "Today";
          else if (isYesterday(date)) label = "Yesterday";
          else label = format(date, "MMMM d, yyyy");

          if (!groups[label]) groups[label] = [];
          groups[label].push(msg);
          return groups;
        },
        {} as Record<string, typeof messages>
      )
    : {};

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b bg-background/80 px-4 py-2.5 backdrop-blur-sm shrink-0">
        <div className="relative">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
              {partnerInitials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{partnerName}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {currentUserRole === "doctor" ? "Patient" : "Doctor"}
          </p>
        </div>
        {includeReportData && (
          <Badge
            variant="secondary"
            className="gap-1 text-xs bg-primary/10 text-primary border-primary/20"
          >
            <FileText className="h-3 w-3" />
            Reports included
          </Badge>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-1 px-4 py-3">
          {!messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="mb-3 rounded-full bg-primary/10 p-3">
                <MessageSquare className="h-7 w-7 text-primary/60" />
              </div>
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                Send a message to {partnerName} to get started.
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
              <div key={dateLabel}>
                {/* Date separator */}
                <div className="flex items-center gap-3 py-4">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[11px] font-medium text-muted-foreground/70 select-none">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                {/* Messages for this date */}
                <div className="space-y-3">
                  {msgs.map((msg) => {
                    const isMe = msg.senderClerkId === currentUserId;
                    return (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex items-end gap-2",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isMe && (
                          <Avatar className="h-7 w-7 shrink-0 mb-5">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-[10px] font-semibold">
                              {partnerInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn("max-w-[70%] group", isMe ? "items-end" : "items-start")}>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted/80 rounded-bl-sm"
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "mt-1 px-1 text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity",
                              isMe ? "text-right" : "text-left"
                            )}
                          >
                            {format(new Date(msg._creationTime), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="border-t bg-background px-6 py-4 shrink-0">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 transition-all duration-200 focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-lg focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${partnerName}...`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:outline-none"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim()}
              className={cn(
                "h-9 w-9 shrink-0 rounded-xl transition-all duration-200",
                message.trim()
                  ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-105"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── History Dropdown ─── */

interface ConversationHistoryDropdownProps {
  currentUserId: string;
  currentUserRole: "doctor" | "patient";
  onSelectConversation: (partnerClerkId: string, partnerName: string) => void;
  selectedPartner?: string;
}

export function ConversationHistoryDropdown({
  currentUserId,
  currentUserRole,
  onSelectConversation,
  selectedPartner,
}: ConversationHistoryDropdownProps) {
  const conversations = useQuery(
    api.queries.messages.getConversations,
    currentUserId ? { clerkUserId: currentUserId } : "skip"
  );

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

  const totalUnread =
    conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <History className="h-4 w-4" />
          History
          {totalUnread > 0 && (
            <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px] ml-1">
              {totalUnread}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Recent conversations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!conversations ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
            <p className="text-xs">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const name = getPartnerName(conv.partnerClerkId);
            const isSelected = selectedPartner === conv.partnerClerkId;
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <DropdownMenuItem
                key={conv.partnerClerkId}
                onClick={() => onSelectConversation(conv.partnerClerkId, name)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg py-2.5",
                  isSelected && "bg-primary/5"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">
                      {name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground ml-2">
                      {format(new Date(conv.lastMessageTime), "MMM d")}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge className="h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px]">
                    {conv.unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Report Data Toggle (legacy) ─── */

interface ReportToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function ReportDataToggle({ enabled, onToggle }: ReportToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(!enabled)}
            className={cn(
              "gap-2 rounded-xl transition-all",
              enabled
                ? "bg-primary text-primary-foreground shadow-md"
                : "hover:border-primary/40"
            )}
          >
            {enabled ? (
              <FileText className="h-4 w-4" />
            ) : (
              <FileX className="h-4 w-4" />
            )}
            {enabled ? "Reports Included" : "Include Reports"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {enabled
              ? "Report data is shared in this conversation"
              : "Click to include your report data in the conversation"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─── Report Picker Dropdown ─── */

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Id } from "@/convex/_generated/dataModel";

interface ReportPickerProps {
  patientClerkId: string;
  selectedReportIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ReportPicker({
  patientClerkId,
  selectedReportIds,
  onSelectionChange,
}: ReportPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const reports = useQuery(
    api.queries.reports.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  const filteredReports = reports?.filter((r) =>
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleReport = (reportId: string) => {
    if (selectedReportIds.includes(reportId)) {
      onSelectionChange(selectedReportIds.filter((id) => id !== reportId));
    } else {
      onSelectionChange([...selectedReportIds, reportId]);
    }
  };

  const selectAll = () => {
    if (!reports) return;
    onSelectionChange(reports.map((r) => r._id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedReportIds.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedCount > 0 ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2 rounded-xl transition-all",
            selectedCount > 0
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:border-primary/40"
          )}
        >
          {selectedCount > 0 ? (
            <FileText className="h-4 w-4" />
          ) : (
            <FileX className="h-4 w-4" />
          )}
          {selectedCount > 0
            ? `${selectedCount} Report${selectedCount > 1 ? "s" : ""} Selected`
            : "Include Reports"}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>

        {/* Select all / Clear */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <span className="text-[11px] text-muted-foreground">
            {reports?.length ?? 0} report{(reports?.length ?? 0) !== 1 ? "s" : ""} available
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Select all
            </button>
            <button
              onClick={clearAll}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Reports List */}
        <ScrollArea className="max-h-60">
          {!reports ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : filteredReports && filteredReports.length > 0 ? (
            <div className="p-1">
              {filteredReports.map((report) => {
                const isSelected = selectedReportIds.includes(report._id);
                return (
                  <div
                    key={report._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleReport(report._id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleReport(report._id); } }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/80 cursor-pointer",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {report.fileName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {report.fileType.toUpperCase()}
                        {report.criticalFlags && report.criticalFlags.length > 0 && (
                          <span className="ml-1.5 text-amber-500">
                            • {report.criticalFlags.length} flag{report.criticalFlags.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <Badge
                        variant="secondary"
                        className="h-5 shrink-0 text-[10px] bg-primary/10 text-primary px-1.5"
                      >
                        ✓
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileX className="mx-auto mb-2 h-6 w-6 opacity-40" />
              <p className="text-xs">
                {searchQuery ? "No reports match your search" : "No reports uploaded yet"}
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Legacy ConversationList export (kept for compatibility) ─── */

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

/* ─── AI Chat Window ─── */

interface AIChatWindowProps {
  currentUserId: string;
  selectedReportIds?: string[];
  includeMemory?: boolean;
  onConversationsChange?: (conversations: any[], activeId: string | null, handlers: {
    newChat: () => void;
    selectConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
  }) => void;
}

export function AIChatWindow({
  currentUserId,
  selectedReportIds,
  includeMemory = true,
  onConversationsChange,
}: AIChatWindowProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<{
    conversationId: string;
    sentAt: number;
  } | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Queries
  const conversations = useQuery(
    api.queries.aiChat.getConversations,
    currentUserId ? { userClerkId: currentUserId } : "skip"
  );

  const messages = useQuery(
    api.queries.aiChat.getMessages,
    currentUserId && activeConversationId
      ? { userClerkId: currentUserId, conversationId: activeConversationId }
      : "skip"
  );

  const sendMessageMutation = useMutation(api.mutations.aiChat.sendMessage);
  const createConversation = useMutation(api.mutations.aiChat.createConversation);
  const deleteConversation = useMutation(api.mutations.aiChat.deleteConversation);

  // Expose conversation data + handlers to parent for top-bar buttons
  useEffect(() => {
    if (onConversationsChange) {
      onConversationsChange(
        conversations ?? [],
        activeConversationId,
        {
          newChat: handleNewChatInternal,
          selectConversation: (id: string) => setActiveConversationId(id),
          deleteConversation: handleDeleteConversationInternal,
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeConversationId]);

  const handleNewChatInternal = async () => {
    if (!currentUserId) return;
    try {
      const convId = await createConversation({
        userClerkId: currentUserId,
        title: "New Chat",
      });
      setActiveConversationId(convId);
    } catch {
      toast.error("Failed to create new chat.");
    }
  };

  const handleDeleteConversationInternal = async (convId: string) => {
    try {
      await deleteConversation({
        conversationId: convId as any,
      });
      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
      toast.success("Conversation deleted.");
    } catch {
      toast.error("Failed to delete conversation.");
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Keep "thinking" state active until assistant response actually appears in the conversation
  useEffect(() => {
    if (!isLoading || !pendingResponse || !messages) return;
    if (activeConversationId !== pendingResponse.conversationId) return;

    const hasAssistantReply = messages.some(
      (msg) => msg.role === "assistant" && msg._creationTime >= pendingResponse.sentAt - 5000
    );

    if (hasAssistantReply) {
      setIsLoading(false);
      setPendingResponse(null);
    }
  }, [messages, isLoading, pendingResponse, activeConversationId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleNewChat = handleNewChatInternal;

  const handleDeleteConversation = handleDeleteConversationInternal;

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || isLoading) return;

    let convId = activeConversationId;

    // Auto-create conversation if none active
    if (!convId) {
      try {
        const title = trimmed.length > 40 ? trimmed.slice(0, 40) + "..." : trimmed;
        convId = await createConversation({
          userClerkId: currentUserId,
          title,
        });
        setActiveConversationId(convId);
      } catch {
        toast.error("Failed to start chat.");
        return;
      }
    }

    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const sentAt = Date.now();
    setPendingResponse({ conversationId: convId, sentAt });
    setIsLoading(true);

    try {
      await sendMessageMutation({
        userClerkId: currentUserId,
        message: trimmed,
        conversationId: convId,
        reportIds:
          selectedReportIds && selectedReportIds.length > 0
            ? selectedReportIds
            : undefined,
        useMemory: includeMemory,
      });
    } catch (error) {
      console.error("AI chat error:", error);
      setPendingResponse(null);
      setIsLoading(false);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages
    ? messages.reduce(
        (groups, msg) => {
          const date = new Date(msg._creationTime);
          let label: string;
          if (isToday(date)) label = "Today";
          else if (isYesterday(date)) label = "Yesterday";
          else label = format(date, "MMMM d, yyyy");

          if (!groups[label]) groups[label] = [];
          groups[label].push(msg);
          return groups;
        },
        {} as Record<string, typeof messages>
      )
    : {};

  // Quick suggestions for empty state
  const quickSuggestions = [
    { icon: "💊", text: "Explain my medications" },
    { icon: "📋", text: "Summarize my latest report" },
    { icon: "🩺", text: "What does my diagnosis mean?" },
    { icon: "🥗", text: "Diet tips for my condition" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-1 px-4 py-3">
          {!activeConversationId || !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent shadow-inner">
                <Sparkles className="h-10 w-10 text-emerald-500/70" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                How can I help you today?
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground/80">
                Ask about your health, medications, reports, or any medical
                questions you have.
              </p>
              {/* Quick Suggestions */}
              <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                {quickSuggestions.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => {
                      setMessage(s.text);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-center gap-2.5 rounded-xl border bg-background/80 px-3.5 py-3 text-left text-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-muted-foreground">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 py-4">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[11px] font-medium text-muted-foreground/70 select-none">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="space-y-4">
                  {msgs.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex items-end gap-2.5",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isUser && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 mb-5">
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] group",
                            isUser ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md",
                              isUser
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted/60 border border-border/50 rounded-bl-md"
                            )}
                          >
                            {isUser ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:leading-relaxed prose-p:my-1.5 prose-headings:my-2 prose-headings:font-semibold prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-strong:font-semibold prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-3 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-table:text-xs prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-hr:my-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                          <p
                            className={cn(
                              "mt-1 px-1 text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity",
                              isUser ? "text-right" : "text-left"
                            )}
                          >
                            {format(new Date(msg._creationTime), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-end gap-2.5 justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 mb-5 animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-2xl bg-muted/60 border border-border/50 rounded-bl-md px-4 py-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-[pulse_1.4s_ease-in-out_infinite]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    Analyzing and generating response<span className="inline-flex w-[18px]"><span className="animate-[ellipsis_1.5s_steps(4,end)_infinite] overflow-hidden whitespace-nowrap inline-block w-0" style={{ animationFillMode: 'forwards' }}>...</span></span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="border-t bg-background px-6 py-4 shrink-0">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 transition-all duration-200 focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-lg focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeConversationId
                  ? "Type your message..."
                  : "Start a new conversation..."
              }
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:outline-none disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className={cn(
                "h-9 w-9 shrink-0 rounded-xl transition-all duration-200",
                message.trim() && !isLoading
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/40">
            AI responses are informational only. Always consult your doctor for
            medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Doctor Contact List (for patients) ─── */

interface DoctorContactListProps {
  patientClerkId: string;
  onSelectDoctor: (clerkId: string, name: string) => void;
  selectedDoctor?: string;
}

export function DoctorContactList({
  patientClerkId,
  onSelectDoctor,
  selectedDoctor,
}: DoctorContactListProps) {
  const appointedDoctors = useQuery(
    api.queries.appointments.getDoctorsForPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  if (!appointedDoctors) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (appointedDoctors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-4">
        <div className="mb-3 rounded-full bg-muted/50 p-3">
          <Stethoscope className="h-6 w-6 opacity-40" />
        </div>
        <p className="text-sm font-medium">No doctors yet</p>
        <p className="mt-1 text-xs leading-relaxed">
          Book an appointment with a doctor to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {appointedDoctors.map((doc) => {
        if (!doc) return null;
        const isSelected = selectedDoctor === doc.clerkUserId;
        const initials = doc.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <button
            key={doc.clerkUserId}
            onClick={() => onSelectDoctor(doc.clerkUserId, doc.name)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-muted/80",
              isSelected && "bg-primary/5 border border-primary/20"
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="truncate text-sm font-medium block">
                {doc.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {doc.specialization}
              </span>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground/40" />
          </button>
        );
      })}
    </div>
  );
}

/* ─── Patient Contact List (for doctors) ─── */

interface PatientContactListProps {
  doctorClerkId: string;
  onSelectPatient: (clerkId: string, name: string) => void;
  selectedPatient?: string;
}

export function PatientContactList({
  doctorClerkId,
  onSelectPatient,
  selectedPatient,
}: PatientContactListProps) {
  const appointedPatients = useQuery(
    api.queries.appointments.getPatientsForDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  if (!appointedPatients) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (appointedPatients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-4">
        <div className="mb-3 rounded-full bg-muted/50 p-3">
          <User className="h-6 w-6 opacity-40" />
        </div>
        <p className="text-sm font-medium">No patients yet</p>
        <p className="mt-1 text-xs leading-relaxed">
          Patients who book appointments with you will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {appointedPatients.map((patient) => {
        if (!patient) return null;
        const isSelected = selectedPatient === patient.clerkUserId;
        const initials = patient.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <button
            key={patient.clerkUserId}
            onClick={() => onSelectPatient(patient.clerkUserId, patient.name)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-muted/80",
              isSelected && "bg-primary/5 border border-primary/20"
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="truncate text-sm font-medium block">
                {patient.name}
              </span>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground/40" />
          </button>
        );
      })}
    </div>
  );
}