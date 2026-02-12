"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DoctorList } from "@/components/patient/doctor-card";
import { Search, Filter, Stethoscope } from "lucide-react";
import { SPECIALIZATIONS } from "@/lib/constants";

export default function BrowseDoctorsPage() {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState<string>("all");

  const doctors = useQuery(api.queries.doctors.getAll);
  const isLoading = !doctors;

  // Filter doctors
  const filteredDoctors = doctors?.filter((doctor) => {
    // Specialization filter
    if (specialization !== "all" && doctor.specialization !== specialization) {
      return false;
    }

    // Name search
    if (search && !doctor.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find a Doctor</h1>
        <p className="text-muted-foreground">
          Search doctors by specialization and book an appointment.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by doctor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={specialization}
              onValueChange={setSpecialization}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {SPECIALIZATIONS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="h-4 w-4" />
          <span>
            {filteredDoctors?.length ?? 0} doctor(s) found
            {specialization !== "all" && ` in ${specialization}`}
          </span>
        </div>
      )}

      {/* Doctor Cards */}
      <DoctorList doctors={filteredDoctors ?? []} isLoading={isLoading} />
    </div>
  );
}
