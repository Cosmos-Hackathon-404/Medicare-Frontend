"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  ShieldX,
  Trash2,
  Search,
  Users,
  BadgeCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

const ADMIN_PASSKEY = "medicare404";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const allDoctors = useQuery(api.queries.doctors.getAll);
  const setVerified = useMutation(api.mutations.admin.setDoctorVerified);
  const deleteDoctor = useMutation(api.mutations.admin.deleteDoctorProfile);

  const handleLogin = () => {
    if (passkey === ADMIN_PASSKEY) {
      setAuthenticated(true);
      setPasskeyError(false);
    } else {
      setPasskeyError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Panel</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the admin passkey to continue
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter passkey"
              value={passkey}
              onChange={(e) => {
                setPasskey(e.target.value);
                setPasskeyError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={passkeyError ? "border-red-500" : ""}
            />
            {passkeyError && (
              <p className="text-xs text-red-500">Incorrect passkey</p>
            )}
            <Button className="w-full" onClick={handleLogin}>
              Access Panel
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Demo passkey: <code className="bg-muted px-1 rounded">medicare404</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doctors = allDoctors ?? [];
  const filtered = searchTerm
    ? doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.nmcNumber?.includes(searchTerm) ||
          d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : doctors;

  const verifiedCount = doctors.filter((d) => d.verified).length;
  const pendingCount = doctors.filter((d) => !d.verified).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Medicare Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage doctor verification and profiles
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuthenticated(false)}
            >
              Lock Panel
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctors.length}</p>
                <p className="text-xs text-muted-foreground">Total Doctors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <BadgeCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, NMC number, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Doctor list */}
        {!allDoctors ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">
                {searchTerm ? "No doctors match your search" : "No doctor profiles yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((doctor) => (
              <Card
                key={doctor._id}
                className={
                  doctor.verified
                    ? "border-green-200 dark:border-green-900/50"
                    : "border-amber-200 dark:border-amber-900/50"
                }
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">Dr. {doctor.name}</h3>
                        {doctor.verified ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                            <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{doctor.email}</span>
                        <span>
                          NMC: <code className="bg-muted px-1 rounded">{doctor.nmcNumber ?? "N/A"}</code>
                        </span>
                        <span>{doctor.specialization}</span>
                        {doctor.hospital && <span>{doctor.hospital}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {doctor.verified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                          onClick={() =>
                            setVerified({
                              doctorId: doctor._id,
                              verified: false,
                            })
                          }
                        >
                          <ShieldX className="mr-1.5 h-4 w-4" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            setVerified({
                              doctorId: doctor._id,
                              verified: true,
                            })
                          }
                        >
                          <ShieldCheck className="mr-1.5 h-4 w-4" />
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete Dr. ${doctor.name}'s profile? This cannot be undone.`
                            )
                          ) {
                            deleteDoctor({ doctorId: doctor._id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
