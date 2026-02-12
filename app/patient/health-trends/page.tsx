"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  Activity,
  Heart,
  Droplets,
  Weight,
  Thermometer,
  Wind,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from "lucide-react";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { toast } from "sonner";

interface Vital {
  _id: string;
  _creationTime: number;
  patientClerkId: string;
  recordedAt: string;
  type: string;
  value: number;
  secondaryValue?: number;
  unit: string;
  notes?: string;
  source: string;
}

interface VitalType {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  color: string;
  hasSecondary: boolean;
  secondaryLabel?: string;
  normalRange?: { min: number; max: number };
}

const VITAL_TYPES: VitalType[] = [
  {
    key: "blood_pressure",
    label: "Blood Pressure",
    icon: Activity,
    unit: "mmHg",
    color: "hsl(var(--chart-1))",
    hasSecondary: true,
    secondaryLabel: "Diastolic",
    normalRange: { min: 90, max: 140 },
  },
  {
    key: "heart_rate",
    label: "Heart Rate",
    icon: Heart,
    unit: "bpm",
    color: "hsl(var(--chart-2))",
    hasSecondary: false,
    normalRange: { min: 60, max: 100 },
  },
  {
    key: "blood_sugar",
    label: "Blood Sugar",
    icon: Droplets,
    unit: "mg/dL",
    color: "hsl(var(--chart-3))",
    hasSecondary: false,
    normalRange: { min: 70, max: 140 },
  },
  {
    key: "weight",
    label: "Weight",
    icon: Weight,
    unit: "kg",
    color: "hsl(var(--chart-4))",
    hasSecondary: false,
  },
  {
    key: "temperature",
    label: "Temperature",
    icon: Thermometer,
    unit: "°F",
    color: "hsl(var(--chart-5))",
    hasSecondary: false,
    normalRange: { min: 97, max: 99.5 },
  },
  {
    key: "oxygen_saturation",
    label: "SpO2",
    icon: Wind,
    unit: "%",
    color: "hsl(var(--chart-1))",
    hasSecondary: false,
    normalRange: { min: 95, max: 100 },
  },
];

