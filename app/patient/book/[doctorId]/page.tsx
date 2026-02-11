export default function BookDoctorPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Book Appointment</h1>
      <p className="text-muted-foreground">
        Select an available slot and confirm your appointment.
      </p>
      {/* Slot picker + confirm will be added here */}
    </div>
  );
}
