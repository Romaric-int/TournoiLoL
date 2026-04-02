"use client";

import { useEffect, useState } from 'react';

type Team = {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  captain: { id: string; name: string | null };
  members: Array<{ user: { id: string; name: string | null } }>;
};

export default function MercatoPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postulant, setPostulant] = useState<string | null>(null);
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTeams() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/team/list');
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || 'Impossible de charger les équipes.');
          return;
        }

        setTeams(data.teams ?? []);
      } catch {
        setError('Impossible de contacter le serveur.');
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  async function handlePostuler(teamId: string) {
    setPostulant(teamId);
    setActionMessages((prev) => ({ ...prev, [teamId]: '' }));

    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionMessages((prev) => ({
          ...prev,
          [teamId]: data?.message || data?.error || 'Impossible de rejoindre cette équipe.',
        }));
        return;
      }

      setActionMessages((prev) => ({ ...prev, [teamId]: 'Demande envoyée !' }));
    } catch {
      setActionMessages((prev) => ({ ...prev, [teamId]: 'Impossible de contacter le serveur.' }));
    } finally {
      setPostulant(null);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16 background-image-grid">
      <div className="w-full max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold text-[var(--foreground)]">Mercato</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">Découvre les équipes qui recrutent et contacte les capitaines.</p>

        {loading && <p className="text-[var(--muted)]">Chargement...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && teams.length === 0 && (
          <p className="text-[var(--muted)]">Aucune équipe disponible pour le moment.</p>
        )}

        <div className="flex flex-col gap-4">
          {teams.map((team) => (
            <article key={team.id} className="glass rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">{team.name}</h2>
                  <p className="text-sm text-[var(--muted)]">{team.tag}</p>
                </div>
                <button
                  onClick={() => handlePostuler(team.id)}
                  disabled={postulant === team.id}
                  className="cursor-pointer rounded-md border border-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {postulant === team.id ? 'Envoi...' : 'Postuler'}
                </button>
              </div>
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={`${team.name} logo`} className="mt-2 h-14 w-14 rounded-md object-cover" />
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">Aucun logo défini</p>
              )}
              <p className="mt-3 text-xs text-[var(--muted)]">
                Capitaine : {team.captain.name || 'Utilisateur anonyme'} | Membres : {team.members.length}
              </p>
              {actionMessages[team.id] && (
                <p className={`mt-2 text-xs ${actionMessages[team.id] === 'Demande envoyée !' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {actionMessages[team.id]}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
