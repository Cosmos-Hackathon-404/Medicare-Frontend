"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Utensils,
  Dumbbell,
  Moon,
  Brain,
  RefreshCw,
  Clock,
  ChevronRight,
  Droplets,
  Pill,
  Apple,
  Ban,
  Target,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Salad,
  Heart,
  Shield,
  CalendarCheck,
  Database,
  Flame,
  User,
  Activity,
  FileText,
  Mic,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type {
  WellnessNutrition,
  WellnessExercise,
  WellnessLifestyle,
  WellnessMentalHealth,
  WellnessMeal,
  ExerciseRoutine,
} from "@/types";

export default function WellnessPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("nutrition");

  const latestPlan = useQuery(
    api.queries.wellnessPlans.getLatest,
    user?.id ? { patientClerkId: user.id } : "skip"
  );

  const dataReadiness = useQuery(
    api.queries.wellnessPlans.getDataReadiness,
    user?.id ? { patientClerkId: user.id } : "skip"
  );

  const createPlan = useMutation(api.mutations.wellnessPlans.create);
  const deletePlan = useMutation(api.mutations.wellnessPlans.deletePlan);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!user?.id) return;
    if (dataReadiness && !dataReadiness.ready) {
      toast.error("Not enough data to generate a wellness plan", {
        description: dataReadiness.missingHint ?? "Please add more medical data first.",
      });
      return;
    }
    setIsGenerating(true);
    try {
      await createPlan({ patientClerkId: user.id });
      toast.success("Generating your personalized wellness plan...", {
        description:
          "AI is analyzing your complete medical history. This may take a minute.",
      });
    } catch (error) {
      toast.error("Failed to start plan generation", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!user?.id || !latestPlan) return;
    setIsGenerating(true);
    try {
      // Delete previous and create new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await deletePlan({ planId: latestPlan._id as any });
      await createPlan({ patientClerkId: user.id });
      toast.success("Regenerating your wellness plan...", {
        description:
          "AI is re-analyzing your latest data for an updated plan.",
      });
    } catch {
      toast.error("Failed to regenerate plan");
    } finally {
      setIsGenerating(false);
    }
  };

  if (latestPlan === undefined || dataReadiness === undefined) {
    return <WellnessPageSkeleton />;
  }

  // No plan exists yet — show readiness check
  if (!latestPlan) {
    return (
      <EmptyWellnessState
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        readiness={dataReadiness}
      />
    );
  }

  // Plan is generating
  if (latestPlan.status === "generating") {
    return <GeneratingState />;
  }

  // Plan failed
  if (latestPlan.status === "failed") {
    return (
      <FailedState
        errorMessage={latestPlan.errorMessage}
        onRetry={handleRegenerate}
        isGenerating={isGenerating}
      />
    );
  }

  // Plan completed — show the full plan
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Your Wellness Plan
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-generated personalized plan based on your complete medical history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isGenerating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1.5 py-1">
          <Clock className="h-3.5 w-3.5" />
          Generated {formatDistanceToNow(new Date(latestPlan.generatedAt), { addSuffix: true })}
        </Badge>
        {latestPlan.aiConfidence && (
          <Badge
            variant={
              latestPlan.aiConfidence === "high"
                ? "default"
                : latestPlan.aiConfidence === "medium"
                  ? "secondary"
                  : "outline"
            }
            className="gap-1.5 py-1"
          >
            <Shield className="h-3.5 w-3.5" />
            {latestPlan.aiConfidence.charAt(0).toUpperCase() + latestPlan.aiConfidence.slice(1)}{" "}
            Confidence
          </Badge>
        )}
        {latestPlan.reviewDate && (
          <Badge variant="outline" className="gap-1.5 py-1">
            <CalendarCheck className="h-3.5 w-3.5" />
            {latestPlan.reviewDate}
          </Badge>
        )}
        {latestPlan.dataSources && latestPlan.dataSources.length > 0 && (
          <Badge variant="outline" className="gap-1.5 py-1">
            <Database className="h-3.5 w-3.5" />
            {latestPlan.dataSources.length} data sources
          </Badge>
        )}
      </div>

      {/* Data Sources */}
      {latestPlan.dataSources && latestPlan.dataSources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Data Sources Used
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Your wellness plan was personalized using the following data from your medical history
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {latestPlan.dataSources.map((source: string, i: number) => {
                const info = getDataSourceInfo(source);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${info.bgColor}`}>
                      <info.icon className={`h-4.5 w-4.5 ${info.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{info.label}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nutrition" className="gap-1.5">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Nutrition</span>
          </TabsTrigger>
          <TabsTrigger value="exercise" className="gap-1.5">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Exercise</span>
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="gap-1.5">
            <Moon className="h-4 w-4" />
            <span className="hidden sm:inline">Lifestyle</span>
          </TabsTrigger>
          <TabsTrigger value="mental" className="gap-1.5">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Mental</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nutrition" className="mt-6">
          <NutritionTab nutrition={latestPlan.nutrition} />
        </TabsContent>
        <TabsContent value="exercise" className="mt-6">
          <ExerciseTab exercise={latestPlan.exercise} />
        </TabsContent>
        <TabsContent value="lifestyle" className="mt-6">
          <LifestyleTab lifestyle={latestPlan.lifestyle} />
        </TabsContent>
        <TabsContent value="mental" className="mt-6">
          <MentalWellnessTab mentalWellness={latestPlan.mentalWellness} />
        </TabsContent>
      </Tabs>

      {/* Additional Notes */}
      {latestPlan.additionalNotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {latestPlan.additionalNotes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Nutrition Tab =====
function NutritionTab({ nutrition }: { nutrition?: WellnessNutrition }) {
  if (!nutrition) {
    return <EmptySectionCard title="Nutrition Plan" message="No nutrition data available in this plan." />;
  }

  return (
    <div className="space-y-6">
      {/* Calorie & Macro Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {nutrition.dailyCalorieTarget && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Calorie Target</p>
                  <p className="text-xl font-bold">{nutrition.dailyCalorieTarget}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {nutrition.macroSplit && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground mb-3">Macro Split</p>
              <div className="flex gap-4">
                <MacroBadge label="Protein" value={nutrition.macroSplit.protein} color="bg-blue-500" />
                <MacroBadge label="Carbs" value={nutrition.macroSplit.carbs} color="bg-amber-500" />
                <MacroBadge label="Fats" value={nutrition.macroSplit.fats} color="bg-rose-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Meal Plan */}
      {nutrition.meals && nutrition.meals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Salad className="h-4 w-4 text-green-500" />
              Daily Meal Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nutrition.meals.map((meal: WellnessMeal, i: number) => (
                <div key={i}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{meal.name}</h4>
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          {meal.time}
                        </Badge>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {meal.items?.map((item: string, j: number) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-primary/60" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {meal.notes && (
                        <p className="mt-2 text-xs text-primary/80 italic flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {meal.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Foods to Include / Avoid */}
      <div className="grid gap-4 md:grid-cols-2">
        {nutrition.foodsToInclude && nutrition.foodsToInclude.length > 0 && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                <Apple className="h-4 w-4" />
                Foods to Include
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {nutrition.foodsToInclude.map((food: string, i: number) => (
                  <Badge key={i} variant="outline" className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {food}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {nutrition.foodsToAvoid && nutrition.foodsToAvoid.length > 0 && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                <Ban className="h-4 w-4" />
                Foods to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {nutrition.foodsToAvoid.map((food: string, i: number) => (
                  <Badge key={i} variant="outline" className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                    <Ban className="mr-1 h-3 w-3" />
                    {food}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hydration & Supplements */}
      <div className="grid gap-4 md:grid-cols-2">
        {nutrition.hydration && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                Hydration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{nutrition.hydration}</p>
            </CardContent>
          </Card>
        )}

        {nutrition.supplements && nutrition.supplements.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-purple-500" />
                Supplements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {nutrition.supplements.map((supp: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-purple-500/60" />
                    {supp}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ===== Exercise Tab =====
function ExerciseTab({ exercise }: { exercise?: WellnessExercise }) {
  if (!exercise) {
    return <EmptySectionCard title="Exercise Plan" message="No exercise data available in this plan." />;
  }

  const intensityColor = (intensity: string) => {
    const lower = intensity.toLowerCase();
    if (lower.includes("high")) return "destructive";
    if (lower.includes("moderate") || lower.includes("medium")) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Weekly Goal & Restrictions */}
      <div className="grid gap-4 md:grid-cols-2">
        {exercise.weeklyGoal && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Goal</p>
                  <p className="text-lg font-bold">{exercise.weeklyGoal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {exercise.restrictions && exercise.restrictions.length > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Restrictions</p>
                  <ul className="space-y-1">
                    {exercise.restrictions.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Routines */}
      {exercise.routines && exercise.routines.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {exercise.routines.map((routine: ExerciseRoutine, i: number) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{routine.day}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={intensityColor(routine.intensity)} className="text-xs">
                      {routine.intensity}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {routine.duration}
                    </Badge>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit text-xs mt-1">
                  {routine.type}
                </Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {routine.exercises?.map((ex: string, j: number) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Dumbbell className="h-3 w-3 text-primary/60 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
                {routine.notes && (
                  <p className="mt-3 text-xs text-primary/80 italic flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {routine.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Lifestyle Tab =====
function LifestyleTab({ lifestyle }: { lifestyle?: WellnessLifestyle }) {
  if (!lifestyle) {
    return <EmptySectionCard title="Lifestyle" message="No lifestyle data available in this plan." />;
  }

  return (
    <div className="space-y-6">
      {/* Sleep */}
      {(lifestyle.sleepRecommendation || (lifestyle.sleepTips && lifestyle.sleepTips.length > 0)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-500" />
              Sleep
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lifestyle.sleepRecommendation && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <Target className="h-5 w-5 text-indigo-500" />
                <p className="text-sm font-medium">{lifestyle.sleepRecommendation}</p>
              </div>
            )}
            {lifestyle.sleepTips && lifestyle.sleepTips.length > 0 && (
              <ul className="space-y-2">
                {lifestyle.sleepTips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500/60 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stress Management */}
      {lifestyle.stressManagement && lifestyle.stressManagement.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Stress Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lifestyle.stressManagement.map((item: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-500/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Healthy Habits */}
      {lifestyle.habits && lifestyle.habits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Daily Habits to Build
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {lifestyle.habits.map((habit: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs font-bold">
                    {i + 1}
                  </div>
                  {habit}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Mental Wellness Tab =====
function MentalWellnessTab({ mentalWellness }: { mentalWellness?: WellnessMentalHealth }) {
  if (!mentalWellness) {
    return <EmptySectionCard title="Mental Wellness" message="No mental wellness data available in this plan." />;
  }

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      {mentalWellness.recommendations && mentalWellness.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mentalWellness.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500/60 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Activities */}
      {mentalWellness.activities && mentalWellness.activities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Recommended Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mentalWellness.activities.map((activity: string, i: number) => (
                <Badge key={i} variant="secondary" className="py-1.5 px-3 text-sm">
                  {activity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Signs */}
      {mentalWellness.warningSignsToWatch && mentalWellness.warningSignsToWatch.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Warning Signs to Watch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mentalWellness.warningSignsToWatch.map((sign: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500/60 shrink-0" />
                  {sign}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground italic">
              If you experience any of these signs, please reach out to your doctor or a mental health professional.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Helper Components =====

function getDataSourceInfo(source: string): {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  bgColor: string;
  iconColor: string;
} {
  const lower = source.toLowerCase();

  if (lower.includes("patient profile")) {
    return {
      icon: User,
      label: "Patient Profile",
      description: "Age, blood group, allergies & medical info",
      bgColor: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    };
  }
  if (lower.includes("vital")) {
    const count = source.match(/\d+/)?.[0] ?? "";
    return {
      icon: Activity,
      label: `Vital Readings`,
      description: count ? `${count} recorded measurements analyzed` : "Health metrics analyzed",
      bgColor: "bg-rose-100 dark:bg-rose-900/40",
      iconColor: "text-rose-600 dark:text-rose-400",
    };
  }
  if (lower.includes("report")) {
    const count = source.match(/\d+/)?.[0] ?? "";
    return {
      icon: FileText,
      label: "Medical Reports",
      description: count ? `${count} reports with AI analysis` : "Lab results & diagnostics",
      bgColor: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    };
  }
  if (lower.includes("session")) {
    const count = source.match(/\d+/)?.[0] ?? "";
    return {
      icon: Mic,
      label: "Doctor Sessions",
      description: count ? `${count} session transcripts & diagnoses` : "Past consultation records",
      bgColor: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
    };
  }
  if (lower.includes("alert")) {
    const count = source.match(/\d+/)?.[0] ?? "";
    return {
      icon: AlertTriangle,
      label: "Critical Alerts",
      description: count ? `${count} active alerts factored in` : "Health warnings considered",
      bgColor: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
    };
  }
  if (lower.includes("supermemory") || lower.includes("memory")) {
    return {
      icon: Zap,
      label: "AI Memory Context",
      description: "Complete history from memory layer",
      bgColor: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
    };
  }

  return {
    icon: Database,
    label: source,
    description: "Additional health data",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
  };
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function EmptySectionCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Info className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <h3 className="font-medium text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground/60 mt-1">{message}</p>
      </CardContent>
    </Card>
  );
}

interface DataReadiness {
  ready: boolean;
  dataPoints: number;
  totalPossible: number;
  sources: {
    key: string;
    label: string;
    description: string;
    present: boolean;
    sufficient: boolean;
  }[];
  missingHint: string | null;
}

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  profile: User,
  vitals: Activity,
  reports: FileText,
  sessions: Mic,
};

const sourceLinks: Record<string, string> = {
  profile: "/patient/settings",
  vitals: "/patient/health-trends",
  reports: "/patient/reports",
  sessions: "/patient/sessions",
};

const sourceActions: Record<string, string> = {
  profile: "Complete Profile",
  vitals: "Record Vitals",
  reports: "Upload Report",
  sessions: "View Sessions",
};

function EmptyWellnessState({
  onGenerate,
  isGenerating,
  readiness,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
  readiness: DataReadiness;
}) {
  const readyPercent = Math.round((readiness.dataPoints / readiness.totalPossible) * 100);
  const isReady = readiness.ready;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Personalized Wellness Plan</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          AI analyzes your medical history to generate a personalized nutrition,
          exercise, and lifestyle plan tailored to you.
        </p>
      </div>

      {/* Data Readiness Card */}
      <Card className={isReady ? "border-green-200 dark:border-green-800" : "border-yellow-200 dark:border-yellow-800"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Readiness
            </CardTitle>
            <Badge variant={isReady ? "default" : "secondary"} className="gap-1">
              {isReady ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Ready to generate
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  More data needed
                </>
              )}
            </Badge>
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Data completeness</span>
              <span>{readiness.dataPoints}/{readiness.totalPossible} sources available</span>
            </div>
            <Progress
              value={readyPercent}
              className="h-2"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {readiness.sources.map((source) => {
            const Icon = sourceIcons[source.key] ?? Database;
            return (
              <div
                key={source.key}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  source.present
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                    : "border-dashed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      source.present
                        ? "bg-green-100 dark:bg-green-900/40"
                        : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        source.present
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{source.label}</p>
                      {source.present ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          Missing
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                </div>
                {!source.present && sourceLinks[source.key] && (
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={sourceLinks[source.key]}>
                      {sourceActions[source.key] ?? "Add Data"}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Hint message when not ready */}
      {!isReady && readiness.missingHint && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardContent className="flex items-start gap-3 pt-4 pb-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Not enough data for a personalized plan
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {readiness.missingHint}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What you'll get */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground text-center">
          Your plan will include
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FeaturePreview icon={Utensils} label="Nutrition Plan" description="Meals, calories, macros" />
          <FeaturePreview icon={Dumbbell} label="Exercise Plan" description="Routines & schedule" />
          <FeaturePreview icon={Moon} label="Sleep & Lifestyle" description="Habits & stress tips" />
          <FeaturePreview icon={Brain} label="Mental Wellness" description="Activities & guidance" />
        </div>
      </div>

      {/* Generate button */}
      <div className="text-center space-y-3">
        <Button
          size="lg"
          onClick={onGenerate}
          disabled={isGenerating || !isReady}
          className="w-full max-w-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Starting...
            </>
          ) : !isReady ? (
            <>
              <AlertTriangle className="mr-2 h-5 w-5" />
              Add More Data to Generate
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate My Wellness Plan
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          This plan is AI-generated and not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
}

function FeaturePreview({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Generating Your Plan</h2>
          <p className="mt-2 text-muted-foreground">
            AI is analyzing your complete medical history including reports, sessions,
            vitals, prescriptions, and memory context. This may take a minute...
          </p>
        </div>
        <div className="space-y-3">
          <LoadingStep label="Fetching patient profile & vitals" />
          <LoadingStep label="Analyzing medical reports" />
          <LoadingStep label="Reviewing session history & prescriptions" />
          <LoadingStep label="Querying memory context" />
          <LoadingStep label="Generating personalized plan" />
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function FailedState({
  errorMessage,
  onRetry,
  isGenerating,
}: {
  errorMessage?: string;
  onRetry: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Generation Failed</h2>
          <p className="mt-2 text-muted-foreground">
            {errorMessage || "Something went wrong while generating your wellness plan."}
          </p>
        </div>
        <Button size="lg" onClick={onRetry} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function WellnessPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
