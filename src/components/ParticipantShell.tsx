export function ParticipantShell({
  title,
  step,
  totalSteps,
  children,
}: {
  title: string;
  step?: number;
  totalSteps?: number;
  children: React.ReactNode;
}) {
  const pct = step && totalSteps ? Math.round((step / totalSteps) * 100) : null;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-lg font-bold">{title}</h1>
        {pct !== null && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full bg-neutral-900 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </header>
      {children}
    </main>
  );
}