export default function HealthTrendsPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";
  const [showAddVital, setShowAddVital] = useState(false);
  const [selectedType, setSelectedType] = useState("blood_pressure");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const vitals = useQuery(
    api.queries.vitals.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  const recordVital = useMutation(api.mutations.vitals.record);

  const isLoading = !vitals;

  // Form state
  const [formType, setFormType] = useState("blood_pressure");
  const [formValue, setFormValue] = useState("");
  const [formSecondary, setFormSecondary] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formNotes, setFormNotes] = useState("");

  const currentVitalType = VITAL_TYPES.find((v) => v.key === selectedType)!;

  // Filter vitals by time range
  const filteredVitals = useMemo(() => {
    if (!vitals) return [] as Vital[];
    const now = new Date();
    const rangeMap = {
      "7d": subDays(now, 7),
      "30d": subDays(now, 30),
      "90d": subDays(now, 90),
      all: new Date(0),
    };
    const cutoff = rangeMap[timeRange];
    return vitals
      .filter(
        (v: Vital) =>
          v.type === selectedType && isAfter(parseISO(v.recordedAt), cutoff)
      )
      .sort(
        (a: Vital, b: Vital) =>
          parseISO(a.recordedAt).getTime() - parseISO(b.recordedAt).getTime()
      );
  }, [vitals, selectedType, timeRange]);

  // Chart data
  const chartData = useMemo(() => {
    return filteredVitals.map((v: Vital) => ({
      date: format(parseISO(v.recordedAt), "MMM d"),
      fullDate: format(parseISO(v.recordedAt), "MMM d, yyyy"),
      value: v.value,
      secondary: v.secondaryValue,
    }));
  }, [filteredVitals]);

  const chartConfig: ChartConfig = {
    value: {
      label: currentVitalType.label,
      color: currentVitalType.color,
    },
    secondary: {
      label: currentVitalType.secondaryLabel ?? "Secondary",
      color: "hsl(var(--chart-2))",
    },
  };

  // Calculate trend
  const trend = useMemo(() => {
    if (filteredVitals.length < 2) return null;
    const recent = filteredVitals.slice(-3);
    const earlier = filteredVitals.slice(0, 3);
    const recentAvg =
      recent.reduce((sum: number, v: Vital) => sum + v.value, 0) / recent.length;
    const earlierAvg =
      earlier.reduce((sum: number, v: Vital) => sum + v.value, 0) / earlier.length;
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    return {
      direction: change > 2 ? "up" : change < -2 ? "down" : "stable",
      percentage: Math.abs(change).toFixed(1),
    };
  }, [filteredVitals]);

  // Stats per vital type
  const vitalStats = useMemo(() => {
    if (!vitals) return {};
    const stats: Record<
      string,
      { latest?: number; count: number; trend?: string }
    > = {};
    for (const vt of VITAL_TYPES) {
      const typeVitals = (vitals as Vital[])
        .filter((v: Vital) => v.type === vt.key)
        .sort(
          (a: Vital, b: Vital) =>
            parseISO(b.recordedAt).getTime() -
            parseISO(a.recordedAt).getTime()
        );
      stats[vt.key] = {
        latest: typeVitals[0]?.value,
        count: typeVitals.length,
      };
    }
    return stats;
  }, [vitals]);

  const handleAddVital = async () => {
    if (!patientClerkId || !formValue) return;

    const vitalType = VITAL_TYPES.find((v) => v.key === formType);
    if (!vitalType) return;

    try {
      await recordVital({
        patientClerkId,
        recordedAt: new Date(formDate).toISOString(),
        type: formType,
        value: parseFloat(formValue),
        secondaryValue: formSecondary
          ? parseFloat(formSecondary)
          : undefined,
        unit: vitalType.unit,
        notes: formNotes || undefined,
        source: "manual",
      });
      toast.success("Vital recorded!");
      setShowAddVital(false);
      setFormValue("");
      setFormSecondary("");
      setFormNotes("");
    } catch (error) {
      console.error("Failed to record vital:", error);
      toast.error("Failed to record vital.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Trends</h1>
          <p className="text-muted-foreground">
            Track and visualize your vital signs over time.
          </p>
        </div>
        <Button onClick={() => setShowAddVital(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Record Vitals
        </Button>
      </div>

      {/* Vital Type Overview Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {VITAL_TYPES.map((vt) => {
          const stats = vitalStats[vt.key];
          const isSelected = selectedType === vt.key;
          const VtIcon = vt.icon;

          return (
            <Card
              key={vt.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/30"
              }`}
              onClick={() => setSelectedType(vt.key)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <VtIcon
                    className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="text-xs font-medium truncate">
                    {vt.label}
                  </span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-12 mt-1" />
                ) : stats?.latest !== undefined ? (
                  <p className="text-lg font-bold">
                    {stats.latest}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {vt.unit}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = currentVitalType.icon;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              <div>
                <CardTitle className="text-lg">
                  {currentVitalType.label} Trend
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredVitals.length} readings
                  {trend && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      {trend.direction === "up" ? (
                        <TrendingUp className="h-3 w-3 text-amber-500" />
                      ) : trend.direction === "down" ? (
                        <TrendingDown className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-green-500" />
                      )}
                      <span className="text-xs">
                        {trend.direction === "stable"
                          ? "Stable"
                          : `${trend.percentage}% ${trend.direction}`}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Tabs
              value={timeRange}
              onValueChange={(v) =>
                setTimeRange(v as "7d" | "30d" | "90d" | "all")
              }
            >
              <TabsList>
                <TabsTrigger value="7d">7D</TabsTrigger>
                <TabsTrigger value="30d">30D</TabsTrigger>
                <TabsTrigger value="90d">90D</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={currentVitalType.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={currentVitalType.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentVitalType.color}
                  strokeWidth={2}
                  fill="url(#fillValue)"
                  dot={{ r: 3, fill: currentVitalType.color }}
                  activeDot={{ r: 5 }}
                />
                {currentVitalType.hasSecondary && (
                  <Area
                    type="monotone"
                    dataKey="secondary"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="none"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
              <p className="font-medium">No {currentVitalType.label} data</p>
              <p className="text-sm text-muted-foreground">
                Start recording to see trends over time.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setFormType(selectedType);
                  setShowAddVital(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Record Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Readings */}
      {filteredVitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredVitals
                .slice()
                .reverse()
                .slice(0, 10)
                .map((vital: Vital) => {
                  const isOutOfRange =
                    currentVitalType.normalRange &&
                    (vital.value < currentVitalType.normalRange.min ||
                      vital.value > currentVitalType.normalRange.max);

                  return (
                    <div
                      key={vital._id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        isOutOfRange ? "border-amber-500/30 bg-amber-500/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(
                              parseISO(vital.recordedAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                        {vital.notes && (
                          <span className="text-xs text-muted-foreground">
                            — {vital.notes}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {vital.value}
                          {vital.secondaryValue !== undefined &&
                            `/${vital.secondaryValue}`}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {vital.unit}
                        </span>
                        {isOutOfRange && (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs">
                            Out of range
                          </Badge>
                        )}
                        {vital.source === "ai_extracted" && (
                          <Badge variant="secondary" className="text-xs">
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Vital Dialog */}
      <Dialog open={showAddVital} onOpenChange={setShowAddVital}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vital Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VITAL_TYPES.map((vt) => (
                    <SelectItem key={vt.key} value={vt.key}>
                      {vt.label} ({vt.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  {VITAL_TYPES.find((v) => v.key === formType)?.hasSecondary
                    ? "Systolic"
                    : "Value"}
                </Label>
                <Input
                  type="number"
                  placeholder={`e.g. ${
                    formType === "blood_pressure"
                      ? "120"
                      : formType === "heart_rate"
                        ? "72"
                        : formType === "blood_sugar"
                          ? "100"
                          : formType === "weight"
                            ? "70"
                            : formType === "temperature"
                              ? "98.6"
                              : "98"
                  }`}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
              {VITAL_TYPES.find((v) => v.key === formType)?.hasSecondary && (
                <div className="space-y-2">
                  <Label>Diastolic</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 80"
                    value={formSecondary}
                    onChange={(e) => setFormSecondary(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g. After morning walk"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddVital}
              className="w-full"
              disabled={!formValue}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Vital
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
