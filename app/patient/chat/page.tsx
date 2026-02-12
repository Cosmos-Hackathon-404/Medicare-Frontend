"use client";

import { useState, useEffect, useCallback } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquarePlus,
  History,
  MessageSquare,
  Trash2,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [includeMemory, setIncludeMemory] = useState(true);

  // AI chat state exposed from AIChatWindow
  const [aiConversations, setAiConversations] = useState<any[]>([]);
  const [aiActiveId, setAiActiveId] = useState<string | null>(null);
  const [aiHandlers, setAiHandlers] = useState<{
    newChat: () => void;
    selectConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
  } | null>(null);

  const handleConversationsChange = useCallback(
    (conversations: any[], activeId: string | null, handlers: any) => {
      setAiConversations(conversations);
      setAiActiveId(activeId);
      setAiHandlers(handlers);
    },
    []
  );

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
    <div className="flex h-[calc(100vh-4rem)] flex-col -m-4 md:-m-6 lg:-m-8">
      {/* ── Compact Top Bar ── */}
      <div className="flex items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          {/* Tab Switcher — compact pill style */}
          <div className="flex gap-0.5 rounded-lg bg-muted/60 p-0.5">
            <button
              onClick={() => setActiveTab("ai")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === "ai"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab("doctor")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === "doctor"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor
            </button>
          </div>

          {activeTab === "doctor" && !selectedPartner && (
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

        <div className="flex items-center gap-1.5">
          <ReportPicker
            patientClerkId={patientClerkId}
            selectedReportIds={selectedReportIds}
            onSelectionChange={setSelectedReportIds}
          />

          {/* AI Chat controls — Memory toggle + New Chat + History */}
          {activeTab === "ai" && aiHandlers && (
            <>
              {/* Memory toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={includeMemory ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 transition-all",
                        includeMemory
                          ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setIncludeMemory((v) => !v)}
                    >
                      <BrainCircuit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {includeMemory
                      ? "Memory ON — AI uses your profile & reports"
                      : "Memory OFF — AI uses only this chat"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* New Chat */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => aiHandlers.newChat()}
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-normal">
                      Chat History
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
                      onClick={() => aiHandlers.newChat()}
                    >
                      <MessageSquarePlus className="h-3 w-3" />
                      New
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {aiConversations.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto mb-2 h-5 w-5 opacity-40" />
                      <p className="text-xs">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      {aiConversations.map((conv: any) => {
                        const isActive = aiActiveId === conv._id;
                        return (
                          <DropdownMenuItem
                            key={conv._id}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer rounded-lg py-2.5 group",
                              isActive && "bg-primary/5"
                            )}
                            onClick={() =>
                              aiHandlers.selectConversation(conv._id)
                            }
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {conv.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(
                                  new Date(conv.lastMessageTime),
                                  "MMM d, h:mm a"
                                )}{" "}
                                &bull; {conv.messageCount} msg
                                {conv.messageCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                aiHandlers.deleteConversation(conv._id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

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

      {/* ── Chat Area — takes all remaining space ── */}
      <div className="flex-1 min-h-0">
        {activeTab === "ai" ? (
          <AIChatWindow
            currentUserId={patientClerkId}
            selectedReportIds={selectedReportIds}
            includeMemory={includeMemory}
            onConversationsChange={handleConversationsChange}
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
          <div className="flex h-full">
            {/* Doctor List — collapsible sidebar */}
            {sidebarOpen && (
              <div className="w-60 shrink-0 border-r bg-background/60 overflow-y-auto">
                <div className="px-3 py-2.5 border-b">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Doctors
                  </h3>
                </div>
                <DoctorContactList
                  patientClerkId={patientClerkId}
                  onSelectDoctor={(clerkId, name) =>
                    setSelectedPartner({ clerkId, name })
                  }
                  selectedDoctor={undefined}
                />
              </div>
            )}

            {/* Empty state */}
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-sm text-center space-y-4 p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                  <Stethoscope className="h-8 w-8 text-primary/70" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Select a Doctor
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Choose a doctor from the sidebar to start chatting.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2 text-left">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary/60" />
                    <p className="text-[11px] text-muted-foreground">
                      Use{" "}
                      <span className="font-medium text-foreground">
                        Include Reports
                      </span>{" "}
                      to share medical data in chat.
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
