"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    if (error === 'OAuthCallbackError' && !showErrorPopup) {
      setShowErrorPopup(true);
    }
  }, [error, showErrorPopup]);

  useEffect(() => {
    if (showErrorPopup) {
      const timer = setTimeout(() => {
        setShowErrorPopup(false);
        router.replace('/');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showErrorPopup, router]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 background-image-grid">

      {/* popup d'erreur OAuth */}
      {showErrorPopup && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          Une erreur est survenue lors de la connexion OAuth
        </div>
      )}

      {/* lueur centrale */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] opacity-[0.06] blur-3xl" />

      {/* contenu principal */}
      <div className="glass relative flex flex-col items-center gap-8 rounded-2xl px-8 py-12 text-center sm:px-12 sm:py-16">

        {/* badge */}
        <div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-sm text-[var(--accent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Saison 1 — Inscriptions ouvertes
        </div>

        {/* titre principal */}
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-[var(--foreground)] md:text-7xl">
          Inscription ouverte !
        </h1>

        {/* sous-titre */}
        <p className="max-w-xl text-lg text-[var(--muted)]">
          Participez à notre tournoi League of Legends basé sur un système de points selon le rank !
          Chaque équipe dispose de 100 points pour composer un roster équilibré et favoriser le mélange des joueurs de la communauté.

          Inscrivez-vous en solo ou en équipe et prenez part au mercato pour créer des compositions uniques et compétitives.
        </p>

        {/* actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/rateme" className="glow cursor-pointer rounded-lg bg-[var(--accent)] px-8 py-3 font-medium text-white transition-all hover:bg-[var(--accent-hover)]">
            S'inscrire
          </Link>
          <button className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] px-8 py-3 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]">
            Voir les équipes
          </button>
        </div>

        {/* stats */}
        <div className="mt-8 flex gap-12">
          {[
            { valeur: "128", label: "Joueurs" },
            { valeur: "32", label: "Équipes" },
            { valeur: "16", label: "Matchs" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-[var(--foreground)]">
                {stat.valeur}
              </span>
              <span className="text-sm text-[var(--muted)]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
