export default function SessionPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Session</h1>
      <p className="text-muted-foreground">
        Record audio, view transcript, and get AI-generated summaries.
      </p>
      {/* Audio recorder + transcript + AI summary panel will be added here */}
    </div>
  );
}
