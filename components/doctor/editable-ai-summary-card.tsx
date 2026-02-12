"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Pill,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface AISummary {
  chiefComplaint?: string;
  diagnosis?: string;
  prescriptions?: Prescription[] | string;
  followUpActions?: string[];
  keyDecisions?: string[];
  comparisonWithPrevious?: string;
}

interface EditableAISummaryCardProps {
  summary?: AISummary | string;
  isLoading?: boolean;
  className?: string;
  onSave?: (summary: AISummary) => Promise<void>;
  isSaving?: boolean;
}

export function EditableAISummaryCard({
  summary,
  isLoading,
  className,
  onSave,
  isSaving,
}: EditableAISummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<AISummary | null>(null);

  // Parse summary from string or object, normalizing snake_case to camelCase
  const parsedSummary: AISummary | null =
    typeof summary === "string"
      ? (() => {
          try {
            const raw = JSON.parse(summary);
            // Handle prescriptions - convert string to array if needed
            let prescriptions: Prescription[] = [];
            if (Array.isArray(raw.prescriptions)) {
              prescriptions = raw.prescriptions;
            } else if (typeof raw.prescriptions === "string" && raw.prescriptions) {
              try {
                const parsed = JSON.parse(raw.prescriptions);
                prescriptions = Array.isArray(parsed) ? parsed : [];
              } catch {
                prescriptions = [
                  {
                    medication: raw.prescriptions,
                    dosage: "",
                    frequency: "",
                    duration: "",
                    instructions: "",
                  },
                ];
              }
            }
            return {
              chiefComplaint: raw.chiefComplaint ?? raw.chief_complaint,
              diagnosis: raw.diagnosis,
              prescriptions,
              followUpActions: raw.followUpActions ?? raw.follow_up_actions,
              keyDecisions: raw.keyDecisions ?? raw.key_decisions,
              comparisonWithPrevious:
                raw.comparisonWithPrevious ?? raw.comparison_with_previous,
            };
          } catch {
            return { chiefComplaint: summary };
          }
        })()
      : summary ?? null;

  const handleStartEdit = () => {
    setEditedSummary(parsedSummary);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedSummary(parsedSummary);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editedSummary && onSave) {
      await onSave(editedSummary);
      setIsEditing(false);
    }
  };

  const updateField = (field: keyof AISummary, value: unknown) => {
    if (editedSummary) {
      setEditedSummary({ ...editedSummary, [field]: value });
    }
  };

  const addKeyDecision = () => {
    if (editedSummary) {
      const current = editedSummary.keyDecisions ?? [];
      setEditedSummary({
        ...editedSummary,
        keyDecisions: [...current, ""],
      });
    }
  };

  const updateKeyDecision = (index: number, value: string) => {
    if (editedSummary) {
      const current = [...(editedSummary.keyDecisions ?? [])];
      current[index] = value;
      setEditedSummary({ ...editedSummary, keyDecisions: current });
    }
  };

  const removeKeyDecision = (index: number) => {
    if (editedSummary) {
      const current = [...(editedSummary.keyDecisions ?? [])];
      current.splice(index, 1);
      setEditedSummary({ ...editedSummary, keyDecisions: current });
    }
  };

  const addFollowUp = () => {
    if (editedSummary) {
      const current = editedSummary.followUpActions ?? [];
      setEditedSummary({
        ...editedSummary,
        followUpActions: [...current, ""],
      });
    }
  };

  const updateFollowUp = (index: number, value: string) => {
    if (editedSummary) {
      const current = [...(editedSummary.followUpActions ?? [])];
      current[index] = value;
      setEditedSummary({ ...editedSummary, followUpActions: current });
    }
  };

  const removeFollowUp = (index: number) => {
    if (editedSummary) {
      const current = [...(editedSummary.followUpActions ?? [])];
      current.splice(index, 1);
      setEditedSummary({ ...editedSummary, followUpActions: current });
    }
  };

  const prescriptions = Array.isArray(editedSummary?.prescriptions)
    ? editedSummary.prescriptions
    : [];

  const addPrescription = () => {
    if (editedSummary) {
      const current = prescriptions;
      setEditedSummary({
        ...editedSummary,
        prescriptions: [
          ...current,
          {
            medication: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
          },
        ],
      });
    }
  };

  const updatePrescription = (
    index: number,
    field: keyof Prescription,
    value: string
  ) => {
    if (editedSummary) {
      const current = [...prescriptions];
      current[index] = { ...current[index], [field]: value };
      setEditedSummary({ ...editedSummary, prescriptions: current });
    }
  };

  const removePrescription = (index: number) => {
    if (editedSummary) {
      const current = [...prescriptions];
      current.splice(index, 1);
      setEditedSummary({ ...editedSummary, prescriptions: current });
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!parsedSummary) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
            <Brain className="h-5 w-5" />
            AI Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <FileText className="mb-3 h-12 w-12 opacity-40" />
            <p>No summary available yet.</p>
            <p className="text-sm">
              Record and process the session to generate an AI summary.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displaySummary = isEditing ? editedSummary : parsedSummary;
  const displayPrescriptions = Array.isArray(displaySummary?.prescriptions)
    ? displaySummary.prescriptions
    : [];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Session Summary
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-1 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={handleStartEdit}>
                <Edit2 className="mr-1 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Chief Complaint */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Chief Complaint
          </div>
          {isEditing ? (
            <Input
              value={editedSummary?.chiefComplaint ?? ""}
              onChange={(e) => updateField("chiefComplaint", e.target.value)}
              placeholder="Enter chief complaint"
            />
          ) : (
            <p className="text-foreground">
              {displaySummary?.chiefComplaint || "Not specified"}
            </p>
          )}
        </div>

        {/* Diagnosis */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" />
            Diagnosis
          </div>
          {isEditing ? (
            <Textarea
              value={editedSummary?.diagnosis ?? ""}
              onChange={(e) => updateField("diagnosis", e.target.value)}
              placeholder="Enter diagnosis"
              rows={3}
            />
          ) : (
            <p className="text-foreground">
              {displaySummary?.diagnosis || "Not specified"}
            </p>
          )}
        </div>

        <Separator />

        {/* Prescriptions */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Pill className="h-4 w-4" />
              Prescriptions
            </div>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={addPrescription}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </div>
          {displayPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {displayPrescriptions.map((prescription, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-muted/30 p-3 space-y-2"
                >
                  {isEditing ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Prescription {i + 1}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => removePrescription(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Medication"
                          value={prescription.medication}
                          onChange={(e) =>
                            updatePrescription(i, "medication", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Dosage (e.g., 500mg)"
                          value={prescription.dosage}
                          onChange={(e) =>
                            updatePrescription(i, "dosage", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Frequency (e.g., twice daily)"
                          value={prescription.frequency}
                          onChange={(e) =>
                            updatePrescription(i, "frequency", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Duration (e.g., 7 days)"
                          value={prescription.duration}
                          onChange={(e) =>
                            updatePrescription(i, "duration", e.target.value)
                          }
                        />
                      </div>
                      <Input
                        placeholder="Instructions (e.g., take with food)"
                        value={prescription.instructions}
                        onChange={(e) =>
                          updatePrescription(i, "instructions", e.target.value)
                        }
                      />
                    </>
                  ) : (
                    <div className="space-y-1">
                      <div className="font-medium">{prescription.medication}</div>
                      <div className="text-sm text-muted-foreground">
                        {prescription.dosage && (
                          <span>{prescription.dosage}</span>
                        )}
                        {prescription.frequency && (
                          <span> • {prescription.frequency}</span>
                        )}
                        {prescription.duration && (
                          <span> • {prescription.duration}</span>
                        )}
                      </div>
                      {prescription.instructions && (
                        <div className="text-sm italic text-muted-foreground">
                          {prescription.instructions}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "No prescriptions. Click 'Add' to add one."
                : "No prescriptions specified"}
            </p>
          )}
        </div>

        {/* Key Decisions */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Key Decisions
            </div>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={addKeyDecision}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </div>
          {(displaySummary?.keyDecisions?.length ?? 0) > 0 ? (
            <ul className="space-y-3">
              {displaySummary?.keyDecisions?.map((decision, i) => (
                <li key={i} className="flex items-start gap-2">
                  {isEditing ? (
                    <>
                      <Badge
                        variant="outline"
                        className="mt-2.5 h-5 w-5 shrink-0 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {i + 1}
                      </Badge>
                      <Textarea
                        value={decision}
                        onChange={(e) => updateKeyDecision(i, e.target.value)}
                        placeholder="Enter key decision"
                        className="flex-1 min-h-[60px] resize-none"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1.5 h-8 w-8 p-0 text-destructive shrink-0"
                        onClick={() => removeKeyDecision(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        className="mt-0.5 h-5 w-5 shrink-0 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {i + 1}
                      </Badge>
                      <span className="text-sm">{decision}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "No key decisions. Click 'Add' to add one."
                : "No key decisions recorded"}
            </p>
          )}
        </div>

        {/* Follow-up Actions */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Follow-up Actions
            </div>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={addFollowUp}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </div>
          {(displaySummary?.followUpActions?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {displaySummary?.followUpActions?.map((action, i) =>
                isEditing ? (
                  <div key={i} className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="mt-2.5 h-5 w-5 shrink-0 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {i + 1}
                    </Badge>
                    <Textarea
                      value={action}
                      onChange={(e) => updateFollowUp(i, e.target.value)}
                      placeholder="Enter follow-up action"
                      className="flex-1 min-h-[60px] resize-none"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1.5 h-8 w-8 p-0 text-destructive shrink-0"
                      onClick={() => removeFollowUp(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge key={i} variant="secondary" className="mr-2">
                    {action}
                  </Badge>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "No follow-up actions. Click 'Add' to add one."
                : "No follow-up actions specified"}
            </p>
          )}
        </div>

        {/* Comparison with Previous */}
        {displaySummary?.comparisonWithPrevious && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2 text-sm font-medium text-primary">
              Changes from Previous Visit
            </div>
            {isEditing ? (
              <Textarea
                value={editedSummary?.comparisonWithPrevious ?? ""}
                onChange={(e) =>
                  updateField("comparisonWithPrevious", e.target.value)
                }
                rows={2}
              />
            ) : (
              <p className="text-sm">{displaySummary.comparisonWithPrevious}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
