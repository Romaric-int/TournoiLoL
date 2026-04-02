"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

type TeamMember = {
  role?: Role | null;
  user: {
    id: string;
    name?: string | null;
    riotAccount?: { iconUrl?: string | null; points?: number | null } | null;
  };
};

type Team = {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string | null;
  captain: { id: string; name?: string | null };
  members: TeamMember[];
};

const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const ROLE_ICONS: Record<Role, string> = {
  TOP:     '/images/logo_top.png',
  JUNGLE:  '/images/logo_jgl.png',
  MID:     '/images/logo_mid.png',
  ADC:     '/images/logo_adc.png',
  SUPPORT: '/images/logo_support.png',
};

const ROLE_COLORS: Record<Role, string> = {
  TOP:     'from-orange-500/50 to-orange-900/60 border-orange-500/70 text-orange-300',
  JUNGLE:  'from-emerald-500/50 to-emerald-900/60 border-emerald-500/70 text-emerald-300',
  MID:     'from-blue-500/50 to-blue-900/60 border-blue-500/70 text-blue-300',
  ADC:     'from-red-500/50 to-red-900/60 border-red-500/70 text-red-300',
  SUPPORT: 'from-violet-500/50 to-violet-900/60 border-violet-500/70 text-violet-300',
};

const ROLE_GLOW: Record<Role, string> = {
  TOP:     'rgba(249,115,22,0.4)',
  JUNGLE:  'rgba(16,185,129,0.4)',
  MID:     'rgba(59,130,246,0.4)',
  ADC:     'rgba(239,68,68,0.4)',
  SUPPORT: 'rgba(139,92,246,0.4)',
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const dragging = useRef<{ userId: string; fromRole: Role | null } | null>(null);
  const [dragOverZone, setDragOverZone] = useState<Role | 'pending' | null>(null);

  const isCaptain = session?.user?.id === team?.captain.id;

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const res = await fetch('/api/team/my');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Impossible de charger l'équipe");
      }
      const data = await res.json();
      setTeam(data?.team ?? null);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement de l'équipe");
    } finally {
      setLoading(false);
    }
  }

  async function assignRole(userId: string, role: Role) {
    if (!team) return false;
    setError(null);
    setActionMessage(null);
    const res = await fetch('/api/team/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.id, userId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || data.message || "Impossible d'assigner le rôle");
      return false;
    }
    return true;
  }

  async function unassignRole(userId: string) {
    if (!team) return false;
    setError(null);
    setActionMessage(null);
    const res = await fetch('/api/team/unassign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.id, userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || data.message || "Impossible de retirer le rôle");
      return false;
    }
    return true;
  }

  function onDragStart(userId: string, fromRole: Role | null) {
    dragging.current = { userId, fromRole };
  }

  function onDragEnd() {
    dragging.current = null;
    setDragOverZone(null);
  }

  async function onDropOnSlot(targetRole: Role) {
    setDragOverZone(null);
    const d = dragging.current;
    if (!d || !team) return;
    if (d.fromRole === targetRole) return;

    const occupant = team.members.find((m) => m.role === targetRole);
    if (occupant && occupant.user.id !== d.userId) {
      const ok = await unassignRole(occupant.user.id);
      if (!ok) return;
    }
    if (d.fromRole !== null) {
      const ok = await unassignRole(d.userId);
      if (!ok) return;
    }
    const ok = await assignRole(d.userId, targetRole);
    if (ok) {
      setActionMessage(`Rôle ${targetRole} attribué`);
      await fetchTeam();
    }
  }

  async function onDropOnPending() {
    setDragOverZone(null);
    const d = dragging.current;
    if (!d || !team) return;
    if (d.fromRole === null) return;
    const ok = await unassignRole(d.userId);
    if (ok) {
      setActionMessage('Joueur remis en attente');
      await fetchTeam();
    }
  }

  function getPendingMembers() {
    if (!team) return [] as TeamMember[];
    return team.members.filter((m) => !m.role);
  }

  const assignedCount = team?.members.filter((m) => m.role).length ?? 0;
  const totalPoints = team?.members.reduce((sum, m) => sum + (m.user.riotAccount?.points ?? 0), 0) ?? 0;

  return (
    <div className="background-image-grid min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* En-tête de page */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">Mon équipe</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isCaptain
              ? 'Glisse les joueurs vers un slot de rôle pour composer ton équipe.'
              : 'Composition et membres de ton équipe.'}
          </p>
        </div>

        {/* Messages de retour */}
        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        {actionMessage && (
          <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            {actionMessage}
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
            </svg>
            Chargement...
          </div>
        )}

        {/* Pas d'équipe */}
        {!loading && !team && (
          <div className="glass mx-auto max-w-sm rounded-xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[var(--muted)]" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-5.059 5.2a9 9 0 0 1-6-13.5M12 3a9 9 0 0 1 7.5 13.5M12 3v6m0 0 2-2m-2 2-2-2" />
              </svg>
            </div>
            <p className="mb-1 font-semibold text-[var(--foreground)]">Aucune équipe</p>
            <p className="mb-6 text-sm text-[var(--muted)]">Tu ne fais pas encore partie d&apos;une équipe.</p>
            <Link
              href="/team-create"
              className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors glow"
            >
              Créer une équipe
            </Link>
          </div>
        )}

        {/* Contenu équipe */}
        {team && (
          <div className="flex flex-col gap-6">

            {/* Carte info équipe */}
            <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm p-5">
              <div className="flex items-center gap-5">
                {team.logoUrl ? (
                  <Image
                    src={team.logoUrl}
                    alt={`${team.name} logo`}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-xl object-contain ring-2 ring-[var(--accent)]/30"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-2xl font-bold text-[var(--accent)]">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] truncate">{team.name}</h2>
                    <span className="shrink-0 rounded bg-white/8 px-2 py-0.5 text-xs font-mono text-[var(--accent)] border border-white/20">
                      {team.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    Capitaine : <span className="text-[var(--foreground)]">{team.captain.name ?? 'Inconnu'}</span>
                  </p>
                </div>
                <div className="shrink-0 flex gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-[var(--muted)]">Composition</span>
                    <span className="text-2xl font-bold text-[var(--foreground)]">
                      {assignedCount}<span className="text-[var(--muted)] text-base font-normal">/5</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-[var(--muted)]">Points total</span>
                    <span className={`text-2xl font-bold ${totalPoints > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {totalPoints}<span className="text-[var(--muted)] text-base font-normal">/100</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone principale : pending + slots */}
            <div className="flex gap-5 items-stretch">

              {/* Panneau joueurs en attente */}
              <aside
                onDragOver={(e) => { if (isCaptain) { e.preventDefault(); setDragOverZone('pending'); } }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => { e.preventDefault(); onDropOnPending(); }}
                className={`w-52 shrink-0 rounded-xl border p-4 transition-all duration-150 ${
                  dragOverZone === 'pending'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg shadow-[var(--accent)]/10'
                    : 'border-white/15 bg-white/5 backdrop-blur-sm'
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--muted)]" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    En attente
                  </h3>
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-[var(--muted)]">
                    {getPendingMembers().length}
                  </span>
                </div>

                {dragOverZone === 'pending' && (
                  <div className="mb-2 rounded-md border border-dashed border-[var(--accent)]/50 px-2 py-3 text-center text-xs text-[var(--accent)]">
                    Retirer le rôle
                  </div>
                )}

                {getPendingMembers().length === 0 && dragOverZone !== 'pending' ? (
                  <p className="text-xs text-[var(--muted)] text-center py-4">
                    {isCaptain ? 'Tous les joueurs ont un rôle.' : 'Aucun joueur en attente.'}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {getPendingMembers().map((member) => (
                      <li
                        key={member.user.id}
                        draggable={isCaptain}
                        onDragStart={() => onDragStart(member.user.id, null)}
                        onDragEnd={onDragEnd}
                        className={`group flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-[var(--foreground)] transition-colors ${
                          isCaptain ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent)]/60' : ''
                        }`}
                      >
                        {member.user.riotAccount?.iconUrl ? (
                          <Image src={member.user.riotAccount.iconUrl} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover border border-white/20" />
                        ) : (
                          <div className="h-6 w-6 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                            {(member.user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate flex-1">{member.user.name || 'Utilisateur'}</span>
                        {member.user.id === team.captain.id && (
                          <span className="shrink-0 text-[10px] text-[var(--accent)]">Cap.</span>
                        )}
                        {member.user.riotAccount?.points != null && (
                          <span className="shrink-0 rounded-md bg-[var(--accent)]/20 border border-[var(--accent)]/40 px-1.5 py-0.5 text-xs font-bold text-[var(--accent)]">{member.user.riotAccount.points}pts</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {isCaptain && (
                  <p className="mt-4 text-[10px] text-[var(--muted)] text-center leading-relaxed">
                    Glisse un joueur<br />vers un slot pour l&apos;assigner
                  </p>
                )}
              </aside>

              {/* Slots de rôles */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 auto-rows-fr">
                {ROLES.map((role) => {
                  const slot = team.members.find((m) => m.role === role);
                  const isOver = dragOverZone === role;
                  const colors = ROLE_COLORS[role];

                  return (
                    <div
                      key={role}
                      onDragOver={(e) => { if (isCaptain) { e.preventDefault(); setDragOverZone(role); } }}
                      onDragLeave={() => setDragOverZone(null)}
                      onDrop={(e) => { e.preventDefault(); onDropOnSlot(role); }}
                      style={isOver ? { boxShadow: `0 0 24px ${ROLE_GLOW[role]}` } : undefined}
                      className={`rounded-xl border bg-gradient-to-b p-4 transition-all duration-150 flex flex-col gap-3 h-full ${colors} ${
                        isOver ? 'scale-[1.02]' : ''
                      }`}
                    >
                      {/* En-tête du slot */}
                      <div className="flex items-center gap-2">
                        <Image src={ROLE_ICONS[role]} alt={role} width={24} height={24} className="w-6 h-6 object-contain" />
                        <span className={`text-sm font-bold tracking-wide ${colors.split(' ').find(c => c.startsWith('text-')) ?? ''}`}>
                          {role}
                        </span>
                      </div>

                      {/* Contenu du slot */}
                      <div className="flex-1">
                        {slot ? (
                          <div
                            draggable={isCaptain}
                            onDragStart={() => onDragStart(slot.user.id, role)}
                            onDragEnd={onDragEnd}
                            className={`flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 ${
                              isCaptain ? 'cursor-grab active:cursor-grabbing' : ''
                            }`}
                          >
                            {slot.user.riotAccount?.iconUrl ? (
                              <Image src={slot.user.riotAccount.iconUrl} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover border border-white/20" />
                            ) : (
                              <div className="h-7 w-7 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                                {(slot.user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {slot.user.name || 'Utilisateur'}
                              </p>
                              {slot.user.id === team.captain.id && (
                                <p className="text-[10px] text-white/50">Capitaine</p>
                              )}
                            </div>
                            {slot.user.riotAccount?.points != null && (
                              <span className="shrink-0 rounded-md bg-black/30 border border-white/20 px-1.5 py-0.5 text-xs font-bold text-white">{slot.user.riotAccount.points}pts</span>
                            )}
                          </div>
                        ) : (
                          <div className={`flex h-full min-h-[52px] items-center justify-center rounded-lg border border-dashed border-white/15 transition-all ${
                            isOver ? 'border-white/40 bg-white/5' : ''
                          }`}>
                            <p className="text-xs text-white/30">
                              {isOver ? 'Déposer ici' : 'Libre'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pied de page */}
            <div className="flex justify-end">
              <Link
                href="/mercato"
                className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-[var(--accent)]/50 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                Voir le mercato
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}