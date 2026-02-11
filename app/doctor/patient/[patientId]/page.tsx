export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Patient Details</h1>
      <p className="text-muted-foreground">
        View patient sessions, reports, and profile information.
      </p>
      {/* Tabbed view: Sessions / Reports / Profile will be added here */}
    </div>
  );
}
