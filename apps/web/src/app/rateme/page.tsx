"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// icône Discord en SVG
function DiscordIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

type RiotPlayer = {
  puuid: string;
  summonerId: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
  iconUrl: string;
  rank: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
  } | null;
};

// compte Riot tel que stocké en base
type LinkedAccount = {
  gameName: string;
  tagLine: string;
  iconUrl: string | null;
  tier: string | null;
  rank: string | null;
  lp: number | null;
  wins: number | null;
  losses: number | null;
  points: number | null;
  roles: string[];
  lastRefreshedAt: string | null;
};

const MIN_GAMES = 50;

export default function RateMePage() {
  const { data: session, status } = useSession();


  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingLinked, setFetchingLinked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<RiotPlayer | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccount | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [roleModalFromToggle, setRoleModalFromToggle] = useState(false);
  const [lookingForTeam, setLookingForTeam] = useState(false);
  const [acceptDm, setAcceptDm] = useState(false);

  // récupère le compte Riot déjà lié et les préférences si connecté
  useEffect(() => {
    if (status !== "authenticated") return;

    setFetchingLinked(true);

    async function safeFetchJson(url: string) {
      const res = await fetch(url);
      const text = await res.text();
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }

    Promise.all([safeFetchJson("/api/riot/me"), safeFetchJson("/api/user/preferences")])
      .then(([riotData, prefData]) => {
        if (riotData?.riotAccount) setLinkedAccount(riotData.riotAccount);
        if (prefData?.preferences) {
          setLookingForTeam(prefData.preferences.lookingForTeam);
          setAcceptDm(prefData.preferences.acceptDm);
        }
      })
      .catch(() => {
        setError("Impossible de charger les données, veuillez réessayer.");
      })
      .finally(() => setFetchingLinked(false));
  }, [status]);

  // met à jour une préférence et sauvegarde en base
  async function togglePreference(key: "lookingForTeam" | "acceptDm", value: boolean) {
    if (key === "lookingForTeam") setLookingForTeam(value);
    else setAcceptDm(value);

    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  // ouvre la modal en pré-remplissant les rôles existants
  function openRoleModal(fromToggle = false) {
    setSelectedRoles(linkedAccount?.roles ?? []);
    setRoleModalFromToggle(fromToggle);
    setShowRoleModal(true);
  }

  // sauvegarde les rôles en base
  async function handleConfirmRoles() {
    setSavingRoles(true);
    try {
      const res = await fetch("/api/riot/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la sauvegarde des rôles");
        return;
      }
      setLinkedAccount((prev) => prev ? { ...prev, roles: data.riotAccount.roles } : prev);
      setShowRoleModal(false);
      // si la modal a été ouverte depuis le toggle "je recherche une équipe", on l'active
      if (roleModalFromToggle) {
        await togglePreference("lookingForTeam", true);
      }
    } finally {
      setSavingRoles(false);
    }
  }

  // actualise les données Riot depuis l'API
  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/riot/refresh", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'actualisation");
        return;
      }

      setLinkedAccount(data.riotAccount);
    } finally {
      setRefreshing(false);
    }
  }

  // sauvegarde du compte Riot en base
  async function handleConfirm() {
    if (!player) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/riot/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puuid: player.puuid,
          summonerId: player.summonerId,
          gameName: player.gameName,
          tagLine: player.tagLine,
          profileIconId: player.profileIconId,
          iconUrl: player.iconUrl,
          rank: player.rank,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la sauvegarde");
        return;
      }

      setLinkedAccount({ ...data.riotAccount, roles: data.riotAccount.roles ?? [] });
      setLookingForTeam(false);
      setAcceptDm(false);
      setPlayer(null);
    } finally {
      setSaving(false);
    }
  }

  // recherche du joueur via l'API Riot
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPlayer(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/riot/account?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return;
      }

      setPlayer(data);
    } finally {
      setLoading(false);
    }
  }

  // chargement session ou compte lié
  if (status === "loading" || fetchingLinked) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  // éligibilité calculée côté client à partir des données DB
  const totalGames = (linkedAccount?.wins ?? 0) + (linkedAccount?.losses ?? 0);
  const missingGames = Math.max(0, MIN_GAMES - totalGames);
  const rankIneligible = linkedAccount !== null && linkedAccount.points === null;
  const eligible = linkedAccount !== null && !rankIneligible && missingGames === 0;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">

      {/* grille de fond décorative */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* lueur centrale */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] opacity-[0.06] blur-3xl" />

      <div className="relative w-full max-w-md">

        {/* non connecté */}
        {!session ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Inscription</h1>
            <p className="text-[var(--muted)]">
              Connecte-toi avec Discord pour lier ton compte Riot et t&apos;inscrire au tournoi.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="glow flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--accent)] px-8 py-3 font-medium text-white transition-all hover:bg-[var(--accent-hover)]"
            >
              <DiscordIcon />
              Se connecter avec Discord
            </button>
          </div>

        ) : linkedAccount ? (

          /* compte Riot déjà lié — affichage des infos */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative flex w-full flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">

              {/* bouton actualiser */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title="Actualiser"
                className="absolute right-3 top-3 cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={refreshing ? "animate-spin" : ""}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </button>

              {/* date du dernier refresh */}
              {linkedAccount.lastRefreshedAt && (
                <p className="absolute left-3 top-3.5 text-[10px] text-[var(--muted)]">
                  {new Date(linkedAccount.lastRefreshedAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {/* icône */}
              {linkedAccount.iconUrl && (
                <div className="relative">
                  <Image
                    src={linkedAccount.iconUrl}
                    alt="Icône invocateur"
                    width={96}
                    height={96}
                    className="rounded-full border-2 border-[var(--accent)]"
                  />
                </div>
              )}

              {/* nom */}
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo_riot.png"
                  alt="Riot Games"
                  width={28}
                  height={28}
                  className="rounded-sm"
                />
                <div className="text-left">
                  <p className="text-xl font-bold text-[var(--foreground)]">
                    {linkedAccount.gameName}
                  </p>
                  <p className="text-sm text-[var(--muted)]">#{linkedAccount.tagLine}</p>
                </div>
              </div>

              {/* rang */}
              {linkedAccount.tier ? (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2">
                  <span className="font-semibold text-[var(--foreground)]">
                    {linkedAccount.tier} {linkedAccount.rank}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-[var(--muted)]">Non classé</span>
              )}

              {/* éligibilité et points */}
              {eligible ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                    <span className="text-sm font-semibold text-emerald-400">
                      {linkedAccount.points} points
                    </span>
                  </div>
                  {/* rôles sélectionnés */}
                  {linkedAccount.roles.length > 0 ? (
                    <div className="flex w-full flex-col gap-2">
                      <div className="flex flex-wrap justify-center gap-2">
                        {linkedAccount.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => openRoleModal()}
                        className="cursor-pointer text-xs text-[var(--muted)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:underline"
                      >
                        Modifier mes rôles
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openRoleModal()}
                      className="cursor-pointer text-xs text-[var(--muted)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:underline"
                    >
                      Ajouter mes rôles
                    </button>
                  )}

                  {/* préférences joueur */}
                  <div className="flex w-full flex-col gap-3">
                    {[
                      { key: "lookingForTeam" as const, label: "Je recherche une équipe", value: lookingForTeam },
                      { key: "acceptDm" as const, label: "J'accepte les DM Discord", value: acceptDm },
                    ].map(({ key, label, value }) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (key === "lookingForTeam" && !value && linkedAccount.roles.length === 0) {
                            openRoleModal(true);
                            return;
                          }
                          togglePreference(key, !value);
                        }}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 transition-colors hover:border-[var(--accent)]/50"
                      >
                        <span className="text-sm text-[var(--foreground)]">{label}</span>
                        <div className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}>
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : rankIneligible ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2">
                  <span className="text-sm font-semibold text-red-400">Inéligible — rang hors barème</span>
                </div>
              ) : (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2">
                  <span className="text-sm font-semibold text-orange-400">
                    Inéligible — il te manque {missingGames} game{missingGames > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          </div>

        ) : (

          /* connecté sans compte lié — formulaire */
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Lier ton compte Riot</h1>
              <p className="mt-2 text-[var(--muted)]">
                Saisis ton Riot ID pour lier ton compte League of Legends.
              </p>
            </div>

            {/* formulaire de recherche */}
            {!player && (
              <form onSubmit={handleSearch} className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  <span className="flex items-center text-[var(--muted)]">#</span>
                  <input
                    type="text"
                    placeholder="TAG"
                    value={tagLine}
                    onChange={(e) => setTagLine(e.target.value)}
                    required
                    maxLength={5}
                    className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="glow cursor-pointer rounded-lg bg-[var(--accent)] py-3 font-medium text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Recherche..." : "Rechercher"}
                </button>
              </form>
            )}

            {/* carte joueur trouvé */}
            {player && (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">

                <div className="relative">
                  <Image
                    src={player.iconUrl}
                    alt="Icône invocateur"
                    width={96}
                    height={96}
                    className="rounded-full border-2 border-[var(--accent)]"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                    {player.summonerLevel}
                  </span>
                </div>

                <div>
                  <p className="text-xl font-bold text-[var(--foreground)]">{player.gameName}</p>
                  <p className="text-sm text-[var(--muted)]">#{player.tagLine}</p>
                </div>

                {player.rank ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm">
                    <span className="font-semibold text-[var(--foreground)]">
                      {player.rank.tier} {player.rank.rank}
                    </span>
                    <span className="text-[var(--muted)]">·</span>
                    <span className="text-[var(--muted)]">{player.rank.lp} LP</span>
                    <span className="text-[var(--muted)]">·</span>
                    <span className="text-[var(--muted)]">
                      {player.rank.wins}V {player.rank.losses}D
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-[var(--muted)]">Non classé</span>
                )}

                <p className="text-[var(--muted)]">C&apos;est bien toi ?</p>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setPlayer(null)}
                    className="flex-1 cursor-pointer rounded-lg border border-[var(--border)] py-2 text-sm text-[var(--muted)] transition-colors hover:border-red-500/50 hover:text-red-400"
                  >
                    Non, recommencer
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="glow flex-1 cursor-pointer rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Enregistrement..." : "Oui, c'est moi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 flex w-full justify-center">
        <Link href="/create-team" className="glow cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]">
          Créer une équipe
        </Link>
      </div>

      {/* modal sélection des rôles */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-[var(--foreground)]">Tes rôles</h2>
            <p className="mb-5 text-sm text-[var(--muted)]">
              Sélectionne les rôles que tu souhaites jouer en équipe.
            </p>

            <div className="flex flex-col gap-2">
              {["Top", "Jungle", "Mid", "Bot", "Support"].map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() =>
                      setSelectedRoles((prev) =>
                        active ? prev.filter((r) => r !== role) : [...prev, role]
                      )
                    }
                    className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 cursor-pointer rounded-lg border border-[var(--border)] py-2 text-sm text-[var(--muted)] transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                Annuler
              </button>
              <button
                disabled={selectedRoles.length === 0 || savingRoles}
                onClick={handleConfirmRoles}
                className="glow flex-1 cursor-pointer rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingRoles ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
