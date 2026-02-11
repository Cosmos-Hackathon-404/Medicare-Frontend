export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar navigation will be added here */}
      <aside className="hidden w-64 border-r bg-muted/40 md:block">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-semibold">Medicare AI</span>
        </div>
        <nav className="space-y-1 p-4">
          {/* Patient nav links will be added here */}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
