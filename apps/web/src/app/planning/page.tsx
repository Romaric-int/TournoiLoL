function ConstructionIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export default function PlanningPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 text-[var(--muted)] background-image-grid">
      <ConstructionIcon />
      <p className="text-xl font-medium">En travaux</p>
    </main>
  );
}
